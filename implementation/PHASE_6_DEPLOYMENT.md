# Phase 6 — Deployment & Production Hardening

## Status: ✅ DONE

---

## Live Service

**URL:** `https://taleweaver-950758825854.us-central1.run.app`
**Service name:** `taleweaver`
**Region:** `us-central1`
**Config:** 1Gi RAM, 2 vCPU, concurrency 80, timeout 3600s, allow unauthenticated

---

## CI/CD — Cloud Build

Every push to `main` triggers an automatic build and deploy via `cloudbuild.yaml` at the repo root.

```
push to main
  └─► Cloud Build trigger (us-central1)
        ├── docker build --platform linux/amd64 .
        │     Stage 1: node:22-slim  → builds React frontend → dist/
        │     Stage 2: python:3.13-slim → FastAPI + frontend/dist/
        ├── docker push → Artifact Registry
        │     us-central1-docker.pkg.dev/project-a8efccb1-2720-4a48-948/taleweaver/backend
        └── gcloud run deploy taleweaver
              --set-env-vars (project, location, image model)
              --update-secrets GEMINI_API_KEY=gemini-api-key:latest
```

**Cloud Build trigger:** `deploy-on-push-to-main` — connected to `padmanabhan-r/TaleWeaver`, branch `^main$`.

---

## Dockerfile (repo root)

```dockerfile
# Stage 1: Build React frontend
FROM node:22-slim AS frontend-builder
WORKDIR /frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Python backend with embedded frontend
FROM python:3.13-slim
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

Python version matches local (3.13). Node 22 builds the frontend.

---

## Environment Variables

| Variable | Value | How set |
|---|---|---|
| `GOOGLE_CLOUD_PROJECT` | `project-a8efccb1-2720-4a48-948` | `--set-env-vars` in cloudbuild.yaml |
| `GOOGLE_CLOUD_LOCATION` | `us-central1` | `--set-env-vars` in cloudbuild.yaml |
| `IMAGE_MODEL` | `gemini-3.1-flash-image-preview` | `--set-env-vars` in cloudbuild.yaml |
| `IMAGE_LOCATION` | `global` | `--set-env-vars` in cloudbuild.yaml |
| `GEMINI_API_KEY` | (secret) | Secret Manager → `gemini-api-key:latest` |

`GEMINI_API_KEY` is stored in GCP Secret Manager and injected at runtime via `--update-secrets`.
It uses the Gemini API (AI Studio) rather than Vertex AI for image generation — shorter rate limit intervals.

---

## Image Generation Routing (`backend/image_gen.py`)

```python
if IMAGE_MODEL.startswith("imagen-"):
    # Vertex AI Imagen — text prompt only
    _generate_imagen(prompt)
elif _api_key_client:
    # Gemini API key (AI Studio) — preferred, shorter rate limits
    _generate_gemini_api_key(prompt, ...)
else:
    # Fallback: Gemini via Vertex AI ADC
    _generate_gemini(prompt, ...)
```

---

## Auth

| Component | Auth method |
|---|---|
| Gemini Live API (proxy.py) | `google.auth.default()` — Cloud Run service account ADC |
| Gemini Flash Lite scene extraction | `google.auth.default()` — Cloud Run service account ADC |
| Gemini image generation (image_gen.py) | `GEMINI_API_KEY` from Secret Manager |

No API keys in the Docker image or source code.

---

## IAM Summary

| Service account | Roles |
|---|---|
| `taleweaver-deploy@...` (Cloud Build SA) | `run.admin`, `artifactregistry.writer`, `iam.serviceAccountUser`, `aiplatform.user`, `logging.logWriter`, `storage.admin`, `cloudbuild.builds.builder`, `secretmanager.secretAccessor` |
| `950758825854-compute@developer.gserviceaccount.com` (Cloud Run runtime SA) | `secretmanager.secretAccessor` (for `gemini-api-key` secret) |

---

## Artifact Registry

- Repo: `us-central1-docker.pkg.dev/project-a8efccb1-2720-4a48-948/taleweaver/`
- Image: `.../backend:latest` and `.../backend:{COMMIT_SHA}`

---

## Frontend URL Strategy

Both hooks use same-origin fallbacks — no env vars needed in production:
- `useLiveAPI.ts`: `VITE_WS_URL` → falls back to `wss://${window.location.host}/ws/story`
- `useStoryImages.ts`: `VITE_API_URL` → falls back to `""` (relative URLs)

For local dev, create `frontend/.env.local` (gitignored):
```
VITE_WS_URL=ws://localhost:8000/ws/story
VITE_API_URL=http://localhost:8000
```

---

## What Remains ⬜ (low priority)

| Item | Priority | Action |
|---|---|---|
| CORS `allow_origins=["*"]` | Medium | Set to Cloud Run URL |
| Dead code `scene_detector.py` | Low | Delete the file |
| No backend rate limit on `/api/image` | Medium | Add per-session limiting in `image_gen.py` |
| WebSocket session timeout | Low | Close idle sessions after 15 min |
| GCP token refresh | Low | Reconnect Gemini WS with fresh token after 50 min |
| Custom domain | Optional | Cloud Run domain mapping → `taleweaver.app` |
