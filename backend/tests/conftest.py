import os
import pathlib

TEST_DB = pathlib.Path(__file__).resolve().parent / "test_devboard.db"

# Переменные окружения важнее .env, поэтому тесты работают на отдельной базе
os.environ["DATABASE_URL"] = f"sqlite+pysqlite:///{TEST_DB.as_posix()}"
os.environ["SECRET_KEY"] = "test-secret-key"
os.environ["SEED_DEMO"] = "true"
os.environ["EXPOSE_RESET_TOKEN"] = "true"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.db import engine  # noqa: E402
from app.main import app  # noqa: E402


def _remove_db() -> None:
    """SQLite держит файл открытым, пока живо соединение."""
    engine.dispose()
    if TEST_DB.exists():
        try:
            TEST_DB.unlink()
        except PermissionError:
            pass


@pytest.fixture(scope="session")
def client():
    _remove_db()

    with TestClient(app) as test_client:
        yield test_client

    _remove_db()


@pytest.fixture()
def fresh_client():
    """Новый клиент с собственным набором cookie — для проверки изоляции данных."""
    return TestClient(app)
