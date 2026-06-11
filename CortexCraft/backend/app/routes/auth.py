from fastapi import APIRouter, HTTPException, status
from datetime import datetime, timedelta
from bson import ObjectId
import random

# pyrefly: ignore [missing-import]
from config.db import get_database
# pyrefly: ignore [missing-import]
from models.user import UserSignup, UserLogin, GoogleLoginRequest, SendOTPRequest, VerifyOTPRequest
# pyrefly: ignore [missing-import]
from utils.auth import hash_password, verify_password, create_access_token, verify_google_token
# pyrefly: ignore [missing-import]
from utils.email import send_otp_email

router = APIRouter(prefix="/auth", tags=["authentication"])

@router.post("/signup", status_code=status.HTTP_201_CREATED)
async def signup(signup_data: UserSignup):
    db = get_database()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection is not active"
        )
        
    email_clean = signup_data.email.strip().lower()
    
    # Check if user already exists
    existing_user = await db["users"].find_one({"email": email_clean})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already registered"
        )
        
    # Generate default avatar
    seed_name = signup_data.name.replace(" ", "")
    avatar_url = f"https://api.dicebear.com/7.x/avataaars/svg?seed={seed_name}"
    
    # Construct user document
    user_doc = {
        "email": email_clean,
        "name": signup_data.name.strip(),
        "password_hash": hash_password(signup_data.password),
        "avatar": avatar_url,
        "created_at": datetime.utcnow()
    }
    
    result = await db["users"].insert_one(user_doc)
    user_id = str(result.inserted_id)
    
    # Create session JWT token
    token = create_access_token({"sub": user_id, "email": email_clean})
    
    return {
        "token": token,
        "user": {
            "id": user_id,
            "email": email_clean,
            "name": user_doc["name"],
            "avatar": avatar_url
        }
    }

@router.post("/login")
async def login(login_data: UserLogin):
    db = get_database()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection is not active"
        )
        
    email_clean = login_data.email.strip().lower()
    
    # Find user by email
    user = await db["users"].find_one({"email": email_clean})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
        
    # Verify password
    hashed_pwd = user.get("password_hash")
    if not hashed_pwd or not verify_password(login_data.password, hashed_pwd):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
        
    user_id = str(user["_id"])
    token = create_access_token({"sub": user_id, "email": email_clean})
    
    return {
        "token": token,
        "user": {
            "id": user_id,
            "email": email_clean,
            "name": user["name"],
            "avatar": user.get("avatar")
        }
    }

@router.post("/google")
async def google_login(google_req: GoogleLoginRequest):
    db = get_database()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection is not active"
        )
        
    # Verify Google token
    payload = verify_google_token(google_req.id_token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google ID Token"
        )
        
    email = payload.get("email").strip().lower()
    name = payload.get("name", "Google User")
    avatar = payload.get("picture")
    google_id = payload.get("sub")
    
    if not avatar:
        seed_name = name.replace(" ", "")
        avatar = f"https://api.dicebear.com/7.x/avataaars/svg?seed={seed_name}"
        
    # Check if user already exists in DB by email
    user = await db["users"].find_one({"email": email})
    
    if user:
        user_id = str(user["_id"])
        # Update google_id or avatar if missing or changed
        updates = {}
        if not user.get("google_id"):
            updates["google_id"] = google_id
        if avatar and user.get("avatar") != avatar:
            updates["avatar"] = avatar
            
        if updates:
            await db["users"].update_one({"_id": user["_id"]}, {"$set": updates})
            
        # Refetch updated name/avatar
        name = user.get("name", name)
        avatar = updates.get("avatar", user.get("avatar", avatar))
    else:
        # Create new user
        new_user = {
            "email": email,
            "name": name,
            "google_id": google_id,
            "avatar": avatar,
            "created_at": datetime.utcnow()
        }
        result = await db["users"].insert_one(new_user)
        user_id = str(result.inserted_id)
        
    # Generate token
    token = create_access_token({"sub": user_id, "email": email})
    
    return {
        "token": token,
        "user": {
            "id": user_id,
            "email": email,
            "name": name,
            "avatar": avatar
        }
    }

@router.post("/otp/send")
async def send_otp(otp_req: SendOTPRequest):
    db = get_database()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection is not active"
        )
    
    email_clean = otp_req.email.strip().lower()
    if not email_clean:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email address is required"
        )

    # Generate 6-digit random code
    otp_code = f"{random.randint(100000, 999999)}"
    
    # Expiration: 5 minutes from now
    expires_at = datetime.utcnow() + timedelta(minutes=5)
    
    # Store/update OTP in database (collection 'otps')
    await db["otps"].update_one(
        {"email": email_clean},
        {
            "$set": {
                "otp": otp_code,
                "expires_at": expires_at,
                "created_at": datetime.utcnow()
            }
        },
        upsert=True
    )
    
    # Send the email (or log to terminal)
    success = send_otp_email(email_clean, otp_code)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to deliver OTP email"
        )
        
    return {"message": "OTP sent successfully"}

@router.post("/otp/verify")
async def verify_otp(verify_req: VerifyOTPRequest):
    db = get_database()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection is not active"
        )
        
    email_clean = verify_req.email.strip().lower()
    otp_input = verify_req.otp.strip()
    
    # Find active OTP in database
    otp_doc = await db["otps"].find_one({"email": email_clean})
    if not otp_doc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No OTP requested for this email"
        )
        
    # Check expiration
    if datetime.utcnow() > otp_doc["expires_at"]:
        await db["otps"].delete_one({"email": email_clean})
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP has expired"
        )
        
    # Check code
    if otp_doc["otp"] != otp_input:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP code"
        )
        
    # OTP is valid! Delete it so it can't be reused
    await db["otps"].delete_one({"email": email_clean})
    
    # Find or create user
    user = await db["users"].find_one({"email": email_clean})
    
    if user:
        user_id = str(user["_id"])
        name = user["name"]
        avatar = user.get("avatar")
    else:
        # Create a new user since it's a verification success on an unregistered email
        name = verify_req.name.strip() if verify_req.name else email_clean.split("@")[0]
        # Ensure name is not empty
        if not name:
            name = "New User"
            
        seed_name = name.replace(" ", "")
        avatar = f"https://api.dicebear.com/7.x/avataaars/svg?seed={seed_name}"
        
        new_user = {
            "email": email_clean,
            "name": name,
            "avatar": avatar,
            "created_at": datetime.utcnow()
        }
        result = await db["users"].insert_one(new_user)
        user_id = str(result.inserted_id)
        
    # Generate JWT token
    token = create_access_token({"sub": user_id, "email": email_clean})
    
    return {
        "token": token,
        "user": {
            "id": user_id,
            "email": email_clean,
            "name": name,
            "avatar": avatar
        }
    }

