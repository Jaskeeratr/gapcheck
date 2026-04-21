import uuid
from sqlalchemy import Column, DateTime, ForeignKey, Integer, Numeric, Text, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.core.db import Base


class CandidateProfile(Base):
    __tablename__ = "candidate_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    resume_text = Column(Text, nullable=True)
    skills = Column(JSONB, nullable=True)
    experience_years = Column(Numeric(4, 1), nullable=True)
    internship_count = Column(Integer, nullable=False, default=0)
    experience_items = Column(JSONB, nullable=True)
    projects = Column(JSONB, nullable=True)
    education = Column(JSONB, nullable=True)
    domains = Column(JSONB, nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
