import uuid
from sqlalchemy import Column, String, Text, DateTime, Boolean, Numeric, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.core.db import Base


class Job(Base):
    __tablename__ = "jobs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source = Column(String(50), nullable=True)
    external_id = Column(String(200), unique=True, nullable=False)
    title = Column(String(300), nullable=False)
    company = Column(String(200), nullable=False)
    location = Column(String(200), nullable=True)
    description = Column(Text, nullable=True)
    required_skills = Column(JSONB, nullable=True)
    experience_required = Column(Numeric(4, 1), nullable=True)
    role_type = Column(String(50), nullable=True)
    domain = Column(String(100), nullable=True)
    posted_at = Column(DateTime(timezone=True), nullable=True)
    scraped_at = Column(DateTime(timezone=True), server_default=func.now())
    is_active = Column(Boolean, nullable=False, default=True)