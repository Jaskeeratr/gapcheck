import uuid
from sqlalchemy import Column, String, Integer, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from app.core.db import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False)
    name = Column(String(200), nullable=True)
    university = Column(String(200), nullable=True)
    program = Column(String(200), nullable=True)
    grad_year = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())