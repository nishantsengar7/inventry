# ── Stage 1: Build the React app ──────────────────────────────
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./
RUN npm ci --silent

# Copy source and build
COPY . .
RUN npm run build

# ── Stage 2: Serve with lightweight Nginx ─────────────────────
FROM nginx:alpine

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built React app from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx config for React Router (SPA support)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
