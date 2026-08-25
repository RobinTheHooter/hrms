"""Add interview scorecard feedback (JSON).

Revision ID: f8a1b2c3d4e5
Revises: e7f0a1b2c3d4
"""
import sqlalchemy as sa
from alembic import op

revision = "f8a1b2c3d4e5"
down_revision = "e7f0a1b2c3d4"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("interviews", sa.Column("feedback", sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column("interviews", "feedback")
