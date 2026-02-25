# Phase 6 — Deployment & Infrastructure

## Goal
Deploy TaleWeaver to Google Cloud Platform with:
- Backend on Cloud Run (handles WebSocket + image generation)
- Frontend on Firebase Hosting
- Vertex AI auth via service account (no API keys)
- Automated build pipeline via Cloud Build

---

## GCP Services Used

| Service | Purpose |
|---|---|
| **Cloud Run** | Backend: FastAPI WebSocket proxy + image gen API |
| **Firebase Hosting** | Frontend: React static bundle |
| **Vertex AI (Gemini Live API)** | Real-time audio storytelling |
| **Vertex AI (Gemini Image)** | Story scene image generation |
| **Cloud Build** | CI/CD pipeline |
| **Artifact Registry** | Docker image storage |
| **IAM** | Service account with Vertex AI access |

---

## Architecture (Cloud)

```
INTERNET
    │
    ├──── https://<firebase-url>  ────────► Firebase Hosting
    │                                        (React static files)
    │
    └──── wss://<cloudrun-url>/ws/story ──► Cloud Run
         https://<cloudrun-url>/api/image    (FastAPI backend)
                                              │
                                              │ service account auth
                                              ▼
                                         Vertex AI
                                    ┌────────────────────┐
                                    │ Gemini Live API     │
                                    │ Gemini Image Gen    │
                                    └────────────────────┘
```

---

## Pre-Deployment Setup

### 1. GCP Project Setup

```bash
# Set project
export PROJECT_ID=taleweaver-prod
gcloud config set project $PROJECT_ID

# Enable required APIs
gcloud services enable \
  run.googleapis.com \
  aiplatform.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  firebase.googleapis.com

# Create Artifact Registry repository
gcloud artifacts repositories create taleweaver \
  --repository-format=docker \
  --location=us-central1 \
  --description="TaleWeaver Docker images"
```

### 2. Service Account Setup

```bash
# Create service account for Cloud Run
gcloud iam service-accounts create taleweaver-backend \
  --display-name="TaleWeaver Backend"

# Grant Vertex AI access (for Gemini Live API + Image Generation)
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:taleweaver-backend@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/aiplatform.user"

# Grant logging access
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:taleweaver-backend@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/logging.logWriter"
```

### 3. Firebase Project Setup

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login and init
firebase login
firebase init hosting

# Select: Use existing project → taleweaver-prod
# Public dir: frontend/dist
# Single page app: Yes
# GitHub actions: No (using Cloud Build instead)
```

---

## `cloudbuild.yaml`

```yaml
# cloudbuild.yaml
# Builds and deploys both backend (Cloud Run) and frontend (Firebase)
# Triggered on push to main branch

substitutions:
  _REGION: us-central1
  _BACKEND_SERVICE: taleweaver-backend
  _FRONTEND_DIR: frontend
  _BACKEND_DIR: backend

