from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db import get_db
from ..deps import get_current_user, get_owned_project
from ..models import Project, Task, TaskStatus, Technology, User
from ..schemas import ProjectIn, ProjectUpdate
from ..serializers import project_payload, task_payload

router = APIRouter(prefix="/projects", tags=["Проекты"])


def _sync_technologies(db: Session, project: Project, names: list[str]) -> None:
    """Привязывает технологии по названиям, создавая отсутствующие."""
    resolved: list[Technology] = []

    for raw in names:
        name = raw.strip()
        if not name:
            continue

        tech = db.scalar(select(Technology).where(Technology.name.ilike(name)))
        if not tech:
            tech = Technology(name=name, short=name[:2], category="framework")
            db.add(tech)
            db.flush()

        resolved.append(tech)

    project.technologies = resolved


@router.get("")
def list_projects(
    status_filter: str | None = Query(default=None, alias="status"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[dict]:
    stmt = select(Project).where(Project.user_id == user.id)
    if status_filter:
        stmt = stmt.where(Project.status == status_filter)

    stmt = stmt.order_by(Project.due_date.is_(None), Project.due_date)
    return [project_payload(project) for project in db.scalars(stmt).all()]


@router.post("", status_code=status.HTTP_201_CREATED)
def create_project(
    payload: ProjectIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    name = payload.name.strip()

    duplicate = db.scalar(
        select(Project).where(Project.user_id == user.id, Project.name.ilike(name))
    )
    if duplicate:
        raise HTTPException(status.HTTP_409_CONFLICT, "Проект с таким названием уже существует")

    project = Project(
        user_id=user.id,
        name=name,
        description=payload.description,
        status=payload.status,
        color=payload.color,
        due_date=payload.due_date,
    )
    _sync_technologies(db, project, payload.technologies)

    db.add(project)
    db.commit()
    db.refresh(project)
    return project_payload(project)


@router.get("/{project_id}")
def get_project(
    project_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    return project_payload(get_owned_project(project_id, user, db))


@router.patch("/{project_id}")
def update_project(
    project_id: int,
    payload: ProjectUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    project = get_owned_project(project_id, user, db)
    data = payload.model_dump(exclude_unset=True)

    if data.get("name"):
        name = data["name"].strip()
        duplicate = db.scalar(
            select(Project).where(
                Project.user_id == user.id,
                Project.id != project.id,
                Project.name.ilike(name),
            )
        )
        if duplicate:
            raise HTTPException(status.HTTP_409_CONFLICT, "Проект с таким названием уже существует")
        project.name = name

    if "description" in data and data["description"] is not None:
        project.description = data["description"]
    if data.get("status"):
        project.status = data["status"]
    if data.get("color"):
        project.color = data["color"]
    if "due_date" in data:
        project.due_date = data["due_date"]
    if data.get("technologies") is not None:
        _sync_technologies(db, project, data["technologies"])

    db.commit()
    db.refresh(project)
    return project_payload(project)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    project = get_owned_project(project_id, user, db)
    db.delete(project)
    db.commit()


@router.post("/{project_id}/archive")
def archive_project(
    project_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    project = get_owned_project(project_id, user, db)
    project.status = "archived"
    db.commit()
    db.refresh(project)
    return project_payload(project)


@router.post("/{project_id}/restore")
def restore_project(
    project_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    project = get_owned_project(project_id, user, db)
    project.status = "active"
    db.commit()
    db.refresh(project)
    return project_payload(project)


@router.get("/{project_id}/board")
def project_board(
    project_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    project = get_owned_project(project_id, user, db)

    statuses = db.scalars(select(TaskStatus).order_by(TaskStatus.sort_order)).all()
    tasks = db.scalars(
        select(Task)
        .where(Task.project_id == project.id, Task.parent_id.is_(None))
        .order_by(Task.order_index, Task.id)
    ).all()

    return {
        "project": project_payload(project),
        "columns": [
            {
                "code": item.code,
                "title": item.name,
                "tasks": [task_payload(task) for task in tasks if task.status_id == item.id],
            }
            for item in statuses
        ],
    }
