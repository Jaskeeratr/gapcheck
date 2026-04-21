"""add experience items to candidate profiles

Revision ID: 4f3f2ecf39c1
Revises: 9b7d2b8f0f01
Create Date: 2026-04-21 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "4f3f2ecf39c1"
down_revision: Union[str, Sequence[str], None] = "9b7d2b8f0f01"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "candidate_profiles",
        sa.Column("experience_items", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("candidate_profiles", "experience_items")
