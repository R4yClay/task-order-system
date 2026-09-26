from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from sqlalchemy.orm import Session
from app.core.security import decode_token
from app.db.session import get_db
from app.models import User, Role

bearer = HTTPBearer()


def current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer), db: Session = Depends(get_db)
):
    try:
        payload = decode_token(credentials.credentials, "access")
        user = db.get(User, int(payload["sub"]))
    except Exception:
        user = None
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired access token"
        )
    return user


def require_roles(*roles: Role):
    def dep(user=Depends(current_user)):
        if user.role not in roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user

    return dep
