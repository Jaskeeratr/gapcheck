"""add company profiles table

Revision ID: 9b7d2b8f0f01
Revises: 7a28b56c1603
Create Date: 2026-04-21 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "9b7d2b8f0f01"
down_revision: Union[str, Sequence[str], None] = "7a28b56c1603"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "company_profiles",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("company_name", sa.String(length=200), nullable=False),
        sa.Column("typical_skills", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("typical_exp_years", sa.Numeric(precision=4, scale=1), nullable=True),
        sa.Column("common_programs", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("hiring_notes", sa.Text(), nullable=True),
        sa.Column("last_updated", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("company_name"),
    )


def downgrade() -> None:
    op.drop_table("company_profiles")
