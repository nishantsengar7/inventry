.PHONY: up up-logs build down clean restart-backend restart-frontend \
        logs logs-backend logs-frontend shell-backend shell-db seed health push

# ── Start services ────────────────────────────────────────────

## Start all services in background
up:
	docker compose up -d

## Start with live logs visible
up-logs:
	docker compose up

## Build images and start
build:
	docker compose up --build -d

## Stop all services
down:
	docker compose down

## Stop + remove volumes (fresh start — ⚠ deletes all data)
clean:
	docker compose down -v
	docker system prune -f

# ── Restart individual services ───────────────────────────────

restart-backend:
	docker compose restart backend

restart-frontend:
	docker compose restart frontend

restart-nginx:
	docker compose restart nginx

# ── Logs ─────────────────────────────────────────────────────

logs:
	docker compose logs -f

logs-backend:
	docker compose logs -f backend

logs-frontend:
	docker compose logs -f frontend

logs-nginx:
	docker compose logs -f nginx

logs-db:
	docker compose logs -f postgres

# ── Shell access ──────────────────────────────────────────────

shell-backend:
	docker compose exec backend bash

shell-db:
	docker compose exec postgres psql -U admin -d inventory_db

# ── Database seed (run manually if needed) ───────────────────

seed:
	docker compose exec backend python -c "\
from app.utils.seed import seed_database; \
from app.database import SessionLocal; \
db = SessionLocal(); \
seed_database(db); \
db.close(); \
print('Done')"

# ── Health check ─────────────────────────────────────────────

health:
	@curl -s http://localhost:8000/health | python -m json.tool

# ── Docker Hub push ───────────────────────────────────────────
# Set DOCKER_USER environment variable before running

push:
	docker tag inventry-backend $(DOCKER_USER)/ims-backend:latest
	docker tag inventry-frontend $(DOCKER_USER)/ims-frontend:latest
	docker push $(DOCKER_USER)/ims-backend:latest
	docker push $(DOCKER_USER)/ims-frontend:latest
	@echo "Pushed to hub.docker.com/r/$(DOCKER_USER)/"
