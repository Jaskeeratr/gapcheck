from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


SkillCategory = Literal["Technology", "Framework", "Cloud", "Database", "DevOps", "Soft Skill"]


class MissingSkill(BaseModel):
    name: str
    category: SkillCategory
    confidence: float = Field(ge=0.0, le=1.0)


class GapAnalysisOutput(BaseModel):
    verdict: str
    verdict_explanation: str
    gaps: list[dict[str, Any]]
    strengths: list[str]
    company_insight: str
    apply_recommendation: bool
    resume_baseline_score: float | None = None
    role_match_score: float | None = None
    resume_tip: str
    missing_skills: list[MissingSkill] = Field(default_factory=list)
