"""job required_skills + candidate resume/ai fields

Revision ID: b4c7d8e9f0a1
Revises: a3b6c7d8e9f0
Create Date: 2026-08-19
"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "b4c7d8e9f0a1"
down_revision: str | None = "a3b6c7d8e9f0"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("jobs", sa.Column("required_skills", sa.Text(), nullable=True))

    op.add_column("candidates", sa.Column("resume_text", sa.Text(), nullable=True))
    op.add_column("candidates", sa.Column("ai_score", sa.Integer(), nullable=True))
    op.add_column("candidates", sa.Column("ai_summary", sa.Text(), nullable=True))
    op.add_column("candidates", sa.Column("ai_matched", sa.JSON(), nullable=True))
    op.add_column("candidates", sa.Column("ai_missing", sa.JSON(), nullable=True))
    op.add_column("candidates", sa.Column("ai_scored_at", sa.DateTime(), nullable=True))


def downgrade() -> None:
    op.drop_column("candidates", "ai_scored_at")
    op.drop_column("candidates", "ai_missing")
    op.drop_column("candidates", "ai_matched")
    op.drop_column("candidates", "ai_summary")
    op.drop_column("candidates", "ai_score")
    op.drop_column("candidates", "resume_text")
    op.drop_column("jobs", "required_skills")
