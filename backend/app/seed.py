from datetime import date, timedelta

from sqlalchemy import select

from .db import SessionLocal
from .models import Project, Task, TaskPriority, TaskStatus, Technology, User
from .security import hash_password

DEMO_EMAIL = "demo@example.com"
DEMO_PASSWORD = "devboard123"

STATUSES = [
    ("todo", "To Do", 0, False),
    ("in_progress", "In Progress", 1, False),
    ("done", "Done", 2, True),
]

PRIORITIES = [
    ("low", "Низкий", 1, 0, "#8A94AC"),
    ("medium", "Средний", 2, 1, "#F5A524"),
    ("high", "Высокий", 3, 2, "#EF4444"),
]

TECHNOLOGIES = [
    ("Python", "language", "Py", "#3776AB"),
    ("FastAPI", "framework", "Fa", "#009688"),
    ("PostgreSQL", "database", "Pg", "#336791"),
    ("Docker", "devops", "Do", "#2496ED"),
    ("React", "framework", "Re", "#61DAFB"),
    ("TypeScript", "language", "TS", "#3178C6"),
    ("Redis", "database", "Rd", "#DC382D"),
    ("GitHub Actions", "devops", "GA", "#24292F"),
]

DEMO_PROJECTS = [
    {
        "name": "Task Tracker API",
        "description": "REST API для управления задачами с системой авторизации",
        "tech": ["Python", "FastAPI", "PostgreSQL"],
        "color": "#3B62F6",
        "due_in": 5,
        "priority": "high",
        "tasks": [
            ("Настроить структуру проекта", True),
            ("Реализовать регистрацию и вход", True),
            ("Написать миграции БД", True),
            ("Собрать Kanban-доску", False),
        ],
    },
    {
        "name": "Portfolio Website",
        "description": "Личный сайт-портфолио с блогом и проектами",
        "tech": ["React", "TypeScript", "Docker"],
        "color": "#7C5CFC",
        "due_in": 12,
        "priority": "medium",
        "tasks": [
            ("Свёрстать главную страницу", True),
            ("Сделать страницу проектов", True),
            ("Подключить форму обратной связи", True),
            ("Настроить деплой", False),
            ("Добавить страницу блога", False),
        ],
    },
    {
        "name": "Telegram Bot",
        "description": "Telegram-бот для записи задач и напоминаний",
        "tech": ["Python", "FastAPI", "Redis"],
        "color": "#12B981",
        "due_in": 25,
        "priority": "medium",
        "tasks": [
            ("Подключить aiogram", True),
            ("Реализовать команды бота", True),
            ("Настроить Redis для кэша", False),
            ("Добавить напоминания", False),
            ("Написать тесты", False),
        ],
    },
    {
        "name": "AI Notes App",
        "description": "Приложение для умных заметок с ИИ-ассистентом",
        "tech": ["Python", "React", "PostgreSQL"],
        "color": "#F5A524",
        "due_in": 40,
        "priority": "low",
        "tasks": [
            ("Спроектировать схему данных", True),
            ("Редактор заметок", False),
            ("Интеграция с ИИ", False),
            ("Поиск по заметкам", False),
            ("Экспорт в Markdown", False),
        ],
    },
    {
        "name": "DevOps Playground",
        "description": "Инфраструктура, деплой и автоматизация",
        "tech": ["Docker", "GitHub Actions", "Python"],
        "color": "#0EA5E9",
        "due_in": 18,
        "priority": "high",
        "tasks": [
            ("Подготовить Docker Compose", True),
            ("Настроить CI", True),
            ("Добавить мониторинг", True),
            ("Описать инфраструктуру", False),
        ],
    },
    {
        "name": "Study Tracker",
        "description": "Трекер обучения и статистика решённых задач",
        "tech": ["React", "TypeScript", "PostgreSQL"],
        "color": "#EF4444",
        "due_in": 45,
        "priority": "low",
        "status": "paused",
        "tasks": [
            ("Собрать статистику", True),
            ("Экран отчётов", False),
            ("Импорт данных", False),
            ("Настройки профиля", False),
        ],
    },
]


def ensure_reference_data(db) -> None:
    """Справочники статусов, приоритетов и технологий — идемпотентно."""
    for code, name, order, is_final in STATUSES:
        if not db.scalar(select(TaskStatus).where(TaskStatus.code == code)):
            db.add(TaskStatus(code=code, name=name, sort_order=order, is_final=is_final))

    for code, name, weight, order, color in PRIORITIES:
        if not db.scalar(select(TaskPriority).where(TaskPriority.code == code)):
            db.add(TaskPriority(code=code, name=name, weight=weight, sort_order=order, color=color))

    for name, category, short, color in TECHNOLOGIES:
        if not db.scalar(select(Technology).where(Technology.name == name)):
            db.add(Technology(name=name, category=category, short=short, color=color))

    db.commit()


def seed_demo() -> None:
    """Демонстрационный пользователь с проектами. Создаётся один раз."""
    db = SessionLocal()
    try:
        ensure_reference_data(db)

        if db.scalar(select(User).where(User.email == DEMO_EMAIL)):
            return

        user = User(
            email=DEMO_EMAIL,
            password_hash=hash_password(DEMO_PASSWORD),
            name="Артём Смирнов",
            role_title="Fullstack Developer",
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        statuses = {item.code: item for item in db.scalars(select(TaskStatus)).all()}
        priorities = {item.code: item for item in db.scalars(select(TaskPriority)).all()}
        technologies = {item.name: item for item in db.scalars(select(Technology)).all()}

        for spec in DEMO_PROJECTS:
            project = Project(
                user_id=user.id,
                name=spec["name"],
                description=spec["description"],
                status=spec.get("status", "active"),
                color=spec["color"],
                due_date=date.today() + timedelta(days=spec["due_in"]),
            )
            project.technologies = [
                technologies[name] for name in spec["tech"] if name in technologies
            ]
            db.add(project)
            db.flush()

            for index, (title, is_done) in enumerate(spec["tasks"]):
                if is_done:
                    status_obj = statuses["done"]
                elif index % 2 == 0:
                    status_obj = statuses["in_progress"]
                else:
                    status_obj = statuses["todo"]

                db.add(
                    Task(
                        project_id=project.id,
                        title=title,
                        status=status_obj,
                        priority=priorities[spec["priority"]],
                        due_date=date.today() + timedelta(days=index * 2 - 3),
                        order_index=index,
                    )
                )

        db.commit()
    finally:
        db.close()
