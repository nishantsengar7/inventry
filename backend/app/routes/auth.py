"""Auth routes – login (token) and current user."""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.user import Token, UserCreate, UserOut
from app.utils.auth import (
    verify_password, hash_password,
    create_access_token, get_current_user,
)

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/token", response_model=Token, summary="Login – obtain JWT")
def login(
    form: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    """Authenticate with username + password and return a JWT."""
    user = db.query(User).filter(User.username == form.username).first()
    if not user or not verify_password(form.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = create_access_token({"sub": user.username})
    return Token(access_token=token)


@router.post("/register", response_model=UserOut, status_code=201,
             summary="Register a new user")
def register(payload: UserCreate, db: Session = Depends(get_db)):
    """Create a new user account."""
    if db.query(User).filter(User.username == payload.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        username=payload.username,
        email=payload.email,
        hashed_password=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get("/me", response_model=UserOut, summary="Get current user")
def me(current_user: User = Depends(get_current_user)):
    """Return the currently authenticated user."""
    return current_user
