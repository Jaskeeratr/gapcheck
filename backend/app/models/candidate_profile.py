import uuid
from sqlalchemy import Column, DateTime, ForeignKey, Integer, Numeric, Text, func
from app.core.db import Base
from app.core.db_types import GUID, JSONField


class CandidateProfile(Base):
    __tablename__ = "candidate_profiles"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    resume_text = Column(Text, nullable=True)
    skills = Column(JSONField, nullable=True)
    experience_years = Column(Numeric(4, 1), nullable=True)
    internship_count = Column(Integer, nullable=False, default=0)
    experience_items = Column(JSONField, nullable=True)
    projects = Column(JSONField, nullable=True)
    education = Column(JSONField, nullable=True)
    domains = Column(JSONField, nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
