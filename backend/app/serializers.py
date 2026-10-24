from datetime import date

from .models import Project, Task, Technology, User


def user_payload(user: User) -> dict:
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "role_title": user.role_title,
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }


def task_payload(task: Task) -> dict:
    is_done = bool(task.status and task.status.is_final)
    return {
        "id": task.id,
        "project_id": task.project_id,
        "parent_id": task.parent_id,
        "title": task.title,
        "description": task.description,
        "status": task.status.code if task.status else "todo",
        "priority": task.priority.code if task.priority else "medium",
        "due_date": task.due_date.isoformat() if task.due_date else None,
        "estimate_hours": task.estimate_hours,
        "order_index": task.order_index,
        "completed_at": task.completed_at.isoformat() if task.completed_at else None,
        "is_done": is_done,
    }


def project_payload(project: Project, tasks: list[Task] | None = None) -> dict:
    """Прогресс считается автоматически: доля закрытых корневых задач."""
    items = list(tasks if tasks is not None else project.tasks)
    roots = [task for task in items if task.parent_id is None]
    done = [task for task in roots if task.status and task.status.is_final]
    today = date.today()
    overdue = [
        task
        for task in roots
        if not (task.status and task.status.is_final) and task.due_date and task.due_date < today
    ]

    return {
        "id": project.id,
        "name": project.name,
        "description": project.description,
        "status": project.status,
        "color": project.color,
        "due_date": project.due_date.isoformat() if project.due_date else None,
        "created_at": project.created_at.isoformat() if project.created_at else None,
        "technologies": [tech.name for tech in project.technologies],
        "tasks_total": len(roots),
        "tasks_done": len(done),
        "tasks_overdue": len(overdue),
        "progress": round(len(done) / len(roots) * 100) if roots else 0,
    }


def technology_payload(tech: Technology) -> dict:
    return {
        "id": tech.id,
        "name": tech.name,
        "category": tech.category,
        "short": tech.short,
        "color": tech.color,
        "project_count": len(tech.projects),
    }
