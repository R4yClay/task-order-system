from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.api.deps import require_roles, current_user
from app.core.security import hash_password
from app.db.session import get_db
from app.models import User, Role
from app.schemas import UserCreate, UserOut, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=list[UserOut])
def list_users(user=Depends(current_user), db: Session = Depends(get_db)):
    if user.role == Role.executor:
        return [user]
    return list(db.scalars(select(User).order_by(User.id)))


@router.post("", response_model=UserOut, status_code=201)
def create_user(
    data: UserCreate, admin=Depends(require_roles(Role.admin)), db: Session = Depends(get_db)
):
    if db.scalar(select(User).where(User.email == data.email)):
        raise HTTPException(409, "Email already registered")
    u = User(
        name=data.name, email=data.email, password_hash=hash_password(data.password), role=data.role
    )
    db.add(u)
    db.commit()
    db.refresh(u)
    return u


@router.patch("/{user_id}", response_model=UserOut)
def update_user(
    user_id: int, data: UserUpdate, current=Depends(current_user), db: Session = Depends(get_db)
):
    u = db.get(User, user_id)
    if not u:
        raise HTTPException(404, "User not found")
    if current.role != Role.admin and current.id != user_id:
        raise HTTPException(403, "Forbidden")
    if data.role is not None and current.role != Role.admin:
        raise HTTPException(403, "Only admin can change role")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(u, k, v)
    db.commit()
    db.refresh(u)
    return u
