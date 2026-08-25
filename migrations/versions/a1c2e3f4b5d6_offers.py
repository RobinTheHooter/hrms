"""Offers table + offer_status enum.

Revision ID: a1c2e3f4b5d6
Revises: f8a1b2c3d4e5
"""
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "a1c2e3f4b5d6"
down_revision = "f8a1b2c3d4e5"
branch_labels = None
depends_on = None

_STATUS = ("draft", "sent", "accepted", "declined", "withdrawn")


def upgrade() -> None:
    offer_status = postgresql.ENUM(*_STATUS, name="offer_status")
    offer_status.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "offers",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "candidate_id",
            sa.Integer(),
            sa.ForeignKey("candidates.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column("title", sa.String(length=150), nullable=False),
        sa.Column("ctc", sa.Integer(), nullable=True),
        sa.Column("start_date", sa.Date(), nullable=True),
        sa.Column("expiry_date", sa.Date(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column(
            "status",
            postgresql.ENUM(*_STATUS, name="offer_status", create_type=False),
            nullable=False,
            server_default="draft",
        ),
        sa.Column(
            "created_by_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
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
    op.drop_table("offers")
    postgresql.ENUM(name="offer_status").drop(op.get_bind(), checkfirst=True)
