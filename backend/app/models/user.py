import uuid
from sqlalchemy import Column, String, Integer, DateTime, func
from app.core.db import Base
from app.core.db_types import GUID


class User(Base):
    __tablename__ = "users"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False)
    name = Column(String(200), nullable=True)
    university = Column(String(200), nullable=True)
    program = Column(String(200), nullable=True)
    grad_year = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
