#!/bin/bash
# test_app.sh – Quick smoke test for the running Inventory Management System
# Usage: bash test_app.sh
# Requires: curl, python3

set -e

BASE_URL="http://localhost:8000"
FRONTEND_URL="http://localhost:3000"
NGINX_URL="http://localhost:80"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

pass() { echo -e "   ${GREEN}✅ $1${NC}"; }
fail() { echo -e "   ${RED}❌ $1${NC}"; }
info() { echo -e "   ${YELLOW}ℹ  $1${NC}"; }

echo ""
echo "🧪 Testing Inventory Management System"
echo "======================================="
echo ""

# ── 1. Health check ───────────────────────────────────────────
echo "1. Testing API health endpoint..."
HEALTH=$(curl -sf "$BASE_URL/health" 2>/dev/null) && {
    DB_STATUS=$(echo "$HEALTH" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('database',{}).get('status','?'))" 2>/dev/null)
    pass "Health OK — DB: $DB_STATUS"
} || fail "Health endpoint failed"

# ── 2. Authentication ─────────────────────────────────────────
echo ""
echo "2. Testing authentication..."
LOGIN=$(curl -sf -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.com","password":"admin123"}' 2>/dev/null)

if [ -z "$LOGIN" ]; then
    fail "Login request failed"
    TOKEN=""
else
    TOKEN=$(echo "$LOGIN" | python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))" 2>/dev/null)
    if [ -n "$TOKEN" ]; then
        pass "Admin login successful — token received"
    else
        fail "Login succeeded but no token in response"
    fi
fi

# ── 3. Products API ───────────────────────────────────────────
echo ""
echo "3. Testing products API..."
if [ -n "$TOKEN" ]; then
    PRODUCTS=$(curl -sf "$BASE_URL/products" \
      -H "Authorization: Bearer $TOKEN" 2>/dev/null)
    COUNT=$(echo "$PRODUCTS" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))" 2>/dev/null)
    pass "Products loaded — count: $COUNT"
else
    fail "Skipped (no auth token)"
fi

# ── 4. Categories ─────────────────────────────────────────────
echo ""
echo "4. Testing categories API..."
if [ -n "$TOKEN" ]; then
    CATS=$(curl -sf "$BASE_URL/categories" \
      -H "Authorization: Bearer $TOKEN" 2>/dev/null)
    CAT_COUNT=$(echo "$CATS" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))" 2>/dev/null)
    pass "Categories loaded — count: $CAT_COUNT"
else
    fail "Skipped (no auth token)"
fi

# ── 5. Dashboard stats ────────────────────────────────────────
echo ""
echo "5. Testing dashboard stats..."
if [ -n "$TOKEN" ]; then
    STATS=$(curl -sf "$BASE_URL/dashboard/stats" \
      -H "Authorization: Bearer $TOKEN" 2>/dev/null) && \
    pass "Dashboard stats received" || fail "Dashboard stats failed"
else
    fail "Skipped (no auth token)"
fi

# ── 6. Transactions ───────────────────────────────────────────
echo ""
echo "6. Testing transactions API..."
if [ -n "$TOKEN" ]; then
    TXNS=$(curl -sf "$BASE_URL/transactions" \
      -H "Authorization: Bearer $TOKEN" 2>/dev/null)
    TXN_COUNT=$(echo "$TXNS" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))" 2>/dev/null)
    pass "Transactions loaded — count: $TXN_COUNT"
else
    fail "Skipped (no auth token)"
fi

# ── 7. AI health score ────────────────────────────────────────
echo ""
echo "7. Testing AI health score..."
if [ -n "$TOKEN" ]; then
    AI=$(curl -sf "$BASE_URL/ai/health-score" \
      -H "Authorization: Bearer $TOKEN" 2>/dev/null) && \
    pass "AI health score received" || info "AI endpoint returned error (AI key may not be set)"
else
    fail "Skipped (no auth token)"
fi

# ── 8. Viewer login ───────────────────────────────────────────
echo ""
echo "8. Testing viewer login..."
VIEWER_LOGIN=$(curl -sf -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"viewer@demo.com","password":"viewer123"}' 2>/dev/null)
VIEWER_TOKEN=$(echo "$VIEWER_LOGIN" | python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))" 2>/dev/null)
[ -n "$VIEWER_TOKEN" ] && pass "Viewer login successful" || fail "Viewer login failed"

# ── 9. Frontend ───────────────────────────────────────────────
echo ""
echo "9. Testing frontend (port 3000)..."
HTTP_CODE=$(curl -sf -o /dev/null -w "%{http_code}" "$FRONTEND_URL" 2>/dev/null) || HTTP_CODE="000"
[ "$HTTP_CODE" = "200" ] && pass "Frontend running — HTTP $HTTP_CODE" || fail "Frontend: HTTP $HTTP_CODE"

# ── 10. Nginx proxy ───────────────────────────────────────────
echo ""
echo "10. Testing Nginx reverse proxy (port 80)..."
NGINX_CODE=$(curl -sf -o /dev/null -w "%{http_code}" "$NGINX_URL" 2>/dev/null) || NGINX_CODE="000"
[ "$NGINX_CODE" = "200" ] && pass "Nginx proxy running — HTTP $NGINX_CODE" || info "Nginx: HTTP $NGINX_CODE (may not be running)"

# ── Summary ───────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}🎉 Test run complete!${NC}"
echo ""
echo "📱 Access the app:"
echo "   Frontend:  $FRONTEND_URL"
echo "   API Docs:  $BASE_URL/docs"
echo "   pgAdmin:   http://localhost:5050"
echo "   Via Nginx: $NGINX_URL"
echo ""
echo "🔑 Demo credentials:"
echo "   Admin:  admin@demo.com / admin123"
echo "   Viewer: viewer@demo.com / viewer123"
echo ""
