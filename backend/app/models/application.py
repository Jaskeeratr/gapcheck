import uuid
from sqlalchemy import Column, DateTime, ForeignKey, String, Text, func
from app.core.db import Base
from app.core.db_types import GUID


class Application(Base):
    __tablename__ = "applications"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    job_id = Column(GUID(), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)

    status = Column(String(50), nullable=False, default="applied")
    applied_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    notes = Column(Text, nullable=True)
