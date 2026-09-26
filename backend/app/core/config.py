from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_env: str = "development"
    seed_demo_data: bool = True
    database_url: str = "sqlite:///./dev.db"
    jwt_secret: str = "change-me"
    access_token_minutes: int = 30
    refresh_token_days: int = 14
    admin_email: str = "admin@example.com"
    admin_password: str = "Admin12345!"
    admin_name: str = "Emma Wilson"
    manager_email: str = "manager@example.com"
    manager_password: str = "Manager123!"
    manager_name: str = "James Miller"
    executor_email: str = "executor@example.com"
    executor_password: str = "Executor123!"
    executor_name: str = "Liam Chen"
    cors_origins: str = "http://localhost:5173"
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()

if settings.app_env == "production" and settings.jwt_secret in {"change-me", "change-me-in-production"}:
    raise RuntimeError("Set a strong JWT_SECRET before running in production")
