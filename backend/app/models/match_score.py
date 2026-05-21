import uuid
from sqlalchemy import Column, DateTime, ForeignKey, Numeric, UniqueConstraint, func
from app.core.db import Base
from app.core.db_types import GUID, JSONField


class MatchScore(Base):
    __tablename__ = "match_scores"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    job_id = Column(GUID(), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)

    overall_score = Column(Numeric(5, 2), nullable=True)
    skills_score = Column(Numeric(5, 2), nullable=True)
    experience_score = Column(Numeric(5, 2), nullable=True)
    education_score = Column(Numeric(5, 2), nullable=True)
    project_score = Column(Numeric(5, 2), nullable=True)
    domain_score = Column(Numeric(5, 2), nullable=True)

    gap_analysis = Column(JSONField, nullable=True)
    computed_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("user_id", "job_id", name="uq_match_scores_user_job"),
    )
