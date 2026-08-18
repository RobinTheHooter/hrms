"""create candidates table

Revision ID: d9e3c4f5a6b7
Revises: c8d2b3e4f5a6
Create Date: 2026-08-18
"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "d9e3c4f5a6b7"
down_revision: str | None = "c8d2b3e4f5a6"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

candidate_source = postgresql.ENUM(
    "APPLIED", "REFERRAL", "SOURCED", "AGENCY",
    name="candidate_source",
    create_type=False,
)
candidate_stage = postgresql.ENUM(
    "APPLIED", "SCREENING", "INTERVIEW", "OFFER", "HIRED", "REJECTED",
    name="candidate_stage",
    create_type=False,
)


def upgrade() -> None:
    candidate_source.create(op.get_bind(), checkfirst=True)
    candidate_stage.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "candidates",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("job_id", sa.Integer(), nullable=False),
        sa.Column("full_name", sa.String(length=200), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("phone", sa.String(length=30), nullable=True),
        sa.Column("current_role", sa.String(length=150), nullable=True),
        sa.Column("experience_years", sa.Numeric(precision=4, scale=1), nullable=True),
        sa.Column("skills", sa.Text(), nullable=True),
        sa.Column("source", candidate_source, nullable=False),
        sa.Column("current_ctc", sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column("expected_ctc", sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column("notice_period_days", sa.Integer(), nullable=True),
        sa.Column("resume_url", sa.String(length=500), nullable=True),
        sa.Column("stage", candidate_stage, nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_by_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["job_id"], ["jobs.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["created_by_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_candidates_email"), "candidates", ["email"])
    op.create_index(op.f("ix_candidates_job_id"), "candidates", ["job_id"])
    op.create_index(op.f("ix_candidates_stage"), "candidates", ["stage"])


def downgrade() -> None:
    op.drop_index(op.f("ix_candidates_stage"), table_name="candidates")
    op.drop_index(op.f("ix_candidates_job_id"), table_name="candidates")
    op.drop_index(op.f("ix_candidates_email"), table_name="candidates")
    op.drop_table("candidates")
    candidate_stage.drop(op.get_bind(), checkfirst=True)
    candidate_source.drop(op.get_bind(), checkfirst=True)