steps:
  # ─────────────────────────────────────────
  # BACKEND: Build Docker image
  # ─────────────────────────────────────────
  - name: "gcr.io/cloud-builders/docker"
    id: "build-backend"
    args:
      - "build"
      - "-t"
      - "us-central1-docker.pkg.dev/$PROJECT_ID/taleweaver/${_BACKEND_SERVICE}:$SHORT_SHA"
      - "-t"
      - "us-central1-docker.pkg.dev/$PROJECT_ID/taleweaver/${_BACKEND_SERVICE}:latest"
      - "./${_BACKEND_DIR}"

  # ─────────────────────────────────────────
  # BACKEND: Push image to Artifact Registry
  # ─────────────────────────────────────────
  - name: "gcr.io/cloud-builders/docker"
    id: "push-backend"
    waitFor: ["build-backend"]
    args:
      - "push"
      - "--all-tags"
      - "us-central1-docker.pkg.dev/$PROJECT_ID/taleweaver/${_BACKEND_SERVICE}"

  # ─────────────────────────────────────────
  # BACKEND: Deploy to Cloud Run
  # ─────────────────────────────────────────
  - name: "gcr.io/google.com/cloudsdktool/cloud-sdk"
    id: "deploy-backend"
    waitFor: ["push-backend"]
    entrypoint: gcloud
    args:
      - run
      - deploy
      - ${_BACKEND_SERVICE}
      - "--image=us-central1-docker.pkg.dev/$PROJECT_ID/taleweaver/${_BACKEND_SERVICE}:$SHORT_SHA"
      - "--region=${_REGION}"
      - "--platform=managed"
      - "--allow-unauthenticated"
      - "--service-account=taleweaver-backend@$PROJECT_ID.iam.gserviceaccount.com"
      - "--timeout=3600"          # Long timeout for WebSocket sessions
      - "--memory=512Mi"
      - "--cpu=1"
      - "--min-instances=0"
      - "--max-instances=10"
      - "--concurrency=80"
      - "--set-env-vars=GOOGLE_CLOUD_PROJECT=$PROJECT_ID,GOOGLE_CLOUD_LOCATION=${_REGION},GOOGLE_GENAI_USE_VERTEXAI=true"

  # ─────────────────────────────────────────
  # FRONTEND: Build React app
  # ─────────────────────────────────────────
  - name: "node:20-slim"
    id: "build-frontend"
    waitFor: ["deploy-backend"]   # Wait to get the Cloud Run URL
    dir: "${_FRONTEND_DIR}"
    entrypoint: sh
    args:
      - "-c"
      - |
        # Get the deployed Cloud Run URL
        BACKEND_URL=$(gcloud run services describe ${_BACKEND_SERVICE} \
          --region=${_REGION} --format='value(status.url)')

        # Set environment variables for Vite build
        echo "VITE_WS_URL=wss://${BACKEND_URL#https://}/ws/story" > .env.production
        echo "VITE_API_URL=${BACKEND_URL}" >> .env.production

        npm ci
        npm run build

  # ─────────────────────────────────────────
  # FRONTEND: Deploy to Firebase Hosting
  # ─────────────────────────────────────────
  - name: "gcr.io/google.com/cloudsdktool/cloud-sdk"
    id: "deploy-frontend"
    waitFor: ["build-frontend"]
    dir: "${_FRONTEND_DIR}"
    entrypoint: sh
    args:
      - "-c"
      - |
        npm install -g firebase-tools
        firebase deploy --only hosting --project=$PROJECT_ID --non-interactive

timeout: "1200s"  # 20 minute build timeout

options:
  logging: CLOUD_LOGGING_ONLY
  machineType: "E2_MEDIUM"
```

---

## Cloud Run Configuration Details

### WebSocket Support
Cloud Run natively supports WebSockets. Key settings:

```
--timeout=3600      # 1 hour — allows long story sessions
--concurrency=80    # Each instance handles up to 80 concurrent WebSocket connections
--min-instances=0   # Scale to zero when idle (cost optimization)
```

**Important**: Cloud Run's default request timeout is 60 seconds.
Set `--timeout=3600` (1 hour) for WebSocket connections to persist.

### Memory Considerations
Each active WebSocket session uses ~20-50MB of memory (including audio buffering).
With 80 concurrency and 512Mi memory:
- ~6-12 concurrent story sessions per instance
- Cloud Run scales instances automatically

For higher traffic:
```
--memory=1Gi
--concurrency=50
--max-instances=20
```

---

## Firebase Hosting Configuration

```json
// frontend/firebase.json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      },
      {
        "source": "/audio-processors/**",
        "headers": [
          {
            "key": "Content-Type",
            "value": "application/javascript"
          }
        ]
      }
    ]
  }
}
```

**Critical**: AudioWorklet files need `Content-Type: application/javascript`.
The headers rule above ensures this.

---

## CORS Configuration

The backend must allow the Firebase Hosting domain:

```python
# backend/main.py — update CORS in production
import os

