# ── Stage 1: Builder ──────────────────────────────────────────
FROM python:3.11-slim AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python packages into /root/.local (user install)
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# ── Stage 2: Production ────────────────────────────────────────
FROM python:3.11-slim

WORKDIR /app

# Only runtime dependencies needed
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy installed packages from builder stage
COPY --from=builder /root/.local /root/.local

# Copy application source
COPY . .

# Environment
ENV PATH=/root/.local/bin:$PATH
ENV PYTHONPATH=/app
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Expose API port
EXPOSE 8000

# Run with uvicorn (no --reload in production image, but docker-compose mounts live code)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
