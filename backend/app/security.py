import hashlib
import secrets
from datetime import datetime, timedelta, timezone

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerificationError
from fastapi import Response

from .config import settings

ACCESS_COOKIE = "access_token"
REFRESH_COOKIE = "refresh_token"
CSRF_COOKIE = "csrf_token"

_hasher = PasswordHasher()


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def as_aware(value: datetime) -> datetime:
    """SQLite возвращает даты без часового пояса — приводим к UTC."""
    return value if value.tzinfo else value.replace(tzinfo=timezone.utc)


def hash_password(password: str) -> str:
    """Argon2id с солью и параметрами по умолчанию библиотеки."""
    return _hasher.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return _hasher.verify(password_hash, password)
    except VerificationError:
        return False
    except Exception:
        return False


def sha256(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def create_access_token(user_id: int) -> tuple[str, int]:
    """Возвращает (JWT, срок жизни в секундах)."""
    ttl = settings.access_token_ttl_minutes * 60
    now = utcnow()
    payload = {
        "sub": str(user_id),
        "type": "access",
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(seconds=ttl)).timestamp()),
    }
    token = jwt.encode(payload, settings.secret_key, algorithm=settings.jwt_algorithm)
    return token, ttl


def decode_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, settings.secret_key, algorithms=[settings.jwt_algorithm])
    except jwt.PyJWTError:
        return None


def new_refresh_token() -> tuple[str, str]:
    """(сырой токен для cookie, sha256-хеш для базы)."""
    raw = secrets.token_urlsafe(48)
    return raw, sha256(raw)


def new_csrf_token() -> str:
    return secrets.token_urlsafe(32)


def set_auth_cookies(
    response: Response,
    access_token: str,
    refresh_token: str,
    csrf_token: str,
    access_ttl: int,
) -> None:
    common = {
        "secure": settings.cookie_secure,
        "samesite": settings.cookie_samesite,
    }
    response.set_cookie(
        ACCESS_COOKIE, access_token, max_age=access_ttl, httponly=True, path="/", **common
    )
    response.set_cookie(
        REFRESH_COOKIE,
        refresh_token,
        max_age=settings.refresh_token_ttl_days * 86_400,
        httponly=True,
        path=f"{settings.api_prefix}/auth",
        **common,
    )
    # CSRF-токен доступен JavaScript: клиент повторяет его в заголовке
    response.set_cookie(
        CSRF_COOKIE,
        csrf_token,
        max_age=settings.refresh_token_ttl_days * 86_400,
        httponly=False,
        path="/",
        **common,
    )


def clear_auth_cookies(response: Response) -> None:
    response.delete_cookie(ACCESS_COOKIE, path="/")
    response.delete_cookie(REFRESH_COOKIE, path=f"{settings.api_prefix}/auth")
    response.delete_cookie(CSRF_COOKIE, path="/")
