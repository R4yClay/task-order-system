from app.models import TaskStatus


def test_status_values():
    assert [x.value for x in TaskStatus] == ["todo", "in_progress", "done", "cancelled"]
