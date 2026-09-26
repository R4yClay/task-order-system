from app.core.security import hash_password, verify_password


def test_password_hashing():
    h = hash_password("Secret123!")
    assert h != "Secret123!"
    assert verify_password("Secret123!", h)
    assert not verify_password("wrong", h)
