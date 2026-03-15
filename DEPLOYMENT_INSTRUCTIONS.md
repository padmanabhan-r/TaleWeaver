# Deploying TaleWeaver to Google Cloud

TaleWeaver deploys as a single Cloud Run service. The multi-stage Docker build compiles the React frontend and serves it alongside the FastAPI backend from one container. Deployments are automated via Cloud Build — every push to `main` triggers a build and deploy.

**Prerequisites:** Docker, gcloud CLI, a GCP project with Vertex AI and Cloud Run APIs enabled.

---

## 1. Set your project

```bash
export PROJECT_ID=your-project-id
export REGION=us-central1
gcloud config set project $PROJECT_ID
```

---

## 2. Store your Gemini API key in Secret Manager

```bash
echo -n "your-gemini-api-key" | gcloud secrets create gemini-api-key \
  --data-file=- \
  --project=$PROJECT_ID
```

---

## 3. Grant Cloud Build access to the secret

```bash
gcloud secrets add-iam-policy-binding gemini-api-key \
  --member="serviceAccount:$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')@cloudbuild.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=$PROJECT_ID
```

---

## 4. Set up the Cloud Build trigger (one-time)

1. Go to [Cloud Build Triggers](https://console.cloud.google.com/cloud-build/triggers)
2. Click **Create trigger** and fill in:
   - **Name:** `deploy-on-push-to-main`
   - **Region:** `us-central1`
   - **Event:** Push to a branch
   - **Source:** Connect to GitHub → select `padmanabhan-r/TaleWeaver`
   - **Branch:** `^main$`
   - **Configuration:** Cloud Build configuration file → `cloudbuild.yaml`
3. Click **Create**

From this point, every `git push origin main` automatically builds and deploys.

---

## 5. Trigger a manual build (optional)

```bash
gcloud builds submit --no-source \
  --config=cloudbuild.yaml \
  --project=$PROJECT_ID \
  --region=$REGION
```

Or just push any commit to `main` — the trigger fires automatically.

---

## 6. Check build logs

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
