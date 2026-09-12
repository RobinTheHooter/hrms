"""Onboarding notification log (audit + idempotency for automated emails).

Revision ID: c2b3d4e5f6a7
Revises: b1a2c3d4e5f6
"""
import sqlalchemy as sa
from alembic import op

revision = "c2b3d4e5f6a7"
down_revision = "b1a2c3d4e5f6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "onboarding_notifications",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "onboarding_id",
            sa.Integer(),
            sa.ForeignKey("onboarding.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column("kind", sa.String(length=50), nullable=False, index=True),
        sa.Column("to_email", sa.String(length=255), nullable=False),
        sa.Column("subject", sa.String(length=300), nullable=False),
        sa.Column("ref", sa.String(length=100), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.drop_table("onboarding_notifications")
