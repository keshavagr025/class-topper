from pydantic import BaseModel, Field
from typing import Optional

class UserSignup(BaseModel):
    email: str = Field(..., description="User email address")
    password: str = Field(..., min_length=6, description="Password must be at least 6 characters")
    name: str = Field(..., min_length=2, description="Name must be at least 2 characters")

class UserLogin(BaseModel):
    email: str
    password: str

class GoogleLoginRequest(BaseModel):
    id_token: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    avatar: Optional[str] = None

class SendOTPRequest(BaseModel):
    email: str = Field(..., description="User email address for OTP delivery")

class VerifyOTPRequest(BaseModel):
    email: str = Field(..., description="User email address")
    otp: str = Field(..., description="The 6-digit OTP code")
    name: Optional[str] = Field(None, description="Optional full name (for new user registration)")
