import os
import base64
import json
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import firebase_admin
from firebase_admin import credentials, auth

# We will initialize this when the app starts if the credential file exists
firebase_app = None

security = HTTPBearer()

def decode_firebase_jwt_unverified(token: str) -> dict:
    """
    Decodes a Firebase JWT without verifying the signature.
    This is used as a development fallback when serviceAccountKey.json is not present.
    WARNING: This should NOT be used in production without the full signature verification.
    """
    try:
        # JWT has 3 parts: header.payload.signature - we only need the payload
        parts = token.split('.')
        if len(parts) != 3:
            raise ValueError("Invalid JWT format")
        
        # Base64 URL decode the payload (add padding if needed)
        payload_b64 = parts[1]
        padding = 4 - len(payload_b64) % 4
        if padding != 4:
            payload_b64 += '=' * padding
        payload_bytes = base64.urlsafe_b64decode(payload_b64)
        payload = json.loads(payload_bytes)
        
        # Map Firebase JWT claim names to what our app expects
        return {
            "uid": payload.get("user_id") or payload.get("sub"),
            "email": payload.get("email"),
            "name": payload.get("name"),
            "picture": payload.get("picture"),
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not decode authentication token: {str(e)}",
        )


def get_current_user(token: HTTPAuthorizationCredentials = Depends(security)):
    """ Validates the Firebase JWT and extracts the user ID """
    if firebase_app:
        # Production path: Full cryptographic verification via Firebase Admin SDK
        try:
            decoded_token = auth.verify_id_token(token.credentials)
            return decoded_token
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid authentication credentials: {str(e)}",
                headers={"WWW-Authenticate": "Bearer"},
            )
    else:
        # Development fallback: Decode JWT claims without signature verification
        # This works because Firebase tokens ARE valid JWTs, just not verified server-side
        print("WARNING: Using unverified JWT decode (dev mode - serviceAccountKey.json not found)")
        return decode_firebase_jwt_unverified(token.credentials)
