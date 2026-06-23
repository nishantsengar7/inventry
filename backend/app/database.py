"""
database.py – SQLAlchemy engine, session factory, and Base.

All models import Base from here to register themselves with SQLAlchemy's
metadata so that create_all() can create the tables.
"""

import os
from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL: str = os.environ.get(
    "DATABASE_URL",
    "sqlite:///./inventory.db",
)

connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False
    engine = create_engine(
        DATABASE_URL,
        connect_args=connect_args,
    )
else:
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20,
    )

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

Base = declarative_base()

def get_db():
    """
    FastAPI dependency that yields a database session per request and
    ensures the session is always closed, even on errors.

    Usage in a route:
        @router.get("/items")
        def list_items(db: Session = Depends(get_db)):
            ...
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def check_db_connection() -> bool:
    """Return True if the database is reachable, False otherwise."""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception:
        return False
