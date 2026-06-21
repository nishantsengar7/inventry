"""
main.py – FastAPI application entry point.

Startup sequence:
  1. Create all DB tables via SQLAlchemy metadata (idempotent)
  2. Seed demo data if the users table is empty
  3. Register all routers
  4. Configure CORS for development
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, SessionLocal, check_db_connection
from app.database import Base  # noqa: F401 – keep for create_all

# Import ALL models so their tables are registered in metadata
import app.models  # noqa: F401

# Import all route modules
from app.routes import auth, categories, suppliers, products, transactions, dashboard
from app.utils.seed import seed_database


# ── Lifespan context manager ──────────────────────────────────

@asynccontextmanager
async def lifespan(application: FastAPI):
    """Run startup tasks before yielding, and cleanup on shutdown."""

    # 1. Create tables (skip existing ones – safe to run on every boot)
    Base.metadata.create_all(bind=engine)
    print("✅  Database tables ensured.")

    # 2. Seed demo data (no-op if data already exists)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()

    yield  # ── Application is live ──────────────────────────────

    # Shutdown
    print("👋  Inventory API shutting down.")


# ── FastAPI instance ──────────────────────────────────────────

app = FastAPI(
    title="Inventory Management System",
    description=(
        "AI-Enhanced Inventory Management REST API\n\n"
        "## Authentication\n"
        "Use `POST /auth/login` to obtain a JWT token, "
        "then click **Authorize** and enter `Bearer <token>`.\n\n"
        "**Demo credentials:**\n"
        "- Admin: `admin@demo.com` / `admin123`\n"
        "- Viewer: `viewer@demo.com` / `viewer123`"
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)


# ── CORS middleware ───────────────────────────────────────────
# Allows all origins in development.
# In production, replace "*" with your frontend domain.

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Include routers ───────────────────────────────────────────

app.include_router(auth.router)
app.include_router(categories.router)
app.include_router(suppliers.router)
app.include_router(products.router)
app.include_router(transactions.router)
app.include_router(dashboard.router)


# ── System routes ─────────────────────────────────────────────

@app.get("/health", tags=["System"], summary="Health check")
def health():
    """
    Returns 200 OK when the API is running.
    Also reports whether the PostgreSQL database is reachable.
    """
    db_ok = check_db_connection()
    return {
        "status":   "ok",
        "database": "connected" if db_ok else "unreachable",
        "version":  "1.0.0",
    }


@app.get("/", tags=["System"], include_in_schema=False)
def root():
    return {
        "message": "Inventory Management API is running.",
        "docs":    "/docs",
        "health":  "/health",
    }
