# InvenTrack Frontend

React 18 + Vite + Tailwind CSS

## Setup
```bash
npm install
npm run dev        # Development
npm run build      # Production build
```

## Environment
`VITE_API_URL`=http://localhost:8000

## Pages
- `/login`          → Authentication
- `/dashboard`      → Overview + AI summary
- `/products`       → Product management
- `/categories`     → Category management
- `/suppliers`      → Supplier management
- `/transactions`   → Stock movements
- `/ai-insights`    → Full AI features page

## Key Components
```
src/components/
├── ai/         # AI feature components
├── charts/     # Recharts visualizations
├── layout/     # Sidebar + Header
└── ui/         # Reusable base components
```

## Design System
- **Primary**:  `#4F46E5` (Indigo)
- **Success**:  `#10B981` (Green)
- **Warning**:  `#F59E0B` (Amber)
- **Danger**:   `#EF4444` (Red)
- **Sidebar**:  `#1E1E2E` (Dark Slate)
