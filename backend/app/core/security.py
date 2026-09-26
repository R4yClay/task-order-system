from datetime import datetime, timedelta, timezone
import jwt
from pwdlib import PasswordHash
from app.core.config import settings

password_hash = PasswordHash.recommended()
ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(password: str, hashed: str) -> bool:
    return password_hash.verify(password, hashed)


def create_token(subject: str, kind: str, expires: timedelta) -> str:
    now = datetime.now(timezone.utc)
    return jwt.encode(
        {"sub": subject, "kind": kind, "iat": now, "exp": now + expires},
        settings.jwt_secret,
        algorithm=ALGORITHM,
    )


def decode_token(token: str, kind: str):
    payload = jwt.decode(token, settings.jwt_secret, algorithms=[ALGORITHM])
    if payload.get("kind") != kind or not payload.get("sub"):
        raise jwt.InvalidTokenError("Invalid token")
    return payload
