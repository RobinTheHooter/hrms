"""Make created_at/updated_at timezone-aware (timestamptz).

Existing naive values were written by the DB in UTC, so reinterpret them with
`AT TIME ZONE 'UTC'` to preserve the same instant while gaining an explicit
offset. This makes the API serialize unambiguous timestamps for the frontend.

Revision ID: e7f0a1b2c3d4
Revises: d6e9f0a1b2c3
"""
from alembic import op

revision = "e7f0a1b2c3d4"
down_revision = "d6e9f0a1b2c3"
branch_labels = None
depends_on = None

_TABLES = (
    "users",
    "employees",
    "jobs",
    "candidates",
    "interviews",
    "google_credentials",
    "email_logs",
)
_COLUMNS = ("created_at", "updated_at")


def upgrade() -> None:
    for table in _TABLES:
        for col in _COLUMNS:
            op.execute(
                f'ALTER TABLE "{table}" '
                f'ALTER COLUMN "{col}" TYPE TIMESTAMPTZ '
                f'USING "{col}" AT TIME ZONE \'UTC\''
            )


def downgrade() -> None:
    for table in _TABLES:
        for col in _COLUMNS:
            op.execute(
                f'ALTER TABLE "{table}" '
                f'ALTER COLUMN "{col}" TYPE TIMESTAMP '
                f'USING "{col}" AT TIME ZONE \'UTC\''
            )
