from fastapi.testclient import TestClient

from app.main import app

API = "/api/v1"
CSRF_HEADER = "X-CSRF-Token"


def register(client: TestClient, email: str, name: str = "Тестовый пользователь") -> str:
    response = client.post(
        f"{API}/auth/register",
        json={"name": name, "email": email, "password": "password123"},
    )
    assert response.status_code == 201, response.text
    return response.json()["csrf_token"]


def test_health(client):
    response = client.get(f"{API}/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_register_returns_user_and_sets_session(client):
    csrf = register(client, "first@example.com", "Иван")

    me = client.get(f"{API}/auth/me")
    assert me.status_code == 200
    assert me.json()["email"] == "first@example.com"

    assert client.cookies.get("access_token")
    assert csrf


def test_duplicate_email_rejected(client):
    register(client, "dup@example.com")

    response = client.post(
        f"{API}/auth/register",
        json={"name": "Второй", "email": "dup@example.com", "password": "password123"},
    )
    assert response.status_code == 401 or response.status_code == 409


def test_login_rejects_wrong_password(fresh_client):
    response = fresh_client.post(
        f"{API}/auth/login",
        json={"email": "demo@example.com", "password": "wrong-password"},
    )
    assert response.status_code == 401


def test_login_with_demo_account(fresh_client):
    response = fresh_client.post(
        f"{API}/auth/login",
        json={"email": "demo@example.com", "password": "devboard123"},
    )
    assert response.status_code == 200, response.text
    assert response.json()["user"]["role_title"]


def test_csrf_required_for_mutating_requests(fresh_client):
    csrf = register(fresh_client, "csrf@example.com")

    without_header = fresh_client.post(f"{API}/projects", json={"name": "Без токена"})
    assert without_header.status_code == 403

    with_header = fresh_client.post(
        f"{API}/projects",
        json={"name": "С токеном"},
        headers={CSRF_HEADER: csrf},
    )
    assert with_header.status_code == 201, with_header.text


def test_project_isolation_between_users(fresh_client):
    csrf_a = register(fresh_client, "owner@example.com", "Владелец")
    created = fresh_client.post(
        f"{API}/projects",
        json={"name": "Закрытый проект", "due_date": "2026-12-01"},
        headers={CSRF_HEADER: csrf_a},
    )
    assert created.status_code == 201
    project_id = created.json()["id"]

    other = TestClient(app)
    csrf_b = register(other, "intruder@example.com", "Чужой")
    headers_b = {CSRF_HEADER: csrf_b}

    assert other.get(f"{API}/projects/{project_id}").status_code == 404
    assert (
        other.patch(
            f"{API}/projects/{project_id}", json={"name": "Взлом"}, headers=headers_b
        ).status_code
        == 404
    )
    assert other.delete(f"{API}/projects/{project_id}", headers=headers_b).status_code == 404


def test_task_flow_updates_progress(fresh_client):
    csrf = register(fresh_client, "tasks@example.com", "Задачи")
    headers = {CSRF_HEADER: csrf}

    project = fresh_client.post(
        f"{API}/projects",
        json={"name": "Проект с задачами", "due_date": "2026-12-01"},
        headers=headers,
    ).json()

    task = fresh_client.post(
        f"{API}/tasks",
        json={"project_id": project["id"], "title": "Первая задача", "priority": "high"},
        headers=headers,
    )
    assert task.status_code == 201, task.text
    task_id = task.json()["id"]
    assert task.json()["status"] == "todo"

    moved = fresh_client.patch(
        f"{API}/tasks/{task_id}/move",
        json={"status": "done", "order_index": 0},
        headers=headers,
    )
    assert moved.status_code == 200
    assert moved.json()["is_done"] is True

    refreshed = fresh_client.get(f"{API}/projects/{project['id']}").json()
    assert refreshed["progress"] == 100
    assert refreshed["tasks_done"] == 1


def test_refresh_rotates_token(fresh_client):
    register(fresh_client, "rotate@example.com")

    first = fresh_client.post(f"{API}/auth/refresh")
    assert first.status_code == 200
    assert "refresh_token" in first.cookies

    second = fresh_client.post(f"{API}/auth/refresh")
    assert second.status_code == 200


def test_logout_ends_session(fresh_client):
    csrf = register(fresh_client, "logout@example.com")

    response = fresh_client.post(f"{API}/auth/logout", headers={CSRF_HEADER: csrf})
    assert response.status_code == 204

    assert fresh_client.get(f"{API}/auth/me").status_code == 401


def test_dashboard_summary_for_demo_user(fresh_client):
    login = fresh_client.post(
        f"{API}/auth/login",
        json={"email": "demo@example.com", "password": "devboard123"},
    )
    assert login.status_code == 200

    summary = fresh_client.get(f"{API}/dashboard/summary")
    assert summary.status_code == 200

    body = summary.json()
    assert body["projects"]["total"] >= 6
    assert body["tasks"]["total"] > 0
    assert body["nearest_deadline"]["name"]


def test_password_reset_flow():
    owner = TestClient(app)
    register(owner, "reset@example.com")

    # Восстановлением занимается пользователь без активной сессии
    anonymous = TestClient(app)

    forgot = anonymous.post(
        f"{API}/auth/password/forgot", json={"email": "reset@example.com"}
    )
    assert forgot.status_code == 200
    token = forgot.json().get("reset_token")
    assert token

    reset = anonymous.post(
        f"{API}/auth/password/reset",
        json={"token": token, "new_password": "new-password-123"},
    )
    assert reset.status_code == 200

    login = TestClient(app).post(
        f"{API}/auth/login",
        json={"email": "reset@example.com", "password": "new-password-123"},
    )
    assert login.status_code == 200
