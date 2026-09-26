from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.api.deps import current_user, require_roles
from app.db.session import get_db
from app.models import Project, Role, Task, TaskStatus, User
from app.schemas import TaskCreate, TaskOut, TaskUpdate, StatusUpdate, CommentCreate, CommentOut
from app.models import Comment

router = APIRouter(prefix="/tasks", tags=["tasks"])


def can_see(t, u):
    return u.role in (Role.admin, Role.manager) or t.assignee_id == u.id


def _validate_refs(db: Session, values: dict) -> None:
    """Unknown ids would otherwise surface as a 500 from the foreign key constraint."""
    if values.get("assignee_id") is not None and not db.get(User, values["assignee_id"]):
        raise HTTPException(400, "Assignee not found")
    if values.get("project_id") is not None and not db.get(Project, values["project_id"]):
        raise HTTPException(400, "Project not found")


@router.get("", response_model=list[TaskOut])
def list_tasks(
    status: TaskStatus | None = None,
    assignee_id: int | None = None,
    project_id: int | None = None,
    due_date: date | None = None,
    user=Depends(current_user),
    db: Session = Depends(get_db),
):
    q = select(Task)
    if user.role == Role.executor:
        q = q.where(Task.assignee_id == user.id)
    if status:
        q = q.where(Task.status == status)
    if assignee_id:
        q = q.where(Task.assignee_id == assignee_id)
    if project_id:
        q = q.where(Task.project_id == project_id)
    if due_date:
        q = q.where(Task.due_date == due_date)
    return list(db.scalars(q.order_by(Task.created_at.desc())))


@router.post("", response_model=TaskOut, status_code=201)
def create_task(
    data: TaskCreate,
    user=Depends(require_roles(Role.admin, Role.manager)),
    db: Session = Depends(get_db),
):
    _validate_refs(db, data.model_dump())
    t = Task(**data.model_dump())
    db.add(t)
    db.commit()
    db.refresh(t)
    return t


@router.patch("/{task_id}", response_model=TaskOut)
def update_task(
    task_id: int, data: TaskUpdate, user=Depends(current_user), db: Session = Depends(get_db)
):
    t = db.get(Task, task_id)
    if not t:
        raise HTTPException(404, "Task not found")
    if user.role == Role.executor:
        allowed = set(data.model_dump(exclude_unset=True))
        if allowed != {"status"} or t.assignee_id != user.id:
            raise HTTPException(403, "Executors may only change status of their tasks")
    _validate_refs(db, data.model_dump(exclude_unset=True))
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(t, k, v)
    db.commit()
    db.refresh(t)
    return t


@router.patch("/{task_id}/status", response_model=TaskOut)
def set_status(
    task_id: int, data: StatusUpdate, user=Depends(current_user), db: Session = Depends(get_db)
):
    t = db.get(Task, task_id)
    if not t or not can_see(t, user):
        raise HTTPException(404, "Task not found")
    t.status = data.status
    db.commit()
    db.refresh(t)
    return t


@router.delete("/{task_id}", status_code=204)
def delete_task(
    task_id: int,
    user=Depends(require_roles(Role.admin, Role.manager)),
    db: Session = Depends(get_db),
):
    t = db.get(Task, task_id)
    if not t:
        raise HTTPException(404, "Task not found")
    db.delete(t)
    db.commit()


@router.get("/{task_id}/comments", response_model=list[CommentOut])
def comments(task_id: int, user=Depends(current_user), db: Session = Depends(get_db)):
    t = db.get(Task, task_id)
    if not t or not can_see(t, user):
        raise HTTPException(404, "Task not found")
    return list(
        db.scalars(select(Comment).where(Comment.task_id == task_id).order_by(Comment.created_at))
    )


@router.post("/{task_id}/comments", response_model=CommentOut, status_code=201)
def add_comment(
    task_id: int, data: CommentCreate, user=Depends(current_user), db: Session = Depends(get_db)
):
    t = db.get(Task, task_id)
    if not t or not can_see(t, user):
        raise HTTPException(404, "Task not found")
    c = Comment(task_id=task_id, user_id=user.id, text=data.text)
    db.add(c)
    db.commit()
    db.refresh(c)
    return c
