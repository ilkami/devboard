from datetime import date, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db import get_db
from ..deps import get_current_user
from ..models import Project, Task, User
from ..serializers import project_payload

router = APIRouter(tags=["Дашборд"])


@router.get("/dashboard/summary")
def summary(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    projects = list(db.scalars(select(Project).where(Project.user_id == user.id)).all())
    tasks = list(
        db.scalars(
            select(Task).join(Project, Task.project_id == Project.id).where(Project.user_id == user.id)
        ).all()
    )

    active = [project for project in projects if project.status == "active"]
    root_tasks = [task for task in tasks if task.parent_id is None]
    done_tasks = [task for task in root_tasks if task.status and task.status.is_final]

    today = date.today()
    overdue = [
        task
        for task in root_tasks
        if not (task.status and task.status.is_final) and task.due_date and task.due_date < today
    ]
    week_limit = today + timedelta(days=7)
    due_this_week = [
        task
        for task in root_tasks
        if task.due_date and today <= task.due_date <= week_limit
    ]

    progress_values = [project_payload(project)["progress"] for project in active]
    average_progress = round(sum(progress_values) / len(progress_values)) if progress_values else 0

    nearest = None
    dated = [project for project in active if project.due_date]
    if dated:
        candidate = min(dated, key=lambda item: item.due_date)
        nearest = {
            "id": candidate.id,
            "name": candidate.name,
            "due_date": candidate.due_date.isoformat(),
            "days_left": (candidate.due_date - today).days,
        }

    return {
        "projects": {
            "total": len(projects),
            "active": len(active),
            "paused": len([item for item in projects if item.status == "paused"]),
            "archived": len([item for item in projects if item.status == "archived"]),
        },
        "tasks": {
            "total": len(root_tasks),
            "done": len(done_tasks),
            "overdue": len(overdue),
            "due_this_week": len(due_this_week),
            "completion_percent": round(len(done_tasks) / len(root_tasks) * 100)
            if root_tasks
            else 0,
        },
        "average_progress": average_progress,
        "nearest_deadline": nearest,
    }
