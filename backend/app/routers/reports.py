from datetime import date, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db import get_db
from ..deps import get_current_user
from ..models import Project, Task, User
from ..serializers import project_payload

router = APIRouter(prefix="/reports", tags=["Отчёты"])


@router.get("/weekly")
def weekly(
    weeks: int = Query(default=6, ge=1, le=26),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[dict]:
    """Задачи по неделям: срок задачи попадает в неделю, начало недели — понедельник."""
    tasks = list(
        db.scalars(
            select(Task)
            .join(Project, Task.project_id == Project.id)
            .where(Project.user_id == user.id, Task.parent_id.is_(None))
        ).all()
    )

    today = date.today()
    current_monday = today - timedelta(days=today.weekday())

    result: list[dict] = []
    for index in range(weeks):
        start = current_monday - timedelta(weeks=weeks - 1 - index)
        end = start + timedelta(days=7)

        items = [task for task in tasks if task.due_date and start <= task.due_date < end]
        done = [task for task in items if task.status and task.status.is_final]

        result.append(
            {
                "week_start": start.isoformat(),
                "total": len(items),
                "done": len(done),
                "remaining": len(items) - len(done),
            }
        )

    return result


@router.get("/projects")
def projects_load(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[dict]:
    projects = db.scalars(
        select(Project).where(Project.user_id == user.id, Project.status != "archived")
    ).all()

    payloads = [project_payload(project) for project in projects]
    return sorted(
        [
            {
                "id": item["id"],
                "name": item["name"],
                "color": item["color"],
                "total": item["tasks_total"],
                "done": item["tasks_done"],
                "overdue": item["tasks_overdue"],
                "progress": item["progress"],
            }
            for item in payloads
        ],
        key=lambda item: item["total"],
        reverse=True,
    )
