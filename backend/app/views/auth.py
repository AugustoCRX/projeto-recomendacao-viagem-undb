"""views/auth.py — register, login, me, change-password."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from core.security import create_access_token, hash_password, verify_password
from deps import get_current_user, get_db
from models.user import User
from schemas.auth import (
    ChangePasswordRequest,
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)

router = APIRouter()


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=201,
    summary="Register a new user",
    description="Creates a new user account with a bcrypt-hashed password and returns a JWT.",
    responses={
        201: {"description": "User created"},
        409: {"description": "Email already registered"},
        422: {"description": "Validation error"},
    },
)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> TokenResponse:
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=409, detail="Email already registered")
    user = User(
        name=payload.name,
        email=payload.email,
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(user=UserResponse.model_validate(user), token=token)


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Authenticate and receive a JWT",
    description="Validates credentials and returns a 7-day JWT on success.",
    responses={200: {"description": "Login successful"}, 401: {"description": "Invalid credentials"}},
)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(user=UserResponse.model_validate(user), token=token)


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get the current authenticated user",
    responses={200: {"description": "Current user"}, 401: {"description": "Not authenticated"}},
)
def me(current_user: User = Depends(get_current_user)) -> UserResponse:
    return UserResponse.model_validate(current_user)


@router.put(
    "/change-password",
    status_code=204,
    summary="Change the current user's password",
    description="Verifies ``current_password`` and replaces it with ``new_password`` (bcrypt hashed).",
    responses={
        204: {"description": "Password updated"},
        401: {"description": "Not authenticated or current password incorrect"},
    },
)
def change_password(
    payload: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(status_code=401, detail="Current password is incorrect")
    current_user.password_hash = hash_password(payload.new_password)
    db.commit()
    return None
