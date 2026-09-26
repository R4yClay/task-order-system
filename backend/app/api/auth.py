from datetime import timedelta
import jwt
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.api.deps import current_user
from app.core.config import settings
from app.core.security import hash_password, verify_password, create_token, decode_token
from app.db.session import get_db
from app.models import User, Role
from app.schemas import Login, TokenPair, UserCreate, UserOut

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserOut, status_code=201)
def register(data: UserCreate, db: Session = Depends(get_db)):
    if db.scalar(select(User).where(User.email == data.email)):
        raise HTTPException(409, "Email already registered")
    # Public sign-up always creates an executor: roles are granted by an admin only.
    user = User(
        name=data.name,
        email=data.email,
        password_hash=hash_password(data.password),
        role=Role.executor,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def tokens(user: User):
    return TokenPair(
        access_token=create_token(
            str(user.id), "access", timedelta(minutes=settings.access_token_minutes)
        ),
        refresh_token=create_token(
            str(user.id), "refresh", timedelta(days=settings.refresh_token_days)
        ),
    )


@router.post("/login", response_model=TokenPair)
def login(data: Login, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == data.email))
    if not user or not user.is_active or not verify_password(data.password, user.password_hash):
        raise HTTPException(401, "Invalid email or password")
    return tokens(user)


@router.post("/refresh", response_model=TokenPair)
def refresh(refresh_token: str, db: Session = Depends(get_db)):
    try:
        payload = decode_token(refresh_token, "refresh")
        user = db.get(User, int(payload["sub"]))
    except Exception:
        user = None
    if not user or not user.is_active:
        raise HTTPException(401, "Invalid refresh token")
    return tokens(user)


@router.get("/me", response_model=UserOut)
def me(user=Depends(current_user)):
    return user
