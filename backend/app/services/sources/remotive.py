from __future__ import annotations

import json
from datetime import datetime
from urllib.request import urlopen

from app.core.config import settings
from app.services.sources.base import NormalizedJobListing
from app.services.sources.utils import (
    infer_domain,
    infer_experience_required,
    infer_required_skills,
    infer_role_type,
    is_student_friendly,
    strip_html,
)


def _to_datetime(raw_value: str | None) -> datetime | None:
    if not raw_value:
        return None
    try:
        return datetime.fromisoformat(raw_value.replace("Z", "+00:00"))
    except Exception:
        return None


def fetch_remotive_jobs(max_items: int = 120, student_only: bool = True) -> list[NormalizedJobListing]:
    url = "https://remotive.com/api/remote-jobs"
    try:
        with urlopen(url, timeout=settings.JOB_INGEST_TIMEOUT_SEC) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except Exception:
        return []

    listings: list[NormalizedJobListing] = []
    for row in (payload.get("jobs") or [])[:max_items]:
        title = str(row.get("title") or "").strip()
        if not title:
            continue
        description = strip_html(str(row.get("description") or "").strip())
        if student_only and not is_student_friendly(title, description):
            continue
        company = str(row.get("company_name") or "Unknown").strip()
        location = str(row.get("candidate_required_location") or "Remote").strip()
        external_id = f"remotive:{row.get('id')}"
        apply_url = str(row.get("url") or "").strip() or None
        posted_at = _to_datetime(row.get("publication_date"))

        listings.append(
            NormalizedJobListing(
                source="remotive",
                external_id=external_id,
                title=title,
                company=company,
                location=location,
                description=description,
                apply_url=apply_url,
                posted_at=posted_at,
                role_type=infer_role_type(title, description),
                domain=infer_domain(title, description),
                required_skills=infer_required_skills(f"{title}\n{description}"),
                experience_required=infer_experience_required(description),
            )
        )
    return listings
