from datetime import date, timedelta


def test_health(client):
    assert client.get("/health").json() == {"status": "ok"}


def test_login_rejects_wrong_password(client):
    response = client.post("/api/auth/login", json={"email": "admin@example.com", "password": "nope"})
    assert response.status_code == 401


def test_error_messages_are_localized(client):
    response = client.post(
        "/api/auth/login",
        json={"email": "admin@example.com", "password": "nope"},
        headers={"Accept-Language": "ru"},
    )
    assert response.json()["detail"] == "Неверный email или пароль"


def test_refresh_token_issues_new_pair(client):
    tokens = client.post(
        "/api/auth/login", json={"email": "manager@example.com", "password": "Manager123!"}
    ).json()
    response = client.post("/api/auth/refresh", params={"refresh_token": tokens["refresh_token"]})
    assert response.status_code == 200
    # An access token must not be accepted as a refresh token.
    bad = client.post("/api/auth/refresh", params={"refresh_token": tokens["access_token"]})
    assert bad.status_code == 401


def test_public_registration_cannot_grant_admin(client):
    response = client.post(
        "/api/auth/register",
        json={"name": "Mallory", "email": "mallory@example.com", "password": "Password123", "role": "admin"},
    )
    assert response.status_code == 201
    assert response.json()["role"] == "executor"


def test_demo_data_is_seeded(client, manager):
    tasks = client.get("/api/tasks", headers=manager).json()
    projects = client.get("/api/projects", headers=manager).json()
    assert len(projects) >= 3
    assert len(tasks) >= 10


def test_executor_sees_only_own_tasks(client, executor):
    me = client.get("/api/auth/me", headers=executor).json()
    tasks = client.get("/api/tasks", headers=executor).json()
    assert tasks, "demo executor should have assigned tasks"
    assert all(task["assignee_id"] == me["id"] for task in tasks)


def test_executor_cannot_create_or_edit_tasks(client, executor):
    task = client.get("/api/tasks", headers=executor).json()[0]
    assert client.post("/api/tasks", json={"title": "x" * 3, "project_id": task["project_id"]},
                       headers=executor).status_code == 403
    response = client.patch(f"/api/tasks/{task['id']}", json={"title": "Hacked"}, headers=executor)
    assert response.status_code == 403


def test_executor_can_move_own_task(client, executor):
    task = client.get("/api/tasks", headers=executor).json()[0]
    response = client.patch(f"/api/tasks/{task['id']}/status", json={"status": "in_progress"}, headers=executor)
    assert response.status_code == 200
    assert response.json()["status"] == "in_progress"


def test_executor_cannot_touch_foreign_task(client, executor, manager):
    me = client.get("/api/auth/me", headers=executor).json()
    foreign = next(t for t in client.get("/api/tasks", headers=manager).json() if t["assignee_id"] != me["id"])
    response = client.patch(f"/api/tasks/{foreign['id']}/status", json={"status": "done"}, headers=executor)
    assert response.status_code == 404


def test_task_crud_and_comments(client, manager):
    project = client.post("/api/projects", json={"name": "Test project"}, headers=manager).json()
    task = client.post(
        "/api/tasks",
        json={"title": "Write tests", "project_id": project["id"], "priority": "high",
              "due_date": str(date.today() + timedelta(days=3))},
        headers=manager,
    )
    assert task.status_code == 201
    task_id = task.json()["id"]

    updated = client.patch(f"/api/tasks/{task_id}", json={"title": "Write more tests"}, headers=manager)
    assert updated.json()["title"] == "Write more tests"

    comment = client.post(f"/api/tasks/{task_id}/comments", json={"text": "On it"}, headers=manager)
    assert comment.status_code == 201
    assert comment.json()["author_name"] == "James Miller"
    assert len(client.get(f"/api/tasks/{task_id}/comments", headers=manager).json()) == 1

    # Deleting a project removes its tasks instead of failing on the foreign key.
    assert client.delete(f"/api/projects/{project['id']}", headers=manager).status_code == 204
    assert client.patch(f"/api/tasks/{task_id}", json={"title": "gone"}, headers=manager).status_code == 404


def test_unknown_references_return_400(client, manager):
    project_id = client.get("/api/projects", headers=manager).json()[0]["id"]
    response = client.post("/api/tasks", json={"title": "Bad", "project_id": project_id, "assignee_id": 99999},
                           headers=manager)
    assert response.status_code == 400
    response = client.post("/api/tasks", json={"title": "Bad", "project_id": 99999}, headers=manager)
    assert response.status_code == 400


def test_analytics_summary(client, manager, executor):
    summary = client.get("/api/analytics/summary", headers=manager).json()
    assert summary["total"] == sum(summary["by_status"].values())
    assert 0 <= summary["completion_rate"] <= 100
    assert summary["overdue"] >= 1  # demo data contains an overdue task
    assert {"open", "by_priority", "by_assignee", "by_project"} <= summary.keys()
    assert client.get("/api/analytics/summary", headers=executor).status_code == 403


def test_only_admin_changes_roles(client, manager, admin):
    users = client.get("/api/users", headers=admin).json()
    executor = next(u for u in users if u["role"] == "executor")
    assert client.patch(f"/api/users/{executor['id']}", json={"role": "admin"}, headers=manager).status_code == 403
    response = client.patch(f"/api/users/{executor['id']}", json={"name": "Renamed"}, headers=admin)
    assert response.status_code == 200
