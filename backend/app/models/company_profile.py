import uuid

from sqlalchemy import Column, DateTime, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID

from app.core.db import Base


class CompanyProfile(Base):
    __tablename__ = "company_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_name = Column(String(200), unique=True, nullable=False)
    typical_skills = Column(JSONB, nullable=True)
    typical_exp_years = Column(Numeric(4, 1), nullable=True)
    common_programs = Column(JSONB, nullable=True)
    hiring_notes = Column(Text, nullable=True)
    last_updated = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
