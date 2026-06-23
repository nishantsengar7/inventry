# InvenTrack Backend API

FastAPI + PostgreSQL + AI Engine

## Setup
```bash
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## API Docs
http://localhost:8000/docs

## Environment Variables
- `DATABASE_URL`=postgresql://admin:admin123@postgres:5432/inventory_db
- `SECRET_KEY`=your-secret-key
- `GEMINI_API_KEY`=your-key (optional, for AI chat and insights)

## Project Structure
```
app/
├── ai/          # AI features engine
├── models/      # SQLAlchemy ORM models
├── routes/      # API endpoints
├── schemas/     # Pydantic validation schemas
└── utils/       # Auth + seed data
```

## Key Endpoints
- `POST /auth/login`      → Get JWT token
- `GET  /products`        → List products
- `GET  /dashboard/stats` → Overview stats
- `GET  /ai/forecast`     → AI predictions
- `POST /ai/chat`         → Chat with AI

## Running Tests
```bash
bash ../test_app.sh
```
