from pydantic import BaseModel
from typing import List, Optional

class UserCreate(BaseModel):
    username: str
    email: str
    password: str

class OTPRequest(BaseModel):
    username: str
    email: str

class OTPVerify(BaseModel):
    username: str
    email: str
    password: str
    otp: str

class UserLogin(BaseModel):
    username: str
    password: str

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    email: str
    otp: str
    new_password: str

class UserResponse(BaseModel):
    username: str
    class Config:
        from_attributes = True

class ProfileBase(BaseModel):
    full_name: str
    age: int
    education: str
    interests: List[str]
    skills: List[str]
    profile_pic: Optional[str] = None
    gender: Optional[str] = None
    points: Optional[int] = 0
    badges: Optional[str] = None
    linkedin_url: Optional[str] = ""
    github_url: Optional[str] = ""

class TaskBase(BaseModel):
    title: str
    is_completed: bool = False

class TaskResponse(TaskBase):
    id: int
    username: str
    class Config:
        from_attributes = True

class ProfileCreate(ProfileBase):
    pass

class ProfileUpdate(ProfileBase):
    pass

class ProfileResponse(ProfileBase):
    username: str
    class Config:
        from_attributes = True

class HistoryBase(BaseModel):
    education: str
    skills: str
    interests: str
    goal: str

class HistoryCreate(HistoryBase):
    pass

class HistoryResponse(HistoryBase):
    id: int
    username: str
    response: str
    resources: Optional[str] = None
    class Config:
        from_attributes = True
