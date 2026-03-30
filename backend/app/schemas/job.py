from pydantic import BaseModel
from typing import Optional, Any
from uuid import UUID
from datetime import datetime


class JobCreate(BaseModel):
    source: Optional[str] = None
    external_id: str
    title: str
    company: str
    location: Optional[str] = None
    description: Optional[str] = None
    required_skills: Optional[Any] = None
    experience_required: Optional[float] = None
    role_type: Optional[str] = None
    domain: Optional[str] = None


class JobResponse(BaseModel):
    id: UUID
    source: Optional[str] = None
    external_id: str
    title: str
    company: str
    location: Optional[str] = None
    description: Optional[str] = None
    required_skills: Optional[Any] = None
    experience_required: Optional[float] = None
    role_type: Optional[str] = None
    domain: Optional[str] = None
    posted_at: Optional[datetime] = None
    scraped_at: datetime
    is_active: bool

    class Config:
        from_attributes = True