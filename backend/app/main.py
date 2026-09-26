from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.exceptions import HTTPException as FastAPIHTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from app.core.config import settings
from app.core.security import hash_password
from app.demo import seed_demo_data
from app.db.session import Base, engine, SessionLocal
from app.models import User, Role, Project
from app.api import auth, users, projects, tasks, analytics


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        demo_users = [
            (settings.admin_name, settings.admin_email, settings.admin_password, Role.admin),
            (
                settings.manager_name,
                settings.manager_email,
                settings.manager_password,
                Role.manager,
            ),
            (
                settings.executor_name,
                settings.executor_email,
                settings.executor_password,
                Role.executor,
            ),
        ]
        changed = False
        for name, email, password, role in demo_users:
            if not db.scalar(select(User).where(User.email == email)):
                db.add(
                    User(name=name, email=email, password_hash=hash_password(password), role=role)
                )
                changed = True
        if changed:
            db.commit()
        manager = db.scalar(select(User).where(User.email == settings.manager_email))
        if settings.seed_demo_data and manager:
            seed_demo_data(db, owner=manager)
        elif not db.scalar(select(Project).limit(1)):
            admin = db.scalar(select(User).where(User.email == settings.admin_email))
            if admin:
                db.add(Project(name="General", description="Default project", owner_id=admin.id))
                db.commit()
    finally:
        db.close()
    yield


app = FastAPI(
    title="TaskFlow API",
    description="REST API for tasks, projects, users and analytics with JWT auth and role-based access.",
    version="1.0.0",
    lifespan=lifespan,
)

ERROR_TRANSLATIONS = {
    "Invalid email or password": "Неверный email или пароль",
    "Invalid or expired access token": "Сессия истекла или токен недействителен",
    "Invalid refresh token": "Недействительный токен обновления",
    "Insufficient permissions": "Недостаточно прав для выполнения операции",
    "Assignee not found": "Исполнитель не найден",
    "Task not found": "Задача не найдена",
    "User not found": "Пользователь не найден",
    "Email already registered": "Пользователь с таким email уже существует",
    "Only project owner can edit": "Изменять проект может только его владелец",
    "Only project owner can delete": "Удалять проект может только его владелец",
    "Forbidden": "Доступ запрещён",
    "Executors may only change status of their tasks": "Исполнитель может менять только статус своих задач",
    "Only admin can change role": "Менять роль может только администратор",
    "Project not found": "Проект не найден",
}


@app.exception_handler(FastAPIHTTPException)
async def localized_http_exception(request: Request, exc: FastAPIHTTPException):
    language = request.headers.get("accept-language", "en").lower()
    detail = exc.detail
    if language.startswith("ru") and isinstance(detail, str):
        detail = ERROR_TRANSLATIONS.get(detail, detail)
    return JSONResponse(
        status_code=exc.status_code, content={"detail": detail}, headers=exc.headers
    )


app.add_middleware(
    CORSMiddleware,
    allow_origins=[x.strip() for x in settings.cors_origins.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(projects.router, prefix="/api")
app.include_router(tasks.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")


@app.get("/health")
def health():
    return {"status": "ok"}
