"""store uploaded resume file on candidates

Revision ID: c5d8e9f0a1b2
Revises: b4c7d8e9f0a1
Create Date: 2026-08-19
"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "c5d8e9f0a1b2"
down_revision: str | None = "b4c7d8e9f0a1"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("candidates", sa.Column("resume_filename", sa.String(length=255), nullable=True))
    op.add_column("candidates", sa.Column("resume_mime", sa.String(length=120), nullable=True))
    op.add_column("candidates", sa.Column("resume_data", sa.LargeBinary(), nullable=True))


def downgrade() -> None:
    op.drop_column("candidates", "resume_data")
    op.drop_column("candidates", "resume_mime")
    op.drop_column("candidates", "resume_filename")
