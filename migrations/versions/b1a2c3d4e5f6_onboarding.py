"""Onboarding module — onboarding + onboarding_tasks tables and enums.

Revision ID: b1a2c3d4e5f6
Revises: a1c2e3f4b5d6
"""
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "b1a2c3d4e5f6"
down_revision = "a1c2e3f4b5d6"
branch_labels = None
depends_on = None

_STATUS = ("pre_joining", "in_progress", "ready", "completed", "cancelled")
_CATEGORY = ("documentation", "hr_compliance", "it_access", "orientation")
_TASK_STATUS = ("pending", "in_progress", "done")
_OWNER = ("people_ops", "it", "manager", "new_hire")


def upgrade() -> None:
    bind = op.get_bind()
    onboarding_status = postgresql.ENUM(*_STATUS, name="onboarding_status")
    task_category = postgresql.ENUM(*_CATEGORY, name="onboarding_task_category")
    task_status = postgresql.ENUM(*_TASK_STATUS, name="onboarding_task_status")
    task_owner = postgresql.ENUM(*_OWNER, name="onboarding_task_owner")
    for enum in (onboarding_status, task_category, task_status, task_owner):
        enum.create(bind, checkfirst=True)

    op.create_table(
        "onboarding",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "candidate_id",
            sa.Integer(),
            sa.ForeignKey("candidates.id", ondelete="SET NULL"),
            nullable=True,
            unique=True,
            index=True,
        ),
        sa.Column(
            "offer_id",
            sa.Integer(),
            sa.ForeignKey("offers.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("full_name", sa.String(length=200), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False, index=True),
        sa.Column("job_title", sa.String(length=150), nullable=True),
        sa.Column("department", sa.String(length=150), nullable=True),
        sa.Column("location", sa.String(length=150), nullable=True),
        sa.Column("start_date", sa.Date(), nullable=True, index=True),
        sa.Column("manager_name", sa.String(length=150), nullable=True),
        sa.Column("buddy_name", sa.String(length=150), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column(
            "status",
            postgresql.ENUM(*_STATUS, name="onboarding_status", create_type=False),
            nullable=False,
            server_default="pre_joining",
            index=True,
        ),
        sa.Column(
            "employee_id",
            sa.Integer(),
            sa.ForeignKey("employees.id", ondelete="SET NULL"),
            nullable=True,
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

    op.create_table(
        "onboarding_tasks",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "onboarding_id",
            sa.Integer(),
            sa.ForeignKey("onboarding.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "category",
            postgresql.ENUM(
                *_CATEGORY, name="onboarding_task_category", create_type=False
            ),
            nullable=False,
        ),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column(
            "owner",
            postgresql.ENUM(
                *_OWNER, name="onboarding_task_owner", create_type=False
            ),
            nullable=True,
        ),
        sa.Column(
            "status",
            postgresql.ENUM(
                *_TASK_STATUS, name="onboarding_task_status", create_type=False
            ),
            nullable=False,
            server_default="pending",
        ),
        sa.Column("due_date", sa.Date(), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("position", sa.Integer(), nullable=False, server_default="0"),
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
    op.drop_table("onboarding_tasks")
    op.drop_table("onboarding")
    for name in (
        "onboarding_task_owner",
        "onboarding_task_status",
        "onboarding_task_category",
        "onboarding_status",
    ):
        postgresql.ENUM(name=name).drop(op.get_bind(), checkfirst=True)
