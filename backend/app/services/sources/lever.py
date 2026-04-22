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


def _to_datetime(raw_value: str | int | None) -> datetime | None:
    if raw_value is None:
        return None
    if isinstance(raw_value, int):
        try:
            return datetime.fromtimestamp(raw_value / 1000)
        except Exception:
            return None
    try:
        return datetime.fromisoformat(str(raw_value).replace("Z", "+00:00"))
    except Exception:
        return None


def fetch_lever_jobs(
    company_tokens: list[str],
    max_per_company: int = 120,
    student_only: bool = True,
) -> list[NormalizedJobListing]:
    listings: list[NormalizedJobListing] = []
    for token in company_tokens:
        url = f"https://api.lever.co/v0/postings/{token}?mode=json"
        try:
            with urlopen(url, timeout=settings.JOB_INGEST_TIMEOUT_SEC) as response:
                rows = json.loads(response.read().decode("utf-8"))
        except Exception:
            continue

        for row in (rows or [])[:max_per_company]:
            title = str(row.get("text") or "").strip()
            if not title:
                continue
            description = strip_html(str(row.get("descriptionPlain") or row.get("description") or "").strip())
            if student_only and not is_student_friendly(title, description):
                continue
            location_obj = row.get("categories") or {}
            location = str(location_obj.get("location") or "Remote").strip()
            external_id = f"lever:{token}:{row.get('id')}"
            apply_url = str(row.get("hostedUrl") or "").strip() or None
            posted_at = _to_datetime(row.get("createdAt"))

            listings.append(
                NormalizedJobListing(
                    source="lever",
                    external_id=external_id,
                    title=title,
                    company=token.replace("-", " ").title(),
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
