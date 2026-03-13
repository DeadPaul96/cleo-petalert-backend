from pydantic import BaseModel, Field
from typing import Optional
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from geoalchemy2 import Geometry
from .database import Base

# --- SQLAlchemy ORM Models (Database) ---

class UserDB(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    firebase_uid = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    id_number = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    location = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    is_active = Column(Boolean, default=True)

class PetAlertDB(Base):
    __tablename__ = "pet_alerts"

    id = Column(Integer, primary_key=True, index=True)
    # Foreign key relationship to User would be added here later (e.g. user_id = Column(Integer, ForeignKey("users.id")))
    type = Column(String, index=True)  # 'lost' or 'found'
    species = Column(String, index=True)
    breed = Column(String)
    description = Column(String)
    # PostGIS: Store location as a POINT geometry for ultra-fast radius queries
    location = Column(Geometry('POINT', srid=4326)) 
    image_url = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    is_active = Column(Boolean, default=True)

class ConversationDB(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    # Using simple integers to avoid complex foreign key setup for now, 
    # but in production these would be ForeignKey("users.id")
    user1_id = Column(Integer, index=True) 
    user2_id = Column(Integer, index=True)
    # Optional context (e.g. which pet they are chatting about)
    pet_id = Column(Integer, nullable=True) 
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class MessageDB(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, index=True) # ForeignKey("conversations.id")
    sender_id = Column(Integer, index=True)       # ForeignKey("users.id")
    content = Column(String, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class PetAdoptionDB(Base):
    __tablename__ = "pet_adoptions"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, index=True)          # ForeignKey("users.id") of the rescue/owner
    name = Column(String, nullable=False)
    species = Column(String, index=True)            # 'dog', 'cat', 'rabbit', etc.
    breed = Column(String, nullable=True)
    age_months = Column(Integer, nullable=True)     # Age in months for flexibility
    size = Column(String, nullable=True)            # 'small', 'medium', 'large'
    description = Column(String, nullable=True)
    image_url = Column(String, nullable=True)
    is_vaccinated = Column(Boolean, default=False)
    is_neutered = Column(Boolean, default=False)
    is_available = Column(Boolean, default=True)    # False when adopted
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class SwipeDB(Base):
    __tablename__ = "swipes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)           # Who swiped
    pet_id = Column(Integer, index=True)            # Which pet
    direction = Column(String, nullable=False)      # 'like' or 'pass'
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# --- Pydantic Schemas (API Input/Output) ---

class LocationSchema(BaseModel):
    lat: float
    lng: float

class PetAlertCreate(BaseModel):
    type: str = Field(..., description="Either 'lost' or 'found'")
    species: str
    breed: str
    description: str
    location: LocationSchema
    has_image: bool = False

class PetAlertResponse(PetAlertCreate):
    id: int
    image_url: Optional[str] = None
    
    class Config:
        from_attributes = True

class UserCreate(BaseModel):
    firebase_uid: str
    email: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    id_number: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    firebase_uid: str
    email: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    id_number: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    
    class Config:
        from_attributes = True

class PetAdoptionResponse(BaseModel):
    id: int
    owner_id: int
    name: str
    species: str
    breed: Optional[str] = None
    age_months: Optional[int] = None
    size: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    is_vaccinated: bool
    is_neutered: bool
    is_available: bool

    class Config:
        from_attributes = True

class SwipeCreate(BaseModel):
    pet_id: int
    direction: str  # 'like' or 'pass'
