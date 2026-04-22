from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any


@dataclass
class NormalizedJobListing:
    source: str
    external_id: str
    title: str
    company: str
    location: str
    description: str
    apply_url: str | None = None
    posted_at: datetime | None = None
    role_type: str | None = None
    domain: str | None = None
    required_skills: list[dict[str, Any]] | None = None
    experience_required: float | None = None

    def normalized_posted_at(self) -> datetime:
        if self.posted_at is None:
            return datetime.now(timezone.utc)
        if self.posted_at.tzinfo is None:
            return self.posted_at.replace(tzinfo=timezone.utc)
        return self.posted_at.astimezone(timezone.utc)

