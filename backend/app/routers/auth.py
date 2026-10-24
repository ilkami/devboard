from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..config import settings
from ..db import get_db
from ..deps import get_current_user
from ..models import PasswordResetToken, RefreshToken, User
from ..schemas import LoginIn, PasswordForgotIn, PasswordResetIn, RegisterIn
from ..security import (
    REFRESH_COOKIE,
    as_aware,
    clear_auth_cookies,
    create_access_token,
    hash_password,
    new_csrf_token,
    new_refresh_token,
    set_auth_cookies,
    sha256,
    utcnow,
    verify_password,
)
from ..serializers import user_payload

router = APIRouter(prefix="/auth", tags=["Авторизация"])


def _issue_session(db: Session, user: User, response: Response) -> dict:
    access_token, access_ttl = create_access_token(user.id)
    raw_refresh, refresh_hash = new_refresh_token()

    db.add(
        RefreshToken(
            user_id=user.id,
            token_hash=refresh_hash,
            expires_at=utcnow() + timedelta(days=settings.refresh_token_ttl_days),
        )
    )
    db.commit()

    csrf_token = new_csrf_token()
    set_auth_cookies(response, access_token, raw_refresh, csrf_token, access_ttl)

    return {"expires_in": access_ttl, "csrf_token": csrf_token}


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(payload: RegisterIn, response: Response, db: Session = Depends(get_db)) -> dict:
    email = payload.email.lower().strip()

    if db.scalar(select(User).where(User.email == email)):
        raise HTTPException(status.HTTP_409_CONFLICT, "Пользователь с таким email уже зарегистрирован")

    user = User(
        email=email,
        password_hash=hash_password(payload.password),
        name=payload.name.strip(),
        role_title=(payload.role_title or "Разработчик").strip(),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    session = _issue_session(db, user, response)
    return {"user": user_payload(user), **session}


@router.post("/login")
def login(payload: LoginIn, response: Response, db: Session = Depends(get_db)) -> dict:
    email = payload.email.lower().strip()
    user = db.scalar(select(User).where(User.email == email))

    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Неверный email или пароль")

    if not user.is_active:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Аккаунт отключён")

    session = _issue_session(db, user, response)
    return {"user": user_payload(user), **session}


@router.post("/refresh")
def refresh_session(request: Request, response: Response, db: Session = Depends(get_db)) -> dict:
    """Ротация refresh-токена: старый отзывается, выдаётся новая пара."""
    raw = request.cookies.get(REFRESH_COOKIE)
    if not raw:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Refresh-токен отсутствует")

    row = db.scalar(select(RefreshToken).where(RefreshToken.token_hash == sha256(raw)))
    if not row or row.revoked_at is not None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Refresh-токен недействителен")

    if as_aware(row.expires_at) < utcnow():
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Срок действия refresh-токена истёк")

    user = db.get(User, row.user_id)
    if not user or not user.is_active:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Пользователь не найден")

    row.revoked_at = utcnow()
    db.commit()

    session = _issue_session(db, user, response)
    return {"user": user_payload(user), **session}


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(request: Request, response: Response, db: Session = Depends(get_db)) -> Response:
    raw = request.cookies.get(REFRESH_COOKIE)
    if raw:
        row = db.scalar(select(RefreshToken).where(RefreshToken.token_hash == sha256(raw)))
        if row and row.revoked_at is None:
            row.revoked_at = utcnow()
            db.commit()

    clear_auth_cookies(response)
    response.status_code = status.HTTP_204_NO_CONTENT
    return response


@router.get("/me")
def me(user: User = Depends(get_current_user)) -> dict:
    return user_payload(user)


@router.post("/password/forgot")
def password_forgot(payload: PasswordForgotIn, db: Session = Depends(get_db)) -> dict:
    """Создаёт одноразовый токен сброса. Ответ не зависит от существования email."""
    email = payload.email.lower().strip()
    user = db.scalar(select(User).where(User.email == email))

    response: dict = {"detail": "Если email зарегистрирован, токен сброса создан"}

    if user:
        raw_token, token_hash = new_refresh_token()

        db.add(
            PasswordResetToken(
                user_id=user.id,
                token_hash=token_hash,
                expires_at=utcnow() + timedelta(hours=1),
            )
        )
        db.commit()

        if settings.expose_reset_token:
            response["reset_token"] = raw_token

    return response


@router.post("/password/reset")
def password_reset(payload: PasswordResetIn, db: Session = Depends(get_db)) -> dict:
    row = db.scalar(
        select(PasswordResetToken).where(PasswordResetToken.token_hash == sha256(payload.token))
    )

    if not row or row.used_at is not None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Токен сброса недействителен")

    if as_aware(row.expires_at) < utcnow():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Срок действия токена истёк")

    user = db.get(User, row.user_id)
    if not user:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Пользователь не найден")

    user.password_hash = hash_password(payload.new_password)
    row.used_at = utcnow()

    # Отзываем все активные сессии: смена пароля разлогинивает везде
    for token in db.scalars(
        select(RefreshToken).where(RefreshToken.user_id == user.id, RefreshToken.revoked_at.is_(None))
    ):
        token.revoked_at = utcnow()

    db.commit()
    return {"detail": "Пароль обновлён"}
