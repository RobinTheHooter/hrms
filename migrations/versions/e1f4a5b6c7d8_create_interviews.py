"""create interviews table

Revision ID: e1f4a5b6c7d8
Revises: d9e3c4f5a6b7
Create Date: 2026-08-18
"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "e1f4a5b6c7d8"
down_revision: str | None = "d9e3c4f5a6b7"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

interview_mode = postgresql.ENUM(
    "VIRTUAL", "WALK_IN", name="interview_mode", create_type=False
)
interview_status = postgresql.ENUM(
    "SCHEDULED", "COMPLETED", "CANCELLED", name="interview_status", create_type=False
)
interview_outcome = postgresql.ENUM(
    "PENDING", "SELECTED", "REJECTED", name="interview_outcome", create_type=False
)


def upgrade() -> None:
    bind = op.get_bind()
    interview_mode.create(bind, checkfirst=True)
    interview_status.create(bind, checkfirst=True)
    interview_outcome.create(bind, checkfirst=True)

    op.create_table(
        "interviews",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("candidate_id", sa.Integer(), nullable=False),
        sa.Column("hiring_manager_id", sa.Integer(), nullable=True),
        sa.Column("mode", interview_mode, nullable=False),
        sa.Column("scheduled_at", sa.DateTime(), nullable=False),
        sa.Column("location_or_link", sa.String(length=500), nullable=True),
        sa.Column("status", interview_status, nullable=False),
        sa.Column("outcome", interview_outcome, nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_by_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["candidate_id"], ["candidates.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["hiring_manager_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["created_by_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_interviews_candidate_id"), "interviews", ["candidate_id"])
    op.create_index(
        op.f("ix_interviews_hiring_manager_id"), "interviews", ["hiring_manager_id"]
    )
    op.create_index(op.f("ix_interviews_status"), "interviews", ["status"])


def downgrade() -> None:
    op.drop_index(op.f("ix_interviews_status"), table_name="interviews")
    op.drop_index(op.f("ix_interviews_hiring_manager_id"), table_name="interviews")
    op.drop_index(op.f("ix_interviews_candidate_id"), table_name="interviews")
    op.drop_table("interviews")
    interview_outcome.drop(op.get_bind(), checkfirst=True)
    interview_status.drop(op.get_bind(), checkfirst=True)
    interview_mode.drop(op.get_bind(), checkfirst=True)
