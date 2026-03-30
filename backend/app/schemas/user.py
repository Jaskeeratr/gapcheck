from pydantic import BaseModel, EmailStr
from typing import Optional
from uuid import UUID
from datetime import datetime


class UserCreate(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    university: Optional[str] = None
    program: Optional[str] = None
    grad_year: Optional[int] = None


class UserResponse(BaseModel):
    id: UUID
    email: EmailStr
    name: Optional[str] = None
    university: Optional[str] = None
    program: Optional[str] = None
    grad_year: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True