ALLOWED_ORIGINS = [
    "https://taleweaver-prod.web.app",        # Firebase Hosting production URL
    "https://taleweaver-prod.firebaseapp.com",
    "http://localhost:5173",                    # Local Vite dev server
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)
```

---

## Frontend Environment Variables

```bash
# frontend/.env.production (generated by Cloud Build)
VITE_WS_URL=wss://taleweaver-backend-xxxx-uc.a.run.app/ws/story
VITE_API_URL=https://taleweaver-backend-xxxx-uc.a.run.app

# frontend/.env.development (local)
VITE_WS_URL=ws://localhost:8080/ws/story
VITE_API_URL=http://localhost:8000
```

---

## Local Development Setup

```bash
# 1. Clone and setup
git clone <repo>
cd TaleWeaver

# 2. Backend local dev
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Set up GCP auth for local dev
gcloud auth application-default login

# Create .env
cat > .env << EOF
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_GENAI_USE_VERTEXAI=true
EOF

# Start backend
uvicorn main:app --reload --port 8080

# 3. Frontend local dev
cd ../frontend
npm install

# Create .env
cat > .env << EOF
VITE_WS_URL=ws://localhost:8080/ws/story
VITE_API_URL=http://localhost:8080
EOF

# Start frontend
npm run dev
# Open http://localhost:5173
```

---

## Health Monitoring

### Cloud Run Health Check

```python
# backend/main.py
@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "version": "1.0.0",
        "project": os.environ.get("GOOGLE_CLOUD_PROJECT", "unknown"),
    }
```

Cloud Run uses this endpoint for health checks.

### Logging Strategy

```python
# All significant events logged to Cloud Logging
import logging
logging.basicConfig(level=logging.INFO)

# Key log events:
# [ws] New session: {id}
# [proxy] Connected to Gemini Live API ✓
# [proxy] Session ready for {character_name}
# [proxy] Connection closed: {code} - {reason}
# [image_gen] Generated scene {n}
# [scene] Triggered image: {description}
```

Access logs via:
```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=taleweaver-backend" --limit=50
```

---

## Cost Estimation

| Service | Usage | Estimated Monthly Cost |
|---|---|---|
| Gemini Live API | 100 sessions × 5min = 500min | ~$15-30 |
| Gemini Image Gen | 100 sessions × 4 images = 400 images | ~$2-5 |
| Cloud Run | 100 sessions × 5min compute | ~$1-3 |
| Firebase Hosting | Static files, minimal bandwidth | Free tier |
| **Total** | Light usage | **~$18-38/month** |

For a hackathon demo with light traffic, costs are negligible.

---

## Security Checklist

- [ ] Service account has ONLY `roles/aiplatform.user` — minimum permissions
- [ ] No API keys in code, environment variables, or Docker image
- [ ] CORS restricted to known origins in production
- [ ] Input validation: scene descriptions capped at 500 chars
- [ ] Input validation: transcriptions capped at 300 chars
- [ ] Gemini safety settings: BLOCK_LOW_AND_ABOVE on all harm categories
- [ ] No sensitive data logged (no audio content, no child speech)
- [ ] WebSocket connections authenticated via backend proxy (no direct Vertex access from browser)
- [ ] Firebase Hosting serves only the `dist/` directory
- [ ] Directory traversal prevented in static file serving

---

## Definition of Done

- [ ] `cloudbuild.yaml` triggers automatically on git push to main
- [ ] Backend Docker image builds in < 3 minutes
- [ ] Cloud Run service deploys successfully
- [ ] `GET /api/health` returns 200 from Cloud Run URL
- [ ] WebSocket connects from browser to Cloud Run backend
- [ ] Image generation endpoint works from Cloud Run
- [ ] Firebase Hosting serves the React app
- [ ] Full end-to-end test: select character → story plays → images appear
- [ ] Audio worklet files served with correct Content-Type from Firebase
- [ ] CORS allows Firebase Hosting domain to call Cloud Run API
- [ ] Logs accessible in Cloud Logging
- [ ] Scale test: 5 concurrent sessions work without errors
