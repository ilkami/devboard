from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from .db import get_db
from .models import Project, User
from .security import ACCESS_COOKIE, decode_token


def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    token = request.cookies.get(ACCESS_COOKIE)

    if not token:
        header = request.headers.get("Authorization", "")
        if header.lower().startswith("bearer "):
            token = header[7:].strip()

    if not token:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Требуется авторизация")

    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Токен недействителен или истёк")

    user = db.get(User, int(payload["sub"]))
    if not user or not user.is_active:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Пользователь не найден")

    return user


def get_owned_project(project_id: int, user: User, db: Session) -> Project:
    """Проверка прав доступа: чужой проект неотличим от несуществующего."""
    project = db.get(Project, project_id)
    if not project or project.user_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Проект не найден")
    return project
