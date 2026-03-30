import uuid
from sqlalchemy import Column, DateTime, ForeignKey, Numeric, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.core.db import Base


class MatchScore(Base):
    __tablename__ = "match_scores"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    job_id = Column(UUID(as_uuid=True), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)

    overall_score = Column(Numeric(5, 2), nullable=True)
    skills_score = Column(Numeric(5, 2), nullable=True)
    experience_score = Column(Numeric(5, 2), nullable=True)
    education_score = Column(Numeric(5, 2), nullable=True)
    project_score = Column(Numeric(5, 2), nullable=True)
    domain_score = Column(Numeric(5, 2), nullable=True)

    gap_analysis = Column(JSONB, nullable=True)
    computed_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("user_id", "job_id", name="uq_match_scores_user_job"),
    )