from fastapi import FastAPI, HTTPException, Depends, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import text
from geoalchemy2.elements import WKTElement
import os
import subprocess
import firebase_admin
from firebase_admin import credentials

from . import models, auth
from .database import engine, get_db
from .storage import storage_manager
import uuid

# Initialize Firebase Admin (Needs 'serviceAccountKey.json' in backend root)
cred_path = os.path.join(os.path.dirname(__file__), "..", "serviceAccountKey.json")
if os.path.exists(cred_path):
    cred = credentials.Certificate(cred_path)
    auth.firebase_app = firebase_admin.initialize_app(cred)
    print("Firebase Admin Initialized successfully.")
else:
    print("WARNING: serviceAccountKey.json not found. Firebase Auth will fail.")

# Create database tables automatically
models.Base.metadata.create_all(bind=engine)

from fastapi import FastAPI, HTTPException, Depends, WebSocket, WebSocketDisconnect
from typing import Dict, List
import json

app = FastAPI(
    title="Cleo PetAlert API",
    description="High-performance backend for Cleo PetAlert with PostGIS spatial mapping.",
    version="1.0.0"
)

@app.post("/api/images/upload")
async def upload_image(
    file: UploadFile = File(...),
    folder: str = "general",
    decoded_token: dict = Depends(auth.get_current_user)
):
    """
    Uploads an image to Cloudflare R2.
    Usage: Send 'file' as multipart/form-data. Optional 'folder' query param.
    """
    try:
        # Generate a unique filename using UUID
        extension = file.filename.split(".")[-1] if "." in file.filename else "jpg"
        unique_name = f"{folder}/{uuid.uuid4()}.{extension}"
        
        # Read file contents
        contents = await file.read()
        
        # Upload using our storage manager
        public_url = storage_manager.upload_file(
            file_content=contents,
            object_name=unique_name,
            content_type=file.content_type
        )
        
        if not public_url:
            raise HTTPException(status_code=500, detail="Failed to upload image to cloud storage.")
            
        return {"url": public_url}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal upload error: {str(e)}")



def get_or_create_user(decoded_token: dict, db: Session) -> models.UserDB:
    """ Gets user from DB by Firebase UID, or creates them if they don't exist yet. """
    uid = decoded_token.get("uid")
    user = db.query(models.UserDB).filter(models.UserDB.firebase_uid == uid).first()
    if not user:
        user = models.UserDB(
            firebase_uid=uid,
            email=decoded_token.get("email") or f"{uid}@firebase.local",
            full_name=decoded_token.get("name"),
            avatar_url=decoded_token.get("picture")
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user

# --- WebSocket Connection Manager ---
class ConnectionManager:
    def __init__(self):
        # Maps user_id to their active WebSocket connection
        self.active_connections: Dict[int, WebSocket] = {}

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: int):
        if user_id in self.active_connections:
            del self.active_connections[user_id]

    async def send_personal_message(self, message: str, user_id: int):
        if user_id in self.active_connections:
            await self.active_connections[user_id].send_text(message)

manager = ConnectionManager()

