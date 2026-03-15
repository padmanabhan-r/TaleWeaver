# Deploying TaleWeaver to Google Cloud

TaleWeaver deploys as a single Cloud Run service. The multi-stage Docker build compiles the React frontend and serves it alongside the FastAPI backend from one container. Deployments are automated via Cloud Build — every push to `main` triggers a build and deploy.

**Prerequisites:** Docker, gcloud CLI, a GCP project with Vertex AI, Cloud Run, and Secret Manager APIs enabled.

---

## 1. Set your project

```bash
export PROJECT_ID=your-project-id
export REGION=us-central1
gcloud config set project $PROJECT_ID
```

---

## 2. Enable required APIs

```bash
gcloud services enable secretmanager.googleapis.com cloudbuild.googleapis.com developerconnect.googleapis.com --project=$PROJECT_ID
```

Wait ~60 seconds after enabling before proceeding.

---

## 3. Store your Gemini API key in Secret Manager

```bash
echo -n "your-gemini-api-key" | gcloud secrets create gemini-api-key \
  --data-file=- \
  --project=$PROJECT_ID
```

---

## 4. Grant Cloud Build service account permissions

Grant access to Secret Manager, Cloud Storage, and Cloud Logging:

```bash
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')

# Access to the Gemini API key secret
gcloud secrets add-iam-policy-binding gemini-api-key \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=$PROJECT_ID

# Access to Cloud Storage (required to upload source for builds)
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/storage.objectAdmin"

# Permission to write build logs
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/logging.logWriter"
```

> **Note:** If prompted with a condition selector, choose **None** (option 2).

---

## 5. Create the Artifact Registry repository

```bash
gcloud artifacts repositories create taleweaver \
  --repository-format=docker \
  --location=us-central1 \
  --project=$PROJECT_ID
```


---

## 6. Set up the Cloud Build trigger (one-time)

1. Go to [Cloud Build Triggers](https://console.cloud.google.com/cloud-build/triggers)
2. Click **Create trigger** and fill in:
   - **Name:** `deploy-on-push-to-main`
   - **Region:** `us-central1`
   - **Event:** Push to a branch
   - **Source:**
     - **Repository service:** Cloud Build repositories
     - **Repository generation:** 1st gen
     - Click **Connect Repository** → authenticate with GitHub → select `padmanabhan-r/TaleWeaver`
   - **Branch:** `^main$`
   - **Configuration:** Cloud Build configuration file → `cloudbuild.yaml`
   - **Service account:** Select the service account listed (e.g. `<project-number>@cloudbuild.gserviceaccount.com`)
3. Click **Create**

From this point, every `git push origin main` automatically builds and deploys.

---

## 7. Trigger a manual build (optional)

```bash
gcloud builds submit . \
  --config=cloudbuild.yaml \
  --project=$PROJECT_ID \
  --region=$REGION \
  --substitutions=COMMIT_SHA=manual
```

> **Note:** `--substitutions=COMMIT_SHA=manual` is required for manual builds — `$COMMIT_SHA` is only set automatically when triggered by a git push.

Or just push any commit to `main` — the trigger fires automatically.

---

## 8. Check build logs

```bash
gcloud builds list --project=$PROJECT_ID --region=$REGION --limit=5
```

---

## Manual deploy without Cloud Build

```bash
# Build and push the image
docker build --platform linux/amd64 \
  -t $REGION-docker.pkg.dev/$PROJECT_ID/taleweaver/backend:latest .

docker push $REGION-docker.pkg.dev/$PROJECT_ID/taleweaver/backend:latest

# Deploy to Cloud Run
gcloud run deploy taleweaver \
  --image=$REGION-docker.pkg.dev/$PROJECT_ID/taleweaver/backend:latest \
  --region=$REGION \
  --project=$PROJECT_ID
```

---

## Rotating the API key

If your Gemini API key changes, add a new secret version:

```bash
echo -n "your-new-gemini-api-key" | gcloud secrets versions add gemini-api-key \
  --data-file=- \
  --project=$PROJECT_ID
```
