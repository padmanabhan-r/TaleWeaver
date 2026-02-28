# Setup Commands

Run these in order.

---

## 1. Store Gemini API key in Secret Manager

```bash
echo -n "AIzaSyAnpwjLRWQHtMs3Ys7N3hpjNe-DtU3PFwg" | gcloud secrets create gemini-api-key \
  --data-file=- \
  --project=project-a8efccb1-2720-4a48-948
```

---

## 2. Grant Cloud Build access to the secret

```bash
gcloud secrets add-iam-policy-binding gemini-api-key \
  --member="serviceAccount:950758825854@cloudbuild.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=project-a8efccb1-2720-4a48-948
```

---

## 3. Set up Cloud Build trigger (one-time, in console)

1. Go to https://console.cloud.google.com/cloud-build/triggers?project=project-a8efccb1-2720-4a48-948
2. Click **Create trigger**
3. Fill in:
   - **Name**: `deploy-on-push-to-main`
   - **Region**: `us-central1`
   - **Event**: Push to a branch
   - **Source**: Connect to GitHub → select `padmanabhan-r/TaleWeaver`
   - **Branch**: `^main$`
   - **Configuration**: Cloud Build configuration file → `cloudbuild.yaml`
4. Click **Create**

---

## 4. Test — trigger a manual build

```bash
gcloud builds submit --no-source \
  --config=cloudbuild.yaml \
  --project=project-a8efccb1-2720-4a48-948 \
  --region=us-central1
```

Or just push any commit to main — the trigger fires automatically.

---

## 5. Check build logs

```bash
gcloud builds list --project=project-a8efccb1-2720-4a48-948 --region=us-central1 --limit=5
```

---

## Useful: update the secret if the API key changes

```bash
echo -n "NEW_GEMINI_API_KEY" | gcloud secrets versions add gemini-api-key \
  --data-file=- \
  --project=project-a8efccb1-2720-4a48-948
```

---

## Useful: manual deploy without Cloud Build

```bash
docker build --platform linux/amd64 \
  -t us-central1-docker.pkg.dev/project-a8efccb1-2720-4a48-948/taleweaver/backend:latest \
  .

docker push us-central1-docker.pkg.dev/project-a8efccb1-2720-4a48-948/taleweaver/backend:latest

gcloud run deploy taleweaver \
  --image=us-central1-docker.pkg.dev/project-a8efccb1-2720-4a48-948/taleweaver/backend:latest \
  --region=us-central1 \
  --project=project-a8efccb1-2720-4a48-948
```
