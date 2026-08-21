from datetime import datetime, timedelta, timezone

import bcrypt
import jwt

from app.core.config import get_settings

settings = get_settings()

# bcrypt has a hard 72-byte limit on the input; truncate to stay safe.
_BCRYPT_MAX_BYTES = 72


def hash_password(password: str) -> str:
    pw = password.encode("utf-8")[:_BCRYPT_MAX_BYTES]
    return bcrypt.hashpw(pw, bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    pw = plain_password.encode("utf-8")[:_BCRYPT_MAX_BYTES]
    return bcrypt.checkpw(pw, hashed_password.encode("utf-8"))


def create_access_token(subject: str | int, expires_delta: timedelta | None = None) -> str:
    payload: dict = {"sub": str(subject)}

    # Only add an `exp` claim when an expiry is actually requested. With
    # ACCESS_TOKEN_EXPIRE_MINUTES = 0 (the default) tokens never auto-expire —
    # we don't forcibly log users out; a session only ends if the user or an
    # external cause invalidates it.
    if expires_delta is not None:
        payload["exp"] = datetime.now(timezone.utc) + expires_delta
    elif settings.ACCESS_TOKEN_EXPIRE_MINUTES:
        payload["exp"] = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )

    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
