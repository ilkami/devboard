from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# backend/.env ищется относительно файла настроек, а не текущей папки запуска:
# сервер можно стартовать как из корня репозитория, так и из backend/.
ENV_FILE = Path(__file__).resolve().parents[1] / ".env"


class Settings(BaseSettings):
    """Конфигурация приложения. Значения читаются из backend/.env."""

    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE), env_file_encoding="utf-8", extra="ignore"
    )

    app_name: str = "DevBoard API"
    api_prefix: str = "/api/v1"

    # postgresql+psycopg://user:password@host:port/dbname
    database_url: str = "postgresql+psycopg://devboard:devboard@localhost:5432/devboard"

    secret_key: str = "dev-only-change-me"
    jwt_algorithm: str = "HS256"
    access_token_ttl_minutes: int = 15
    refresh_token_ttl_days: int = 30

    cookie_secure: bool = False
    cookie_samesite: str = "lax"
    csrf_header: str = "X-CSRF-Token"

    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    # Демонстрационные данные при первом запуске
    seed_demo: bool = True

    # Отдавать токен сброса пароля в ответе API.
    # Включается только для учебного запуска без почтового сервиса.
    expose_reset_token: bool = True

    @property
    def cors_list(self) -> list[str]:
        return [item.strip() for item in self.cors_origins.split(",") if item.strip()]

    @property
    def is_sqlite(self) -> bool:
        return self.database_url.startswith("sqlite")


settings = Settings()
