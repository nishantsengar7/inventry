# 📦 Inventory Management System

A full-stack Inventory Management System built with **React + Vite**, **FastAPI**, **PostgreSQL**, and **Docker**.

![Tech Stack](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61dafb?logo=react)
![Backend](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi)
![Database](https://img.shields.io/badge/Database-PostgreSQL%2015-336791?logo=postgresql)
![Docker](https://img.shields.io/badge/Containerized-Docker%20Compose-2496ed?logo=docker)

---

## 🚀 Quick Start

```bash
git clone https://github.com/nishantsengar7/inventry.git
cd inventry
docker compose up --build
```

> **First run** takes ~2–3 minutes while Docker pulls images and installs dependencies.

---

## 🌐 Access

| Service     | URL                          | Credentials              |
|-------------|------------------------------|--------------------------|
| Frontend    | http://localhost:3000        | `admin` / `admin123`     |
| Backend API | http://localhost:8000        | —                        |
| Swagger UI  | http://localhost:8000/docs   | —                        |
| ReDoc       | http://localhost:8000/redoc  | —                        |
| pgAdmin     | http://localhost:5050        | `admin@admin.com` / `admin123` |

---

## 🛠️ Tech Stack

| Layer          | Technology                          |
|----------------|-------------------------------------|
| Frontend       | React 18, Vite 5, Tailwind CSS 3    |
| State / Routing| React Router v6, Context API        |
| HTTP Client    | Axios                               |
| Charts         | Recharts                            |
| Notifications  | React Hot Toast                     |
| Backend        | FastAPI, Python 3.11, Uvicorn       |
| ORM            | SQLAlchemy 2.0                      |
| Auth           | JWT (python-jose) + bcrypt          |
| Database       | PostgreSQL 15                       |
| Migrations     | Alembic                             |
| Containers     | Docker, Docker Compose              |

---

## 📁 Project Structure

```
inventry/
├── frontend/                  # React + Vite + Tailwind
│   ├── src/
│   │   ├── components/        # Reusable UI (Layout, etc.)
│   │   ├── pages/             # Login, Dashboard, Products, …
│   │   ├── services/          # Axios API client
│   │   └── context/           # AuthContext (JWT)
│   ├── Dockerfile             # Multi-stage: Node build → Nginx serve
│   └── package.json
│
├── backend/                   # FastAPI Python API
│   ├── app/
│   │   ├── main.py            # FastAPI app + lifespan + routers
│   │   ├── database.py        # SQLAlchemy engine & session
│   │   ├── models/            # ORM models (User, Product, …)
│   │   ├── schemas/           # Pydantic request/response schemas
│   │   ├── routes/            # API route handlers
│   │   └── utils/             # Auth helpers (JWT, bcrypt)
│   ├── requirements.txt
│   └── Dockerfile
│
├── docker-compose.yml         # Orchestrates all 4 services
└── README.md
```

---

## ✨ Features

- 🔐 **JWT Authentication** – secure login with bcrypt password hashing
- 📊 **Dashboard** – real-time charts (stock movement, category breakdown)
- 📦 **Products** – full CRUD with SKU, reorder level, and stock status
- 🏷️ **Categories** – organise products into groups
- 🚚 **Suppliers** – manage supply chain partners with contact info
- 🔄 **Transactions** – atomic stock IN/OUT with audit trail
- ⚠️ **Low Stock Alerts** – automatic detection below reorder level
- 📖 **Swagger UI** – auto-generated interactive API docs at `/docs`

---

## 🔧 Development

### Run services individually

```bash
# Backend only
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend only
cd frontend
npm install
npm run dev
```

### Environment variables (backend)

| Variable                      | Default                                           |
|-------------------------------|---------------------------------------------------|
| `DATABASE_URL`                | `postgresql://admin:admin123@postgres:5432/inventory_db` |
| `SECRET_KEY`                  | `supersecretkey123changeInProduction`             |
| `ALGORITHM`                   | `HS256`                                           |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `60`                                              |

---

## 🐳 Docker Commands

```bash
# Start all services
docker compose up --build

# Start in background
docker compose up -d --build

# Stop all services
docker compose down

# Remove volumes (WARNING: deletes all data)
docker compose down -v

# View logs
docker compose logs -f backend
docker compose logs -f frontend
```

---

## 📋 API Endpoints

| Method | Endpoint                  | Description               | Auth |
|--------|---------------------------|---------------------------|------|
| POST   | `/auth/token`             | Login – obtain JWT        | ❌   |
| POST   | `/auth/register`          | Register new user         | ❌   |
| GET    | `/auth/me`                | Get current user          | ✅   |
| GET    | `/health`                 | Health check              | ❌   |
| CRUD   | `/products/`              | Product management        | ✅   |
| CRUD   | `/categories/`            | Category management       | ✅   |
| CRUD   | `/suppliers/`             | Supplier management       | ✅   |
| GET/POST | `/transactions/`        | Stock movements           | ✅   |

---

## 📄 License

MIT © 2024 Nishant Sengar
