from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.db.session import get_db
from app.models import Priority, Project, Role, Task, TaskStatus, User

router = APIRouter(prefix="/analytics", tags=["analytics"])

OPEN_STATUSES = (TaskStatus.todo, TaskStatus.in_progress)


@router.get("/summary")
def summary(user=Depends(require_roles(Role.admin, Role.manager)), db: Session = Depends(get_db)):
    by_status = {s.value: 0 for s in TaskStatus}
    for status, count in db.execute(select(Task.status, func.count(Task.id)).group_by(Task.status)):
        by_status[status.value] = count

    by_priority = {p.value: 0 for p in Priority}
    for priority, count in db.execute(
        select(Task.priority, func.count(Task.id))
        .where(Task.status.in_(OPEN_STATUSES))
        .group_by(Task.priority)
    ):
        by_priority[priority.value] = count

    by_assignee = [
        {"user_id": uid, "name": name, "open": open_count or 0, "done": done_count or 0}
        for uid, name, open_count, done_count in db.execute(
            select(
                User.id,
                User.name,
                func.count(Task.id).filter(Task.status.in_(OPEN_STATUSES)),
                func.count(Task.id).filter(Task.status == TaskStatus.done),
            )
            .join(Task, Task.assignee_id == User.id, isouter=True)
            .where(User.role == Role.executor)
            .group_by(User.id, User.name)
            .order_by(User.name)
        )
    ]

    by_project = [
        {"project_id": pid, "name": name, "total": total, "done": done or 0}
        for pid, name, total, done in db.execute(
            select(
                Project.id,
                Project.name,
                func.count(Task.id),
                func.count(Task.id).filter(Task.status == TaskStatus.done),
            )
            .join(Task, Task.project_id == Project.id, isouter=True)
            .group_by(Project.id, Project.name)
            .order_by(Project.name)
        )
    ]

    total = sum(by_status.values())
    active = total - by_status["cancelled"]
    overdue = db.scalar(
        select(func.count(Task.id)).where(
            Task.status.in_(OPEN_STATUSES), Task.due_date.is_not(None), Task.due_date < date.today()
        )
    )
    return {
        "total": total,
        "open": by_status["todo"] + by_status["in_progress"],
        "overdue": overdue or 0,
        "completion_rate": round(100 * by_status["done"] / active, 1) if active else 0.0,
        "by_status": by_status,
        "by_priority": by_priority,
        "by_assignee": by_assignee,
        "by_project": by_project,
    }
