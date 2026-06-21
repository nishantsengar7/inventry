"""
main.py – FastAPI application entry point.

Startup order:
  1. Create all DB tables (if they don't exist)
  2. Seed a default admin user (if none exists)
  3. Register all routers
  4. Configure CORS
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.database import engine, SessionLocal
import app.models  # noqa: F401 – import models so metadata is populated

from app.routes import auth, categories, suppliers, products, transactions
from app.models.user import User
from app.utils.auth import hash_password


# ── Lifespan (runs on startup & shutdown) ────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup ──────────────────────────────────────────────
    # Create tables (idempotent – won't drop existing data)
    from app.database import Base
    Base.metadata.create_all(bind=engine)

    # Seed default admin user
    db = SessionLocal()
    try:
        if not db.query(User).filter(User.username == "admin").first():
            admin = User(
                username="admin",
                email="admin@inventory.local",
                hashed_password=hash_password("admin123"),
                is_active=True,
                is_admin=True,
            )
            db.add(admin)
            db.commit()
            print("✅  Default admin user created  (admin / admin123)")
        else:
            print("✅  Admin user already exists")
    finally:
        db.close()

    yield  # Application is running

    # ── Shutdown (add cleanup here if needed) ─────────────────
    print("👋  Shutting down…")


# ── FastAPI instance ──────────────────────────────────────────
app = FastAPI(
    title="Inventory Management API",
    description="REST API for the Inventory Management System",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────
# In production restrict allow_origins to your actual frontend domain.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(categories.router)
app.include_router(suppliers.router)
app.include_router(products.router)
app.include_router(transactions.router)


# ── Health check ──────────────────────────────────────────────
@app.get("/health", tags=["System"], summary="Health check")
def health():
    """Returns 200 OK when the API is running."""
    return {"status": "ok", "version": "1.0.0"}


# ── Root redirect ─────────────────────────────────────────────
@app.get("/", tags=["System"], include_in_schema=False)
def root():
    return {"message": "Inventory Management API – visit /docs for Swagger UI"}
