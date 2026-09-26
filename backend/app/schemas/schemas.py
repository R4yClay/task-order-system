from datetime import date, datetime
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from app.models import Role, TaskStatus, Priority


class UserCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    role: Role = Role.executor


class UserUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    role: Role | None = None
    is_active: bool | None = None


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    email: EmailStr
    role: Role
    is_active: bool
    created_at: datetime


class Login(BaseModel):
    email: EmailStr
    password: str


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class ProjectCreate(BaseModel):
    name: str = Field(min_length=2, max_length=160)
    description: str | None = None


class ProjectOut(ProjectCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int
    owner_id: int


class TaskCreate(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    description: str | None = None
    status: TaskStatus = TaskStatus.todo
    priority: Priority = Priority.medium
    assignee_id: int | None = None
    project_id: int
    due_date: date | None = None


class TaskUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=200)
    description: str | None = None
    status: TaskStatus | None = None
    priority: Priority | None = None
    assignee_id: int | None = None
    project_id: int | None = None
    due_date: date | None = None


class TaskOut(TaskCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime


class StatusUpdate(BaseModel):
    status: TaskStatus


class CommentCreate(BaseModel):
    text: str = Field(min_length=1, max_length=5000)


class CommentOut(CommentCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int
    task_id: int
    user_id: int
    author_name: str | None = None
    created_at: datetime
