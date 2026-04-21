from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


class CandidateProfileUpdate(BaseModel):
    resume_text: str | None = None
    skills: list[str] | None = None
    experience_years: float | None = None
    internship_count: int | None = None
    projects: list[dict[str, Any]] | None = None
    education: dict[str, Any] | None = None
    domains: list[str] | None = None


class CandidateProfileResponse(BaseModel):
    id: UUID
    user_id: UUID
    resume_text: str | None = None
    skills: list[str] | None = None
    experience_years: float | None = None
    internship_count: int = Field(default=0)
    projects: list[dict[str, Any]] | None = None
    education: dict[str, Any] | None = None
    domains: list[str] | None = None
    updated_at: datetime

    class Config:
        from_attributes = True
