"""add priority to jobs, candidates, interviews

Revision ID: d6e9f0a1b2c3
Revises: c5d8e9f0a1b2
Create Date: 2026-08-19
"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "d6e9f0a1b2c3"
down_revision: str | None = "c5d8e9f0a1b2"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

priority = postgresql.ENUM(
    "URGENT", "HIGH", "MEDIUM", "LOW", name="priority", create_type=False
)


def upgrade() -> None:
    priority.create(op.get_bind(), checkfirst=True)
    for table in ("jobs", "candidates", "interviews"):
        op.add_column(
            table,
            sa.Column("priority", priority, nullable=False, server_default="MEDIUM"),
        )


def downgrade() -> None:
    for table in ("jobs", "candidates", "interviews"):
        op.drop_column(table, "priority")
    priority.drop(op.get_bind(), checkfirst=True)
