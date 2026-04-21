from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel

ApplicationStatus = Literal[
    "applied",
    "phone_screen",
    "interview",
    "rejected",
    "offer",
]


class ApplicationCreate(BaseModel):
    user_id: UUID
    job_id: UUID
    status: ApplicationStatus = "applied"
    notes: str | None = None


class ApplicationUpdate(BaseModel):
    status: ApplicationStatus | None = None
    notes: str | None = None


class ApplicationResponse(BaseModel):
    id: UUID
    user_id: UUID
    job_id: UUID
    status: ApplicationStatus
    applied_at: datetime
    updated_at: datetime
    notes: str | None = None

    class Config:
        from_attributes = True
