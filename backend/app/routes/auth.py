"""Auth routes: register, login, /me."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserResponse, Token
from app.utils.auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    """
    Create a new user account.
    - Returns 400 if the email is already registered.
    - Passwords are stored as bcrypt hashes.
    """
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Email '{payload.email}' is already registered",
        )
    if payload.role not in ("admin", "viewer"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="role must be 'admin' or 'viewer'",
        )

    user = User(
        name=payload.name,
        email=payload.email,
        password=hash_password(payload.password),
        role=payload.role,
    )
    try:
        db.add(user)
        db.commit()
        db.refresh(user)
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user",
        ) from exc

    return user

@router.post(
    "/login",
    response_model=Token,
    summary="Login and obtain a JWT token",
)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    """
    Authenticate with email + password.
    Returns a Bearer JWT token valid for 24 hours.
    """
    user = db.query(User).filter(User.email == payload.email).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not verify_password(payload.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is deactivated",
        )

    token = create_access_token({"sub": user.email, "role": user.role})
    return Token(access_token=token)

@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current authenticated user",
)
def me(current_user: User = Depends(get_current_user)):
    """Return the profile of the currently authenticated user."""
    return current_user
