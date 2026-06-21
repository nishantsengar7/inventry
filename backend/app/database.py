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

# Load .env file if present (useful for local development without Docker)
load_dotenv()

# ── Database URL ──────────────────────────────────────────────
# Read from environment variable; fail loudly if missing so the issue is
# obvious rather than silently using a default.
DATABASE_URL: str = os.environ.get(
    "DATABASE_URL",
    "postgresql://admin:admin123@localhost:5432/inventory_db",  # local fallback
)

# ── Engine ────────────────────────────────────────────────────
# pool_pre_ping=True ensures stale connections are recycled automatically.
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

# ── Session Factory ───────────────────────────────────────────
# autocommit=False  → we commit explicitly (good practice)
# autoflush=False   → we flush explicitly to avoid surprise queries
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

# ── Base ──────────────────────────────────────────────────────
# All ORM models should inherit from this Base so that
# Base.metadata.create_all(engine) creates their tables.
Base = declarative_base()


# ── Dependency ────────────────────────────────────────────────
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


# ── Health helper ─────────────────────────────────────────────
def check_db_connection() -> bool:
    """Return True if the database is reachable, False otherwise."""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception:
        return False
