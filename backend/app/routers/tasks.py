from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db import get_db
from ..deps import get_current_user, get_owned_project
from ..models import Project, Task, TaskPriority, TaskStatus, User
from ..schemas import TaskIn, TaskMoveIn, TaskUpdate
from ..serializers import task_payload
from ..security import utcnow

router = APIRouter(prefix="/tasks", tags=["Задачи"])


def _status_by_code(db: Session, code: str) -> TaskStatus:
    status_obj = db.scalar(select(TaskStatus).where(TaskStatus.code == code))
    if not status_obj:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Неизвестный статус: {code}")
    return status_obj


def _priority_by_code(db: Session, code: str) -> TaskPriority:
    priority = db.scalar(select(TaskPriority).where(TaskPriority.code == code))
    if not priority:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Неизвестный приоритет: {code}")
    return priority


def _owned_task(task_id: int, user: User, db: Session) -> Task:
    task = db.get(Task, task_id)
    if not task:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Задача не найдена")

    project = db.get(Project, task.project_id)
    if not project or project.user_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Задача не найдена")

    return task


def _apply_status(task: Task, status_obj: TaskStatus) -> None:
    task.status = status_obj
    task.completed_at = utcnow() if status_obj.is_final else None


@router.get("")
def list_tasks(
    project_id: int | None = Query(default=None),
    status_code: str | None = Query(default=None, alias="status"),
    priority: str | None = Query(default=None),
    parent_id: int | None = Query(default=None),
    overdue: bool = Query(default=False),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[dict]:
    stmt = (
        select(Task)
        .join(Project, Task.project_id == Project.id)
        .where(Project.user_id == user.id)
    )

    if project_id is not None:
        stmt = stmt.where(Task.project_id == project_id)

    if status_code:
        stmt = stmt.where(Task.status_id == _status_by_code(db, status_code).id)

    if parent_id is not None:
        stmt = stmt.where(Task.parent_id == parent_id)

    tasks = list(db.scalars(stmt.order_by(Task.due_date.is_(None), Task.due_date, Task.id)))

    if priority:
        tasks = [task for task in tasks if task.priority and task.priority.code == priority]

    if overdue:
        today = date.today()
        tasks = [
            task
            for task in tasks
            if not (task.status and task.status.is_final) and task.due_date and task.due_date < today
        ]

    return [task_payload(task) for task in tasks]


@router.post("", status_code=status.HTTP_201_CREATED)
def create_task(
    payload: TaskIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    project = get_owned_project(payload.project_id, user, db)

    if payload.parent_id is not None:
        parent = _owned_task(payload.parent_id, user, db)
        if parent.project_id != project.id:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST, "Родительская задача относится к другому проекту"
            )

    status_obj = _status_by_code(db, payload.status)
    priority = _priority_by_code(db, payload.priority)

    task = Task(
        project_id=project.id,
        parent_id=payload.parent_id,
        title=payload.title.strip(),
        description=payload.description,
        due_date=payload.due_date,
        estimate_hours=payload.estimate_hours,
        priority=priority,
        order_index=0,
    )
    _apply_status(task, status_obj)

    db.add(task)
    db.commit()
    db.refresh(task)
    return task_payload(task)


@router.get("/{task_id}")
def get_task(
    task_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    return task_payload(_owned_task(task_id, user, db))


@router.patch("/{task_id}")
def update_task(
    task_id: int,
    payload: TaskUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    task = _owned_task(task_id, user, db)
    data = payload.model_dump(exclude_unset=True)

    if data.get("title"):
        task.title = data["title"].strip()
    if "description" in data and data["description"] is not None:
        task.description = data["description"]
    if "due_date" in data:
        task.due_date = data["due_date"]
    if "estimate_hours" in data:
        task.estimate_hours = data["estimate_hours"]
    if data.get("priority"):
        task.priority = _priority_by_code(db, data["priority"])
    if data.get("status"):
        _apply_status(task, _status_by_code(db, data["status"]))

    db.commit()
    db.refresh(task)
    return task_payload(task)


@router.patch("/{task_id}/move")
def move_task(
    task_id: int,
    payload: TaskMoveIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """Перемещение карточки между колонками Kanban-доски."""
    task = _owned_task(task_id, user, db)
    _apply_status(task, _status_by_code(db, payload.status))
    task.order_index = payload.order_index

    db.commit()
    db.refresh(task)
    return task_payload(task)


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    task = _owned_task(task_id, user, db)
    db.delete(task)
    db.commit()
