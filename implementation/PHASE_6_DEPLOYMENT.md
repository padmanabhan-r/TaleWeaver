# Phase 6 — Deployment & Production Hardening

## Status: 🔄 PARTIAL

---

## What's Done

### Cloud Run — Live ✅

**Service URL:** `https://taleweaver-backend-950758825854.us-central1.run.app`
(Note: name is `taleweaver-backend` from when Firebase hosting was planned — rename to `taleweaver` when convenient)

**Service config:**
- Region: `us-central1`
- Memory: 1Gi, CPU: 2, Concurrency: 80, Timeout: 3600s
- Allow unauthenticated
- Env vars: `GOOGLE_CLOUD_PROJECT`, `GOOGLE_CLOUD_LOCATION=us-central1`, `IMAGE_MODEL=imagen-3.0-fast-generate-001`, `IMAGE_LOCATION=us-central1`

**IAM:**
- Service account: `taleweaver-deploy@project-a8efccb1-2720-4a48-948.iam.gserviceaccount.com`
- Roles: `run.admin`, `artifactregistry.writer`, `iam.serviceAccountUser`, `aiplatform.user`

**Artifact Registry:**
- Repo: `us-central1-docker.pkg.dev/project-a8efccb1-2720-4a48-948/taleweaver/`
- Image: `.../backend:latest`

### Docker — Multi-Stage Build ✅

**`Dockerfile`** (repo root):
```dockerfile
# Stage 1: Build React frontend
FROM node:22-slim AS frontend-builder
WORKDIR /frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Python backend with embedded frontend
FROM python:3.12-slim
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ .
COPY --from=frontend-builder /frontend/dist ./frontend/dist

ENV PORT=8080
EXPOSE 8080
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080", \
     "--workers", "1", "--loop", "uvloop", "--http", "h11"]
```

Frontend assets built into the image. Backend serves them via `FileResponse` catch-all in `main.py`. No Firebase or separate frontend hosting needed.

### Frontend URL Strategy ✅

Both hooks use same-origin fallbacks — no env vars needed in production:
- `useLiveAPI.ts`: `VITE_WS_URL` → falls back to `wss://${window.location.host}/ws/story`
- `useStoryImages.ts`: `VITE_API_URL` → falls back to `""` (same-origin relative URLs)

For local dev:
```
# frontend/.env.local  (gitignored)
VITE_WS_URL=ws://localhost:8000/ws/story
VITE_API_URL=http://localhost:8000
```

### GitHub Actions Workflow — Ready but not triggered ✅

**`.github/workflows/deploy.yml`** — auto-deploy on push to `main`:
- Authenticates to GCP via `google-github-actions/auth@v2`
- Builds `linux/amd64` image and pushes to Artifact Registry
- Deploys to Cloud Run

**To activate:** Add `GCP_SA_KEY` secret to the GitHub repo:
1. Go to `github.com/padmanabhan-r/TaleWeaver` → Settings → Secrets → Actions
2. New secret: name = `GCP_SA_KEY`, value = contents of `/tmp/taleweaver-sa-key.json`

---

## What Remains

### ⬜ GitHub Actions Secret
Add `GCP_SA_KEY` to repo secrets to activate the CI/CD pipeline.

### ⬜ Service Rename
Rename Cloud Run service from `taleweaver-backend` to `taleweaver`:
```bash
# Deploy new service with correct name, then delete old one
gcloud run deploy taleweaver \
  --image=us-central1-docker.pkg.dev/project-a8efccb1-2720-4a48-948/taleweaver/backend:latest \
  --region=us-central1 [... same flags ...]

gcloud run services delete taleweaver-backend --region=us-central1
```
Update `deploy.yml` `SERVICE` env var to `taleweaver`.

### ⬜ Production Hardening

| Item | Priority | Action |
|---|---|---|
| CORS `allow_origins=["*"]` | Medium | Set to Cloud Run URL once renamed |
| Dead code `scene_detector.py` | Low | Delete the file |
| No backend rate limit on `/api/image` | Medium | Add per-session rate limiting in `image_gen.py` |
| WebSocket session timeout | Low | Close idle sessions after 15 minutes |
| `IMAGE_LOCATION` quota region | Medium | Verify Imagen available in `us-central1`; fallback to `us-east4` if not |
| GCP token refresh for long sessions | Low | Reconnect Gemini WS with fresh token after 50 minutes |

### ⬜ Custom Domain (Optional)
Point a custom domain (e.g., `taleweaver.app`) to the Cloud Run service via Cloud Run domain mapping.
