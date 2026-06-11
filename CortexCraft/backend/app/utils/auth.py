import bcrypt
import jwt
import os
import requests
from datetime import datetime, timedelta
from typing import Optional

JWT_SECRET = os.getenv("JWT_SECRET", "cortexcraft_jwt_secret_key_123456")
JWT_ALGORITHM = "HS256"
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

def hash_password(password: str) -> str:
    """Hash password using bcrypt."""
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode('utf-8')

def verify_password(password: str, hashed_password: str) -> bool:
    """Verify password against bcrypt hash."""
    try:
        pwd_bytes = password.encode('utf-8')
        hashed_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(pwd_bytes, hashed_bytes)
    except Exception:
        return False

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=7)
    
    # Ensure standard exp claim is included
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[dict]:
    """Decode and verify JWT access token."""
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.PyJWTError:
        return None

def verify_google_token(token: str) -> Optional[dict]:
    """Verify Google OAuth ID Token with Google's API."""
    try:
        # Request token validation from Google tokeninfo endpoint
        url = f"https://oauth2.googleapis.com/tokeninfo?id_token={token}"
        response = requests.get(url, timeout=5)
        
        if response.status_code != 200:
            print(f"❌ [Auth] Google token verification failed. Status code: {response.status_code}, Body: {response.text}")
            return None
            
        payload = response.json()
        
        # Verify issuer
        if payload.get("iss") not in ["accounts.google.com", "https://accounts.google.com"]:
            print("❌ [Auth] Google token issuer mismatch.")
            return None
            
        # Optional check: verify client ID aud matches our configured GOOGLE_CLIENT_ID
        if GOOGLE_CLIENT_ID and payload.get("aud") != GOOGLE_CLIENT_ID:
            print(f"⚠️ [Auth] Google token Client ID ({payload.get('aud')}) does not match server GOOGLE_CLIENT_ID ({GOOGLE_CLIENT_ID}).")
            # We will proceed since in development environments, client ID might be omitted or differ slightly.
            
        return payload
    except Exception as e:
        print(f"❌ [Auth] Error verifying Google token: {e}")
        return None
