# TaleWeaver — Quick Start Guide

## Prerequisites

- Python 3.12+
- Node.js 18+
- [uv](https://docs.astral.sh/uv/getting-started/installation/) package manager

---

## 1. Clone the Repository

```bash
git clone https://github.com/padmanabhan-r/TaleWeaver.git
cd TaleWeaver
```

---

## 2. Install Dependencies

```bash
uv sync
```

This installs all required packages, including the Google Cloud and GenAI SDKs.

---

## 3. Activate the Virtual Environment

```bash
source .venv/bin/activate
```

---

## 4. Set Up a Google Cloud Account

1. Create a free Google Cloud account at https://console.cloud.google.com/freetrial
2. Create a new project and note your **Project ID**

---

## 5. Enable the Vertex AI API

1. Go to the Google Cloud Console: https://console.cloud.google.com
2. Make sure you're in the correct project (check the project selector in the top bar)
3. Navigate to **APIs & Services → Library**
4. Search for **"Vertex AI API"** and click **Enable**

It takes about 30–60 seconds to activate.

---

## 6. Configure Environment Variables

Create a `.env` file inside the `backend/` folder:

```bash
touch backend/.env
```

Add the following variables:

```env
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_GENAI_USE_VERTEXAI=true
GEMINI_API_KEY=your-gemini-api-key
```

---

## 7. Get a Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Sign in and create a new API key
3. When creating the key, set up billing and link it to the GCP project from Step 4
4. Copy the key into `GEMINI_API_KEY` in your `backend/.env`

> **Note:** The free tier has limited quota for this project.

---

## 8. Install Google Cloud SDK

**macOS — Option 1: Homebrew (recommended)**

```bash
brew install --cask google-cloud-sdk
```

**macOS — Option 2: Installer script**

```bash
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
```

**Other OS:** See the [official documentation](https://cloud.google.com/sdk/docs/install).

**Verify installation:**

```bash
gcloud --version
```

---

## 9. Initialise gcloud

```bash
gcloud init
```

This will:
- Open a browser to log in with your Google account
- Ask you to select a cloud project — pick the GCP project you created in Step 4
- Set a default region (use `us-central1`)

---

## 10. Authenticate with Google Cloud

```bash
gcloud auth application-default login
```

This opens a browser — sign in with the Google account that has access to your GCP project. This sets up Application Default Credentials (ADC), which the backend uses to authenticate to Vertex AI.

---

## 11. Run the App

**Backend (port 8000)** — run these once before starting:

```bash
export GOOGLE_CLOUD_PROJECT=your-project-id
export GOOGLE_CLOUD_LOCATION=us-central1
export GOOGLE_GENAI_USE_VERTEXAI=true
export IMAGE_MODEL=gemini-3.1-flash-image-preview
export IMAGE_LOCATION=global
export GEMINI_API_KEY=your-gemini-api-key
```

Then start the backend:

```bash
cd backend
uvicorn main:app --reload --port 8000
```

**Frontend (port 5173)** — in a new terminal:

```bash
cd frontend
npm install
echo "VITE_WS_URL=ws://localhost:8000/ws/story" > .env.local
echo "VITE_API_URL=http://localhost:8000" >> .env.local
npm run dev
```

Open **http://localhost:5173** in your browser and begin your adventure.

---

## 12. Or Start Both with One Command

From the project root:

```bash
./start.sh
```

This starts the backend (port 8000) and frontend (port 8080) together. Press `Ctrl+C` to stop both.

| | URL |
|---|---|
| Frontend | http://localhost:8080 |
| Backend | http://localhost:8000 |
| Health check | http://localhost:8000/api/health |