@app.websocket("/api/chats/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int, db: Session = Depends(get_db)):
    await manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_text()
            # Expecting JSON data: {"receiver_id": 123, "content": "Hello", "conversation_id": 4}
            message_data = json.loads(data)
            receiver_id = message_data.get("receiver_id")
            content = message_data.get("content")
            conversation_id = message_data.get("conversation_id")
            
            if receiver_id and content and conversation_id:
                # 1. Save message to PostgreSQL database
                new_msg = models.MessageDB(
                    conversation_id=conversation_id,
                    sender_id=user_id,
                    content=content
                )
                db.add(new_msg)
                db.commit()
                db.refresh(new_msg)
                
                # 2. Send real-time notification to receiver if online
                # We send back a JSON string that the frontend can parse
                payload = json.dumps({
                    "id": new_msg.id,
                    "sender_id": user_id,
                    "content": content,
                    "conversation_id": conversation_id,
                    "created_at": new_msg.created_at.isoformat()
                })
                await manager.send_personal_message(payload, receiver_id)
                # 3. Echo back to sender for optimistic UI update confirmation
                await manager.send_personal_message(payload, user_id)
                
    except WebSocketDisconnect:
        manager.disconnect(user_id)

@app.post("/api/users/login", response_model=models.UserResponse)
def login_user(decoded_token: dict = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    """ Logs the user in and auto-registers them in PostgreSQL if needed. """
    user = get_or_create_user(decoded_token, db)
    return user

@app.put("/api/users/profile", response_model=models.UserResponse)
def update_user_profile(
    profile: models.UserUpdate,
    decoded_token: dict = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """ Updates the logged-in user's profile data. """
    user = get_or_create_user(decoded_token, db)
    
    if profile.full_name is not None:
        user.full_name = profile.full_name
    if profile.avatar_url is not None:
        user.avatar_url = profile.avatar_url
    if profile.id_number is not None:
        user.id_number = profile.id_number
    if profile.phone is not None:
        user.phone = profile.phone
    if profile.location is not None:
        user.location = profile.location
        
    db.commit()
    db.refresh(user)
    return user

@app.post("/api/alerts/", response_model=models.PetAlertResponse)
def create_alert(alert: models.PetAlertCreate, db: Session = Depends(get_db)):
    """ Create a new pet alert and store its location as a PostGIS Geometry Point. """
    # Convert lat/lng to WKT (Well-Known Text) for PostGIS
    point_wkt = f"POINT({alert.location.lng} {alert.location.lat})"
    
    db_alert = models.PetAlertDB(
        type=alert.type,
        species=alert.species,
        breed=alert.breed,
        description=alert.description,
        location=WKTElement(point_wkt, srid=4326),
        image_url=None  # Handle image upload logic later
    )
    
    db.add(db_alert)
    db.commit()
    db.refresh(db_alert)
    
    # Needs to convert Geometry back to pydantic model format
    return models.PetAlertResponse(
        id=db_alert.id,
        type=db_alert.type,
        species=db_alert.species,
        breed=db_alert.breed,
        description=db_alert.description,
        location=alert.location, # Return input location for simplicity right now
        has_image=alert.has_image,
        image_url=db_alert.image_url
    )

@app.get("/api/alerts/nearby/")
def get_nearby_alerts(lat: float, lng: float, radius_km: float = 10.0, db: Session = Depends(get_db)):
    """ Find pets within a specific radius using ultra-fast PostGIS ST_DWithin """
    # Convert Radius to meters (Geography mapping)
    radius_meters = radius_km * 1000
    
    # Construct searching point
    search_point = f"SRID=4326;POINT({lng} {lat})"
    
    # Query using GeoAlchemy's ST_DWithin
    # We cast geography to accurately measure distance in meters regardless of world projection
    query = text(f"""
        SELECT id, type, species, breed, description, 
               ST_X(location::geometry) as lng, ST_Y(location::geometry) as lat
        FROM pet_alerts
        WHERE ST_DWithin(
            location::geography, 
            ST_GeomFromEWKT('{search_point}')::geography, 
            {radius_meters}
        ) AND is_active = true
        ORDER BY created_at DESC
        LIMIT 50;
    """)
    
    result = db.execute(query).fetchall()
    
    alerts = []
    for row in result:
        alerts.append({
            "id": row.id,
            "type": row.type,
            "species": row.species,
            "breed": row.breed,
            "description": row.description,
            "location": {"lat": row.lat, "lng": row.lng}
        })
        
    return {"radius_km": radius_km, "center": {"lat": lat, "lng": lng}, "results": alerts}

@app.get("/api/alerts/")
def get_all_alerts(db: Session = Depends(get_db)):
    """ Get all active alerts without filtering """
    query = text("""
        SELECT id, type, species, breed, description, 
               ST_X(location::geometry) as lng, ST_Y(location::geometry) as lat
        FROM pet_alerts
        WHERE is_active = true
        ORDER BY created_at DESC
        LIMIT 100;
    """)
    result = db.execute(query).fetchall()
    
    alerts = []
    for row in result:
        alerts.append({
            "id": row.id,
            "type": row.type,
            "species": row.species,
            "breed": row.breed,
            "description": row.description,
            "location": {"lat": row.lat, "lng": row.lng}
        })
    return alerts

@app.post("/api/images/compress")
def compress_image(image_path: str):
    """ Simulated Mojo connection for Image Compression """
    mojo_binary = "/app/mojo_core/image_compressor_bin"
    if os.path.exists(mojo_binary):
        try:
            result = subprocess.run([mojo_binary, image_path], capture_output=True, text=True)
            if result.returncode == 0:
                return {"status": "success", "message": "Image compressed with Mojo!", "output": result.stdout}
            else:
                raise HTTPException(status_code=500, detail="Mojo compression failed.")
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    else:
        return {"status": "simulated", "message": "Mojo binary not found. Simulated compression successful."}

# =================== ADOPTION ENDPOINTS ===================

@app.get("/api/adoptions/feed", response_model=list[models.PetAdoptionResponse])
def get_adoption_feed(decoded_token: dict = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    """
    Returns pets available for adoption that the current user hasn't swiped yet.
    This is the core intelligence: no duplicates, ever.
    """
    uid = decoded_token.get("uid")
    user = get_or_create_user(decoded_token, db)

    # Get the IDs of all pets this user has already swiped (liked OR passed)
    already_swiped_ids = [
        s.pet_id for s in db.query(models.SwipeDB.pet_id).filter(models.SwipeDB.user_id == user.id).all()
    ]

    # Get up to 20 available pets the user hasn't seen, excluding their own pets
    query = db.query(models.PetAdoptionDB).filter(
        models.PetAdoptionDB.is_available == True,
        models.PetAdoptionDB.owner_id != user.id,
    )
    if already_swiped_ids:
        query = query.filter(models.PetAdoptionDB.id.notin_(already_swiped_ids))

    pets = query.order_by(models.PetAdoptionDB.created_at.desc()).limit(20).all()
    return pets


@app.post("/api/adoptions/swipe")
def swipe_pet(swipe: models.SwipeCreate, decoded_token: dict = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    """
    Records a swipe (like or pass). On 'like', automatically creates a conversation
    between the interested user and the pet's owner.
    """
    user = get_or_create_user(decoded_token, db)

    pet = db.query(models.PetAdoptionDB).filter(models.PetAdoptionDB.id == swipe.pet_id).first()
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")

    # Record the swipe
    db_swipe = models.SwipeDB(user_id=user.id, pet_id=swipe.pet_id, direction=swipe.direction)
    db.add(db_swipe)
    db.commit()

    conversation_id = None

    if swipe.direction == "like":
        # Check if a conversation already exists between these two users for this pet
        existing_conv = db.query(models.ConversationDB).filter(
            models.ConversationDB.pet_id == pet.id,
            (
                (models.ConversationDB.user1_id == user.id) &
                (models.ConversationDB.user2_id == pet.owner_id)
            ) | (
                (models.ConversationDB.user1_id == pet.owner_id) &
                (models.ConversationDB.user2_id == user.id)
            )
        ).first()

        if not existing_conv:
            # 🎉 Auto-create a chat between interested user and pet owner!
            new_conv = models.ConversationDB(
                user1_id=user.id,
                user2_id=pet.owner_id,
                pet_id=pet.id
            )
            db.add(new_conv)
            db.commit()
            db.refresh(new_conv)
            conversation_id = new_conv.id

            # Send an automatic first message from the system
            welcome_msg = models.MessageDB(
                conversation_id=new_conv.id,
                sender_id=user.id,
                content=f"¡Hola! Me encantó el perfil de {pet.name}. ¿Podrías contarme más sobre él/ella?"
            )
            db.add(welcome_msg)
            db.commit()
        else:
            conversation_id = existing_conv.id

    return {"status": "ok", "direction": swipe.direction, "conversation_id": conversation_id}


@app.post("/api/adoptions/", response_model=models.PetAdoptionResponse)
def create_adoption_listing(
    name: str, species: str, description: str,
    breed: str = "", age_months: int = 12, size: str = "medium",
    is_vaccinated: bool = False, is_neutered: bool = False,
    decoded_token: dict = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """ Create a new pet adoption listing. The logged-in user becomes the owner. """
    user = get_or_create_user(decoded_token, db)

    pet = models.PetAdoptionDB(
        owner_id=user.id, name=name, species=species, breed=breed,
        age_months=age_months, size=size, description=description,
        is_vaccinated=is_vaccinated, is_neutered=is_neutered
    )
    db.add(pet)
    db.commit()
    db.refresh(pet)
    return pet


