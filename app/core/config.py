import re
from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_ignore_empty=True,
        extra="ignore",
    )

    PROJECT_NAME: str = "HRMS API"
    API_V1_PREFIX: str = "/api/v1"
    DEBUG: bool = False

    # postgresql+asyncpg://user:password@host:port/dbname
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/hrms"

    @field_validator("DATABASE_URL")
    @classmethod
    def _use_asyncpg_driver(cls, v: str) -> str:
        """Accept a plain Render/Heroku-style URL and force the asyncpg driver.

        Providers hand out `postgres://` or `postgresql://` URLs; asyncpg needs
        `postgresql+asyncpg://` and doesn't understand libpq's `sslmode` param.
        """
        if v.startswith("postgres://"):
            v = "postgresql://" + v[len("postgres://") :]
        if v.startswith("postgresql://"):
            v = "postgresql+asyncpg://" + v[len("postgresql://") :]
        # asyncpg rejects sslmode/channel_binding query args in the URL.
        v = re.sub(r"[?&](sslmode|channel_binding)=[^&]+", "", v)
        return v

    JWT_SECRET: str = "change-me-in-env"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day

    # CORS origins (frontend dev server)
    CORS_ORIGINS: list[str] = ["http://localhost:5173"]

    # Frontend base URL (used for OAuth redirects back into the app)
    FRONTEND_URL: str = "http://localhost:5173"

    # Timezone used for calendar events (IANA name).
    APP_TIMEZONE: str = "Asia/Kolkata"
    INTERVIEW_DURATION_MINUTES: int = 60

    # Google Calendar integration (optional; features are gated on these)
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = (
        "http://localhost:8000/api/v1/integrations/google/callback"
    )

    @property
    def google_enabled(self) -> bool:
        return bool(self.GOOGLE_CLIENT_ID and self.GOOGLE_CLIENT_SECRET)


@lru_cache
def get_settings() -> Settings:
    return Settings()
