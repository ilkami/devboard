from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db import get_db
from ..deps import get_current_user
from ..models import Project, Technology, User
from ..schemas import TechnologyIn
from ..serializers import technology_payload

router = APIRouter(prefix="/technologies", tags=["Технологии"])


@router.get("")
def list_technologies(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[dict]:
    technologies = db.scalars(select(Technology).order_by(Technology.name)).all()

    # Считаем использование только по проектам текущего пользователя
    counts: dict[int, int] = {}
    projects = db.scalars(select(Project).where(Project.user_id == user.id)).all()
    for project in projects:
        for tech in project.technologies:
            counts[tech.id] = counts.get(tech.id, 0) + 1

    return [
        {**technology_payload(tech), "project_count": counts.get(tech.id, 0)}
        for tech in technologies
    ]


@router.post("", status_code=status.HTTP_201_CREATED)
def create_technology(
    payload: TechnologyIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    name = payload.name.strip()

    existing = db.scalar(select(Technology).where(Technology.name.ilike(name)))
    if existing:
        raise HTTPException(status.HTTP_409_CONFLICT, "Такая технология уже есть в справочнике")

    tech = Technology(
        name=name,
        category=payload.category,
        short=(payload.short.strip() or name[:2]),
        color=payload.color,
    )
    db.add(tech)
    db.commit()
    db.refresh(tech)
    return {**technology_payload(tech), "project_count": 0}
