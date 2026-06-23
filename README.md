# 📦 InvenTrack — AI-Powered Inventory Management System

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Python](https://img.shields.io/badge/python-3.11-green)
![React](https://img.shields.io/badge/react-18-blue)
![Docker](https://img.shields.io/badge/docker-ready-blue)
![License](https://img.shields.io/badge/license-MIT-green)

> A production-ready, AI-enhanced Inventory Management System built with FastAPI, React, PostgreSQL, and Gemini API.

### 🌐 Live Deployments
- 💻 **Frontend Web App**: [https://inventry-tawny.vercel.app](https://inventry-tawny.vercel.app)
- 📡 **Backend API (Swagger Docs)**: [https://inventry-739f.onrender.com/docs](https://inventry-739f.onrender.com/docs)
- 📡 **Backend API (Redoc)**: [https://inventry-739f.onrender.com/redoc](https://inventry-739f.onrender.com/redoc)

---

## ✨ Features

### Core Features
- 📦 Complete product management (CRUD)
- 🏷️ Category organization system
- 🚛 Supplier management
- 📊 Stock IN/OUT transaction tracking
- 🔐 JWT authentication with role-based access (Admin / Viewer)
- 🔍 Advanced search and filtering
- 📱 Fully responsive design

### AI-Powered Features
- 🤖 Demand Forecasting
  Predicts stockout dates based on 30-day transaction history
- 📦 Smart Reorder Engine
  Calculates safety stock and optimal reorder quantities with cost estimates
- ⚠️ Anomaly Detection
  Flags unusual stock movements using statistical z-score analysis
- ❤️ Inventory Health Score
  Grades your inventory A-F based on stock levels, turnover, and accuracy
- 💬 AI Chat Assistant
  Natural language Q&A powered by Gemini API with real inventory data
- 🏷️ Auto Category Suggestion
  Suggests product categories using keyword matching as you type

---

## 🚀 Quick Start

### Prerequisites
- Docker Desktop installed
- Docker Compose v2+
- Git

### 1. Clone Repository
```bash
git clone https://github.com/nishantsengar7/inventry.git
cd inventry
```

### 2. Configure Environment
```bash
cp .env.example .env
```

Edit .env file:
```env
SECRET_KEY=your-secret-key-here
GEMINI_API_KEY=your-gemini-key-here
POSTGRES_PASSWORD=admin123
```

Get free Gemini API key:
https://aistudio.google.com

### 3. Start Application
```bash
docker compose up --build
```

Wait 2-3 minutes for all services to start and database to seed.

### 4. Access Application

| Service | URL |
|---------|-----|
| 🌐 Frontend App | http://localhost:3000 |
| 📡 API (Swagger) | http://localhost:8000/docs |
| 🗄️ pgAdmin | http://localhost:5050 |
| 🔀 Nginx Proxy | http://localhost:80 |

### 5. Demo Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@demo.com | admin123 |
| Viewer | viewer@demo.com | viewer123 |

Admin can: Create, Edit, Delete everything
Viewer can: View all data, no modifications

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│              Client Browser              │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│           Nginx Reverse Proxy            │
│              (Port 80)                   │
└──────┬───────────────────────┬──────────┘
       │                       │
┌──────▼──────┐         ┌──────▼──────────┐
│   React     │         │   FastAPI        │
│  Frontend   │         │   Backend        │
│  (Port 3000)│         │   (Port 8000)    │
│             │         │                  │
│  - Vite     │         │  - SQLAlchemy    │
│  - Tailwind │         │  - JWT Auth      │
│  - Recharts │         │  - AI Engine     │
│  - Axios    │         │  - Swagger UI    │
└─────────────┘         └──────┬───────────┘
                               │
                    ┌──────────▼──────────┐
                    │    PostgreSQL 15     │
                    │    (Port 5432)       │
                    │                     │
                    │  - inventory_db     │
                    │  - 5 tables         │
                    │  - 15+ products     │
                    │  - 60+ transactions │
                    └─────────────────────┘
                    
        External Services:
        ┌─────────────────────┐
        │     Gemini API      │
        │   (Gemini AI Chat)  │
        └─────────────────────┘
```

---

## 🗄️ Database Schema

```
users
├── id, name, email, password (hashed)
├── role (admin/viewer)
└── created_at

categories
├── id, name, description
└── created_at

suppliers  
├── id, name, email, phone, address
└── created_at

products
├── id, name, sku, description
├── price, quantity, threshold
├── category_id → categories.id
├── supplier_id → suppliers.id
└── created_at, updated_at

transactions
├── id, product_id → products.id
├── type (IN/OUT), quantity, note
└── created_at
```

---

## 📡 API Documentation

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/register | Create account |
| POST | /auth/login | Get JWT token |
| GET | /auth/me | Current user info |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /products | List all products |
| POST | /products | Create product |
| PUT | /products/{id} | Update product |
| DELETE | /products/{id} | Delete product |
| GET | /products/low-stock | Low stock items |

### Inventory
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /transactions | Transaction history |
| POST | /transactions | Record stock movement |
| GET | /dashboard/stats | Overview statistics |
| GET | /dashboard/ai-insights | Quick AI summary |

### AI Features
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /ai/forecast | Demand forecasting |
| GET | /ai/reorder-suggestions | Reorder alerts |
| GET | /ai/anomalies | Anomaly detection |
| GET | /ai/health-score | Health grade |
| POST | /ai/suggest-category | Category AI |
| POST | /ai/chat | AI chat assistant |

Full interactive docs: http://localhost:8000/docs

---

## 🤖 AI Features Explained

### 1. Demand Forecasting
- Analyzes last 30 days of OUT transactions
- Calculates average daily usage per product
- Predicts exact stockout date
- Shows trend (increasing/stable/decreasing)
- Confidence level based on data availability

### 2. Smart Reorder Engine
Formula used:
```
Safety Stock = avg_daily_usage × 7 × 0.5
Reorder Point = (avg_daily_usage × 7) 
                + safety_stock
Reorder Qty   = avg_daily_usage × 30
```

### 3. Anomaly Detection
Uses Z-score statistical analysis:
```
Z = (transaction_qty - mean) / std_deviation
│Z│ > 2.0 → Medium anomaly (warning)
│Z│ > 3.0 → High anomaly (critical flag)
```

### 4. Health Score
Four components (weighted):
```
Stock Score       30% weight
Turnover Score    25% weight  
Accuracy Score    20% weight
Availability Score 25% weight

Grade: A(90+) B(75+) C(60+) D(45+) F(<45)
```

### 5. AI Chat (Gemini-powered)
- Passes real inventory data as context
- Answers natural language questions
- Maintains conversation history
- Suggests reorder actions
- Powered by Gemini 2.5 Flash / Pro

---

## 🐳 Docker Details

### Services
```yaml
ims_postgres   → PostgreSQL 15 (port 5432)
ims_backend    → FastAPI app (port 8000)
ims_frontend   → React/Nginx (port 3000)
ims_pgadmin    → DB admin UI (port 5050)
ims_nginx      → Reverse proxy (port 80)
```

### Docker Hub Images
```bash
docker pull nishantsengar7/ims-backend:v1.0.0
docker pull nishantsengar7/ims-frontend:v1.0.0
```

### Useful Commands
```bash
# Start everything
docker compose up --build

# Stop everything
docker compose down

# Fresh start (reset database)
docker compose down -v
docker compose up --build

# View logs
docker compose logs -f backend

# Run tests
bash test_app.sh
```

---

## 📁 Project Structure

```
inventory-management/
├── frontend/                 # React app
│   ├── src/
│   │   ├── components/       # Reusable UI
│   │   │   ├── ai/          # AI components
│   │   │   ├── charts/      # Recharts
│   │   │   ├── layout/      # Sidebar, Header
│   │   │   └── ui/          # Base components
│   │   ├── pages/           # Route pages
│   │   ├── services/        # API layer
│   │   ├── context/         # Auth context
│   │   ├── hooks/           # Custom hooks
│   │   └── utils/           # Helpers
│   ├── Dockerfile
│   └── nginx.conf
│
├── backend/                  # FastAPI app
│   ├── app/
│   │   ├── ai/              # AI engine
│   │   │   ├── forecasting.py
│   │   │   ├── reorder_engine.py
│   │   │   ├── anomaly_detection.py
│   │   │   ├── health_score.py
│   │   │   ├── category_suggester.py
│   │   │   └── chat_assistant.py
│   │   ├── models/          # DB models
│   │   ├── routes/          # API routes
│   │   ├── schemas/         # Pydantic
│   │   └── utils/           # Auth, seed
│   ├── Dockerfile
│   └── requirements.txt
│
├── nginx/                    # Nginx config
│   └── nginx.conf
│
├── pgadmin/                  # pgAdmin config
│   └── servers.json
│
├── docker-compose.yml        # All services
├── .env.example              # Env template
├── Makefile                  # Dev commands
├── test_app.sh               # Test script
└── README.md                 # This file
```

---

## 🧪 Testing

Run automated test script:
```bash
bash test_app.sh
```

Tests covered:
- ✅ Health endpoint check
- ✅ Authentication (login + JWT)
- ✅ Products API (list 15 items)
- ✅ Dashboard stats API
- ✅ AI health score API
- ✅ Frontend HTTP response

Manual testing via Swagger UI:
http://localhost:8000/docs

---

## 🔒 Security

- Passwords hashed with bcrypt
- JWT tokens with 24h expiration
- Role-based access control (Admin vs Viewer)
- CORS configured for local origins
- SQL injection prevented via SQLAlchemy
- No secrets in committed code
- Environment variables for all secrets
- Nginx security headers configured

---

## 🛠️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18 | UI framework |
| Vite | 5 | Build tool |
| Tailwind CSS | 3 | Styling |
| React Router | 6 | Navigation |
| Axios | 1.6 | HTTP client |
| Recharts | 2 | Charts |
| Lucide React | 0.383 | Icons |
| React Hot Toast | 2 | Notifications |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| FastAPI | 0.110 | API framework |
| SQLAlchemy | 2.0 | ORM |
| PostgreSQL | 15 | Database |
| Pydantic | 2.0 | Validation |
| Python-Jose | 3.3 | JWT tokens |
| Passlib | 1.7 | Password hashing |
| Google Generative AI | 0.5.2+ | Gemini AI |
| Uvicorn | 0.27 | ASGI server |

### Infrastructure
| Technology | Purpose |
|------------|---------|
| Docker | Containerization |
| Docker Compose | Multi-service orchestration |
| Nginx | Reverse proxy + static serving |
| pgAdmin 4 | Database administration |

---

## 👨‍💻 Development

### Run Without Docker
```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

### Environment Variables
| Variable | Description | Default |
|----------|-------------|---------|
| DATABASE_URL | PostgreSQL connection | required |
| SECRET_KEY | JWT signing key | required |
| ALGORITHM | JWT algorithm | HS256 |
| GEMINI_API_KEY | Gemini API key | optional |
| ENVIRONMENT | App environment | production |

---

## 📊 Demo Data

Seeded automatically on first run:
- 2 users (admin + viewer)
- 5 categories
- 5 suppliers
- 15 products (mix of stock levels) including low stock and out-of-stock
- 60 transactions over 45 days (realistic IN/OUT patterns)

---

## 🚧 Known Limitations

- AI chat requires Gemini API key (other AI features work without it)
- Rate limiting is in-memory only (resets on container restart)
- No email notifications yet (planned for v2.0)
- Single warehouse support only

---

## 🔮 Future Enhancements (v2.0)

- [ ] Email alerts for low stock
- [ ] PDF purchase order generation
- [ ] Barcode/QR code scanning
- [ ] Multi-warehouse support
- [ ] Excel import/export
- [ ] Mobile app (React Native)
- [ ] Real-time updates (WebSockets)
- [ ] Advanced ML forecasting

---

## 📄 License
MIT License — free to use and modify
