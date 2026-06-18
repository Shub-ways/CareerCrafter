from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True, nullable=True)
    hashed_password = Column(String)
    is_verified = Column(Boolean, default=False)
    otp_code = Column(String, nullable=True)
    otp_expiry = Column(DateTime, nullable=True)

class Profile(Base):
    __tablename__ = "profiles"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    full_name = Column(String)
    age = Column(Integer)
    education = Column(String)
    interests = Column(Text) # Stored as comma-separated
    skills = Column(Text) # Stored as comma-separated
    profile_pic = Column(String)
    gender = Column(String, nullable=True)
    points = Column(Integer, default=0)
    badges = Column(Text, nullable=True)
    linkedin_url = Column(String, nullable=True)
    github_url = Column(String, nullable=True)

class History(Base):
    __tablename__ = "history"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, index=True)
    education = Column(String)
    skills = Column(Text)
    interests = Column(Text)
    goal = Column(String)
    response = Column(Text)
    resources = Column(Text, nullable=True) # Stored as JSON string

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, index=True)
    title = Column(String)
    is_completed = Column(Boolean, default=False)
