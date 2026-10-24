from datetime import date
from typing import Literal

from pydantic import BaseModel, EmailStr, Field

StatusLiteral = Literal["active", "paused", "archived"]
PriorityLiteral = Literal["low", "medium", "high"]
StatusCoded = Literal["todo", "in_progress", "done"]


# --- Авторизация ---------------------------------------------------------


class RegisterIn(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    role_title: str | None = Field(default=None, max_length=120)


class LoginIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class PasswordForgotIn(BaseModel):
    email: EmailStr


class PasswordResetIn(BaseModel):
    token: str = Field(min_length=10)
    new_password: str = Field(min_length=8, max_length=128)


# --- Проекты -------------------------------------------------------------


class ProjectIn(BaseModel):
    name: str = Field(min_length=2, max_length=160)
    description: str = Field(default="", max_length=2000)
    status: StatusLiteral = "active"
    color: str = Field(default="#3B62F6", max_length=20)
    due_date: date | None = None
    technologies: list[str] = Field(default_factory=list)


class ProjectUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=160)
    description: str | None = Field(default=None, max_length=2000)
    status: StatusLiteral | None = None
    color: str | None = Field(default=None, max_length=20)
    due_date: date | None = None
    technologies: list[str] | None = None


# --- Задачи --------------------------------------------------------------


class TaskIn(BaseModel):
    project_id: int
    title: str = Field(min_length=2, max_length=200)
    description: str = Field(default="", max_length=4000)
    parent_id: int | None = None
    status: StatusCoded = "todo"
    priority: PriorityLiteral = "medium"
    due_date: date | None = None
    estimate_hours: float | None = Field(default=None, ge=0, le=1000)


class TaskUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=200)
    description: str | None = Field(default=None, max_length=4000)
    status: StatusCoded | None = None
    priority: PriorityLiteral | None = None
    due_date: date | None = None
    estimate_hours: float | None = Field(default=None, ge=0, le=1000)


class TaskMoveIn(BaseModel):
    status: StatusCoded
    order_index: int = Field(default=0, ge=0)


# --- Технологии ----------------------------------------------------------


class TechnologyIn(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    category: Literal["language", "framework", "database", "devops"] = "framework"
    short: str = Field(default="", max_length=4)
    color: str = Field(default="#7A86A3", max_length=20)
