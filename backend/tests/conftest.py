import os
import tempfile

# Each test run gets an isolated SQLite database with demo data.
_db = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
_db.close()
os.environ["DATABASE_URL"] = f"sqlite:///{_db.name}"
os.environ["JWT_SECRET"] = "test-secret"
os.environ["SEED_DEMO_DATA"] = "true"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402

ACCOUNTS = {
    "admin": ("admin@example.com", "Admin12345!"),
    "manager": ("manager@example.com", "Manager123!"),
    "executor": ("executor@example.com", "Executor123!"),
}


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as c:  # runs the startup seed
        yield c


def login(client: TestClient, role: str) -> dict[str, str]:
    email, password = ACCOUNTS[role]
    response = client.post("/api/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


@pytest.fixture
def admin(client):
    return login(client, "admin")


@pytest.fixture
def manager(client):
    return login(client, "manager")


@pytest.fixture
def executor(client):
    return login(client, "executor")
