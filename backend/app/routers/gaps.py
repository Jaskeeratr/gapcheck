from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.models.match_score import MatchScore

router = APIRouter()


@router.get("/{user_id}/{job_id}")
def get_gap_analysis(user_id: UUID, job_id: UUID, db: Session = Depends(get_db)) -> dict[str, Any]:
    score = db.query(MatchScore).filter(MatchScore.user_id == user_id, MatchScore.job_id == job_id).first()
    if not score:
        raise HTTPException(status_code=404, detail="Match score not found for user/job")

    if not score.gap_analysis:
        raise HTTPException(status_code=404, detail="Gap analysis not available yet")

    return score.gap_analysis
