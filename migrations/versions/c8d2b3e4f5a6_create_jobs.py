"""create jobs table

Revision ID: c8d2b3e4f5a6
Revises: b7c1a2d3e4f5
Create Date: 2026-08-18
"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "c8d2b3e4f5a6"
down_revision: str | None = "b7c1a2d3e4f5"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # job_status is new; employment_type already exists (created with employees),
    # so reuse it without re-creating the type.
    employment_type = sa.Enum(
        "FULL_TIME", "PART_TIME", "CONTRACT", "INTERN",
        name="employment_type",
        create_type=False,
    )
    job_status = sa.Enum("OPEN", "CLOSED", name="job_status")

    op.create_table(
        "jobs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=150), nullable=False),
        sa.Column("department", sa.String(length=150), nullable=True),
        sa.Column("location", sa.String(length=150), nullable=True),
        sa.Column("employment_type", employment_type, nullable=False),
        sa.Column("positions", sa.Integer(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", job_status, nullable=False),
        sa.Column("assigned_consultant_id", sa.Integer(), nullable=True),
        sa.Column("created_by_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["assigned_consultant_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["created_by_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("jobs")
    sa.Enum(name="job_status").drop(op.get_bind(), checkfirst=True)
