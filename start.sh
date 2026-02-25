#!/usr/bin/env bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
VENV="$ROOT/.venv"
BACKEND="$ROOT/backend"
FRONTEND="$ROOT/frontend"

# ── Colour helpers ────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
info()    { echo -e "${CYAN}[start]${NC} $*"; }
success() { echo -e "${GREEN}[start]${NC} $*"; }
warn()    { echo -e "${YELLOW}[start]${NC} $*"; }
error()   { echo -e "${RED}[start]${NC} $*"; exit 1; }

# ── Validate .venv ────────────────────────────────────────────────────────────
[ -d "$VENV" ] || error ".venv not found at $VENV — run: python -m venv .venv && .venv/bin/pip install -r backend/requirements.txt"

# ── Validate .env ─────────────────────────────────────────────────────────────
if [ ! -f "$BACKEND/.env" ]; then
  warn "No $BACKEND/.env found — copying from .env.example"
  cp "$BACKEND/.env.example" "$BACKEND/.env"
  warn "Edit $BACKEND/.env and set GOOGLE_CLOUD_PROJECT before running again."
  exit 1
fi

# ── Check node ───────────────────────────────────────────────────────────────
command -v node >/dev/null 2>&1 || error "node not found — install from https://nodejs.org"

# ── Activate venv ─────────────────────────────────────────────────────────────
source "$VENV/bin/activate"
success "Activated .venv ($(python --version))"

# ── Cleanup on exit ───────────────────────────────────────────────────────────
BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
  echo ""
  info "Shutting down..."
  [ -n "$BACKEND_PID" ]  && kill "$BACKEND_PID"  2>/dev/null && info "Backend stopped"
  [ -n "$FRONTEND_PID" ] && kill "$FRONTEND_PID" 2>/dev/null && info "Frontend stopped"
  exit 0
}
trap cleanup INT TERM

# ── Start backend ─────────────────────────────────────────────────────────────
info "Starting backend on http://localhost:8000 ..."
cd "$BACKEND"
uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
cd "$ROOT"

# Give uvicorn a moment to bind
sleep 1

# ── Start frontend ────────────────────────────────────────────────────────────
info "Starting frontend on http://localhost:8080 ..."
cd "$FRONTEND"
npx vite &
FRONTEND_PID=$!
cd "$ROOT"

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
success "TaleWeaver is running!"
echo -e "  ${CYAN}Frontend${NC}  →  http://localhost:8080"
echo -e "  ${CYAN}Backend${NC}   →  http://localhost:8000"
echo -e "  ${CYAN}Health${NC}    →  http://localhost:8000/api/health"
echo -e "  ${CYAN}WS${NC}        →  ws://localhost:8000/ws/story"
echo ""
info "Press Ctrl+C to stop both servers."
echo ""

wait
