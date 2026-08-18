"""add ATS roles to user_role enum

Revision ID: b7c1a2d3e4f5
Revises: 469672eee039
Create Date: 2026-08-18

Adds the consultant / hiring_manager / candidate roles. SQLAlchemy persists
enum member *names*, so we add the uppercase labels.
"""
from collections.abc import Sequence

from alembic import op

revision: str = "b7c1a2d3e4f5"
down_revision: str | None = "469672eee039"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

NEW_LABELS = ("CONSULTANT", "HIRING_MANAGER", "CANDIDATE")


def upgrade() -> None:
    # ALTER TYPE ... ADD VALUE cannot run inside a transaction block.
    with op.get_context().autocommit_block():
        for label in NEW_LABELS:
            op.execute(f"ALTER TYPE user_role ADD VALUE IF NOT EXISTS '{label}'")


def downgrade() -> None:
    # PostgreSQL cannot drop enum values; nothing to do.
    pass
