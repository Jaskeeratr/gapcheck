from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


Difficulty = Literal["Beginner", "Intermediate", "Advanced"]


class ProjectRecommendation(BaseModel):
    title: str
    difficulty: Difficulty
    estimated_time: str
    skills_covered: list[str] = Field(default_factory=list)
    recruiter_impact: str
    suggested_tech_stack: list[str] = Field(default_factory=list)
    why_this_project_helps: str


class RecommendationResponse(BaseModel):
    job_id: str | None = None
    recommendations: list[ProjectRecommendation] = Field(default_factory=list)
