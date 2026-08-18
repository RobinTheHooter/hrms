"""google credentials table + interview calendar columns

Revision ID: f2a5b6c7d8e9
Revises: e1f4a5b6c7d8
Create Date: 2026-08-18
"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "f2a5b6c7d8e9"
down_revision: str | None = "e1f4a5b6c7d8"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "google_credentials",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("google_email", sa.String(length=255), nullable=True),
        sa.Column("refresh_token", sa.Text(), nullable=True),
        sa.Column("access_token", sa.Text(), nullable=True),
        sa.Column("token_expiry", sa.DateTime(), nullable=True),
        sa.Column("scope", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id"),
    )
    op.create_index(
        op.f("ix_google_credentials_user_id"), "google_credentials", ["user_id"]
    )

    op.add_column("interviews", sa.Column("google_event_id", sa.String(length=255), nullable=True))
    op.add_column("interviews", sa.Column("meeting_link", sa.String(length=500), nullable=True))


def downgrade() -> None:
    op.drop_column("interviews", "meeting_link")
    op.drop_column("interviews", "google_event_id")
    op.drop_index(op.f("ix_google_credentials_user_id"), table_name="google_credentials")
    op.drop_table("google_credentials")
