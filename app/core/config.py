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
    # 0 = tokens never auto-expire (we don't forcibly log users out).
    # Set a positive value to re-enable a hard session lifetime.
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 0

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

    # Email (SMTP) — works with Resend, Mailtrap, Gmail, SendGrid, etc.
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_STARTTLS: bool = True
    EMAIL_FROM: str = ""
    EMAIL_FROM_NAME: str = "Recruitment Team"
    # HTTP email API (works on hosts that block SMTP ports, e.g. Render free).
    RESEND_API_KEY: str = ""
    # Auto-send the "application received" acknowledgment on new candidates.
    AUTO_EMAIL_APPLICATION_RECEIVED: bool = True

    @property
    def email_enabled(self) -> bool:
        return bool(self.EMAIL_FROM and (self.RESEND_API_KEY or self.SMTP_HOST))

    # AI resume screening (OpenAI-compatible).
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o-mini"
    # Auto-run screening as soon as a resume is uploaded/received.
    AUTO_AI_SCREENING: bool = True

    @property
    def ai_enabled(self) -> bool:
        return bool(self.OPENAI_API_KEY)


@lru_cache
def get_settings() -> Settings:
    return Settings()
