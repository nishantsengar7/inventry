"""
main.py – FastAPI application entry point.

Startup sequence:
  1. Create all DB tables via SQLAlchemy metadata (idempotent)
  2. Seed demo data if the users table is empty
  3. Register all routers
  4. Configure CORS, request logging, and rate limiting
"""

import os
import time
import logging
from collections import defaultdict
from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.database import engine, SessionLocal, check_db_connection
from app.database import Base

import app.models

from app.routes import auth, categories, suppliers, products, transactions, dashboard, ai, customers
from app.routes.orders import router as orders_router
from app.utils.seed import seed_database
from app.models.customer import Customer
from app.models.order import Order, OrderItem

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("ims")

_rate_data: dict = defaultdict(lambda: {"count": 0, "reset_at": 0.0})
RATE_LIMIT_GENERAL  = 100
RATE_LIMIT_AUTH     = 10
RATE_WINDOW         = 60

def _check_rate_limit(ip: str, limit: int) -> bool:
    """Return True if the request is allowed, False if rate-limited."""
    now = time.time()
    bucket = _rate_data[ip]
    if now > bucket["reset_at"]:
        bucket["count"] = 0
        bucket["reset_at"] = now + RATE_WINDOW
    bucket["count"] += 1
    return bucket["count"] <= limit

@asynccontextmanager
async def lifespan(application: FastAPI):
    """Run startup tasks before yielding, and cleanup on shutdown."""

    Base.metadata.create_all(bind=engine)
    logger.info("[OK] Database tables ensured.")

    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()

    yield

    logger.info("[INFO] Inventory API shutting down.")

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

_cors_origins_raw = os.environ.get(
    "CORS_ORIGINS",
    "http://localhost:3000,http://localhost:5173,http://localhost:80,http://localhost"
)
_cors_origins = [o.strip() for o in _cors_origins_raw.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log every request: method + path + status + duration."""
    start = time.time()
    response = await call_next(request)
    elapsed_ms = round((time.time() - start) * 1000)
    logger.info(
        "%s %s %s %dms",
        request.method,
        request.url.path,
        response.status_code,
        elapsed_ms,
    )
    return response

@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    """Simple per-IP rate limiting."""
    client_ip = request.client.host if request.client else "unknown"

    is_auth = request.url.path in ("/auth/login", "/auth/register")
    limit = RATE_LIMIT_AUTH if is_auth else RATE_LIMIT_GENERAL

    if not _check_rate_limit(client_ip, limit):
        logger.warning("Rate limit exceeded: %s %s from %s", request.method, request.url.path, client_ip)
        return JSONResponse(
            status_code=429,
            content={
                "error": True,
                "message": "Too many requests. Please slow down.",
                "code": "RATE_001",
                "retry_after_seconds": RATE_WINDOW,
            },
        )

    return await call_next(request)

app.include_router(auth.router)
app.include_router(categories.router)
app.include_router(suppliers.router)
app.include_router(products.router)
app.include_router(transactions.router)
app.include_router(dashboard.router)
app.include_router(ai.router, prefix="/ai", tags=["AI Features"])
app.include_router(customers.router)
app.include_router(
    orders_router,
    prefix="/orders",
    tags=["Orders"]
)

@app.get("/health", tags=["System"], summary="Enhanced health check")
def health():
    """
    Returns detailed system health:
    - API status and version
    - Database connectivity + product count + response time
    - AI service configuration status
    """
    from app.models.product import Product

    db_status = "connected"
    product_count = 0
    db_response_ms = 0

    db = SessionLocal()
    try:
        t0 = time.time()
        product_count = db.query(Product).count()
        db_response_ms = round((time.time() - t0) * 1000)
    except Exception as e:
        db_status = "error"
        logger.error("Health check DB error: %s", e)
    finally:
        db.close()

    anthropic_key = os.environ.get("ANTHROPIC_API_KEY", "")
    gemini_key    = os.environ.get("GEMINI_API_KEY", "")

    return {
        "status": "ok",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "version": "1.0.0",
        "environment": os.environ.get("ENVIRONMENT", "development"),
        "database": {
            "status": db_status,
            "product_count": product_count,
            "response_time_ms": db_response_ms,
        },
        "services": {
            "ai_chat_anthropic": "configured" if anthropic_key else "not configured",
            "ai_chat_gemini":    "configured" if gemini_key    else "not configured",
            "forecasting":       "active",
            "anomaly_detection": "active",
        },
    }

@app.get("/", tags=["System"], include_in_schema=False)
def root():
    return {
        "message": "Inventory Management API is running.",
        "docs":    "/docs",
        "health":  "/health",
    }
