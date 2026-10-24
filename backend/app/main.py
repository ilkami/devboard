import secrets
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import settings
from .db import create_tables
from .routers import auth, dashboard, projects, reports, tasks, technologies
from .security import CSRF_COOKIE
from .seed import seed_demo

UNSAFE_METHODS = {"POST", "PUT", "PATCH", "DELETE"}

# Вход и регистрация выполняются до появления cookie, поэтому CSRF для них не проверяется
CSRF_EXEMPT = {
    f"{settings.api_prefix}/auth/login",
    f"{settings.api_prefix}/auth/register",
    f"{settings.api_prefix}/auth/refresh",
}


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_tables()
    if settings.seed_demo:
        seed_demo()
    yield


app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description="Backend системы управления личными проектами программиста",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def csrf_protection(request: Request, call_next):
    """Double-submit cookie: значение из cookie должно совпасть с заголовком.

    Проверка применяется только к изменяющим запросам, авторизованным по cookie.
    """
    if request.method in UNSAFE_METHODS and request.url.path not in CSRF_EXEMPT:
        cookie_value = request.cookies.get(CSRF_COOKIE)
        if cookie_value:
            header_value = request.headers.get(settings.csrf_header)
            if not header_value or not secrets.compare_digest(cookie_value, header_value):
                return JSONResponse(
                    {"detail": "CSRF-токен отсутствует или не совпадает"}, status_code=403
                )

    return await call_next(request)


@app.get(f"{settings.api_prefix}/health", tags=["Служебные"])
def health() -> dict:
    return {"status": "ok", "service": settings.app_name}


for module in (auth, projects, tasks, technologies, dashboard, reports):
    app.include_router(module.router, prefix=settings.api_prefix)
