import uuid

from sqlalchemy import Column, DateTime, Numeric, String, Text, func

from app.core.db import Base
from app.core.db_types import GUID, JSONField


class CompanyProfile(Base):
    __tablename__ = "company_profiles"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    company_name = Column(String(200), unique=True, nullable=False)
    typical_skills = Column(JSONField, nullable=True)
    typical_exp_years = Column(Numeric(4, 1), nullable=True)
    common_programs = Column(JSONField, nullable=True)
    hiring_notes = Column(Text, nullable=True)
    last_updated = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
