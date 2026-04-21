from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel


class ScoreComputeRequest(BaseModel):
    user_id: UUID
    job_id: UUID
    force_recompute: bool = False


class MatchScoreResponse(BaseModel):
    id: UUID
    user_id: UUID
    job_id: UUID
    overall_score: float
    skills_score: float
    experience_score: float
    education_score: float
    project_score: float
    domain_score: float
    gap_analysis: dict[str, Any] | None = None
    computed_at: datetime

    class Config:
        from_attributes = True
