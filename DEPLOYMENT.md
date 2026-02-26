# Deployment

TaleWeaver runs as a **single Cloud Run service** that serves both the Python backend and the pre-built React frontend.

---

## Live URL

```
https://taleweaver-backend-950758825854.us-central1.run.app
```

> The service is named `taleweaver-backend` (a legacy name from when a separate Firebase frontend was planned). It will be renamed to `taleweaver` in a future update.

---

## Infrastructure

| Component | Service | Details |
|---|---|---|
| Backend + Frontend | Cloud Run | `us-central1`, 1Gi RAM, 2 vCPU |
| Container registry | Artifact Registry | `us-central1-docker.pkg.dev/project-a8efccb1-2720-4a48-948/taleweaver/backend` |
| Conversation AI | Vertex AI — Gemini Live | `gemini-live-2.5-flash-native-audio` |
| Image extraction | Vertex AI — Gemini | `gemini-2.0-flash-lite` |
| Image generation | Vertex AI — Imagen | `imagen-3.0-fast-generate-001` |
| GCP project | — | `project-a8efccb1-2720-4a48-948` |

---

## How It Works

The Docker image is a **multi-stage build**:

1. **Node 22** stage: installs dependencies and runs `npm run build` to produce `frontend/dist/`
2. **Python 3.12** stage: installs Python dependencies, copies backend code, and copies the built frontend from stage 1

The FastAPI app serves the React SPA via a catch-all `FileResponse` route — any path that isn't an API or WebSocket route returns `frontend/dist/index.html`.

---

## Deploying Manually

### Prerequisites

- Docker (with `linux/amd64` build support)
- `gcloud` CLI authenticated with the GCP project
- Docker configured for Artifact Registry:
  ```bash
  gcloud auth configure-docker us-central1-docker.pkg.dev
  ```

### Build and push

```bash
docker build --platform linux/amd64 \
  -t us-central1-docker.pkg.dev/project-a8efccb1-2720-4a48-948/taleweaver/backend:latest \
  .

docker push us-central1-docker.pkg.dev/project-a8efccb1-2720-4a48-948/taleweaver/backend:latest
```

### Deploy to Cloud Run

```bash
gcloud run deploy taleweaver-backend \
  --image=us-central1-docker.pkg.dev/project-a8efccb1-2720-4a48-948/taleweaver/backend:latest \
  --region=us-central1 \
  --platform=managed \
  --allow-unauthenticated \
  --timeout=3600 \
  --memory=1Gi \
  --cpu=2 \
  --concurrency=80 \
  --set-env-vars="GOOGLE_CLOUD_PROJECT=project-a8efccb1-2720-4a48-948,GOOGLE_CLOUD_LOCATION=us-central1,IMAGE_MODEL=imagen-3.0-fast-generate-001,IMAGE_LOCATION=us-central1" \
  --project=project-a8efccb1-2720-4a48-948
```

---

## Automated Deployment (CI/CD)

A GitHub Actions workflow at `.github/workflows/deploy.yml` triggers on every push to `main`.

### To activate

Add the service account key as a GitHub Actions secret:

1. Go to `github.com/padmanabhan-r/TaleWeaver` → **Settings → Secrets and variables → Actions**
2. Click **New repository secret**
3. Name: `GCP_SA_KEY`
4. Value: the contents of the service account JSON key file

The workflow will then automatically build and deploy on every merge to `main`.

### Service account

`taleweaver-deploy@project-a8efccb1-2720-4a48-948.iam.gserviceaccount.com`

Roles:
- `roles/run.admin`
- `roles/artifactregistry.writer`
- `roles/iam.serviceAccountUser`
- `roles/aiplatform.user`

---

## Local Development

### Backend

```bash
cd backend
pip install -r requirements.txt

# Auth — either:
gcloud auth application-default login
# or place a service account key and set:
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json

export GOOGLE_CLOUD_PROJECT=project-a8efccb1-2720-4a48-948
export GOOGLE_CLOUD_LOCATION=us-central1
export IMAGE_MODEL=gemini-2.0-flash-preview-image-generation
export IMAGE_LOCATION=us-central1

uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend

# Create .env.local (gitignored)
echo "VITE_API_URL=http://localhost:8000" > .env.local
echo "VITE_WS_URL=ws://localhost:8000/ws/story" >> .env.local

npm install
npm run dev
```

Frontend runs on `http://localhost:8080`, backend on `http://localhost:8000`.

---

## Environment Variables

| Variable | Where set | Description |
|---|---|---|
| `GOOGLE_CLOUD_PROJECT` | Cloud Run env vars | GCP project ID |
| `GOOGLE_CLOUD_LOCATION` | Cloud Run env vars | Vertex AI region (`us-central1`) |
| `IMAGE_MODEL` | Cloud Run env vars | Image generation model (`imagen-3.0-fast-generate-001` or `gemini-2.0-flash-preview-image-generation`) |
| `IMAGE_LOCATION` | Cloud Run env vars | Region for image model (must match quota, `us-central1`) |
| `VITE_API_URL` | Frontend `.env.local` | API base URL for local dev (empty in production — same origin) |
| `VITE_WS_URL` | Frontend `.env.local` | WebSocket URL for local dev (derived from `window.location` in production) |
