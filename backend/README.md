# InvenTrack - AI-Enhanced Inventory Management Backend API

[![Docker Image Size](https://img.shields.io/docker/image-size/nishantsengar7/ims-backend/latest)](https://hub.docker.com/r/nishantsengar7/ims-backend)
[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat&logo=python&logoColor=white)](https://www.python.org/)

A robust, enterprise-grade Inventory and Order Management backend built with **FastAPI**, **PostgreSQL**, and integrated **AI Engines** for intelligent stock forecasting and reorder suggestions.

---

## 🚀 Key Features

*   **🔒 Secure JWT Authentication**: Robust authentication system supporting **Admin** and **Viewer** roles with role-based access control (RBAC).
*   **🛒 Atomic Order Management**: Enforces strict backend-level constraints on stock reductions, atomic database transactions, and price snapshots.
*   **📦 Concurrency Protection**: Utilizes row-locking (`WITH FOR UPDATE`) during order updates, creation, and stock adjustments to prevent race conditions.
*   **🤖 AI-Powered Stock Insights**: Integrated stock level forecasting, automated reorder thresholds, anomaly detection, and overall warehouse health score.
*   **📊 Clean Dashboard Metrics**: API endpoints to retrieve key metrics including total revenue, inventory valuations, low-stock lists, and recent activity queues.

---

## 🛠️ Tech Stack & Architecture

*   **Framework**: FastAPI (Asynchronous REST API)
*   **Database**: PostgreSQL
*   **ORM**: SQLAlchemy with context-based session management
*   **Validations**: Pydantic v2
*   **Security**: PyJWT with bcrypt password hashing
*   **Containerization**: Docker (multi-stage minimal build ~111.5 MB)

---

## 🐳 Docker Deployment Guide

To pull and run this backend image directly from Docker Hub:

### 1. Pull the Image
```bash
docker pull nishantsengar7/ims-backend:latest
```

### 2. Run the Container
Set up the necessary environment variables and run the container linked to your PostgreSQL database:

```bash
docker run -d \
  --name ims-backend \
  -p 8000:8000 \
  -e DATABASE_URL=postgresql://<user>:<password>@<db-host>:5432/<db-name> \
  -e SECRET_KEY=your-jwt-signing-secret-key-min-32-chars \
  -e GEMINI_API_KEY=your-gemini-key \
  nishantsengar7/ims-backend:latest
```

---

## ⚙️ Environment Configuration

The backend looks for the following environment variables:

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://admin:admin123@postgres:5432/inventory_db` |
| `SECRET_KEY` | Secret key used for signing JWT tokens | `supersecretkey123changeInProduction` |
| `ALGORITHM` | Algorithm used for token encryption | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES`| JWT token validity duration | `1440` (24 Hours) |
| `GEMINI_API_KEY` | Google Gemini API Key for AI Insights | `your-api-key-here` |
| `ENVIRONMENT` | Environment level | `production` / `development` |

---

## 📋 Core API Endpoints

Once running, interactive documentation is available at `http://localhost:8000/docs`.

### Authentication
*   `POST /auth/register` - Register a new user account.
*   `POST /auth/login` - Obtain JWT access token.
*   `GET /auth/me` - Get details of current authenticated user.

### Products & Categories
*   `GET /products` - List products (supports SKU/name searches & low stock filters).
*   `POST /products` - Create a product (Admin only).
*   `PUT /products/{id}` - Update product details or stock (Admin only).
*   `DELETE /products/{id}` - Delete product (blocked if linked to orders).
*   `GET /categories` - List categories.

### Customers & Orders
*   `GET /customers` - Searchable list of customers.
*   `POST /orders` - Create a new order (locks rows, reduces stock, snapshots price).
*   `PATCH /orders/{id}/status` - Transition status (`pending` -> `completed` / `cancelled`).
*   `DELETE /orders/{id}` - Cancel order and restore stock (blocked for completed orders).

### Transactions & AI
*   `GET /transactions` - List all stock movements (`IN` / `OUT` logs).
*   `POST /transactions` - Record manual stock adjustment (Admin only).
*   `GET /ai/forecast` - AI-generated sales prediction charts.
*   `GET /ai/reorder-suggestions` - Recommended purchase orders.
