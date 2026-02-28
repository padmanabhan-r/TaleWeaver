# TaleWeaver

![TaleWeaver Landing Page](images/0.%20TaleWeaver%20-%20Landing%20Page.png)

A voice-first interactive storytelling app for kids aged 4–10, powered by Google Gemini Live API. Children pick a beloved storyteller character and have a real-time voice conversation to co-create magical tales — with AI-generated illustrations appearing as the story unfolds.

**Live:** https://taleweaver-950758825854.us-central1.run.app

---

## Features

- **10 storyteller characters** — 5 English (Grandma Rose, Captain Leo, Fairy Sparkle, Professor Whiz, Dragon Blaze) and 5 Indian language grandmothers (Paati/Tamil, Dadi/Hindi, Ammamma/Telugu, Aaji/Marathi, Dida/Bengali)
- **Real-time bidirectional voice** via WebSocket + Gemini Live API — the child can interrupt, redirect, or react at any moment
- **Native audio** — no TTS/STT round-trips; Gemini handles voice directly at 24kHz
- **AI-generated scene illustrations** — triggered at `turnComplete` with full story context, rate-limited to 1 per 30s, up to 8 per session
- **Character visual consistency** — negative prompts + continuity instructions keep characters stable across scenes
- **Ambient landing page** — Framer Motion floating elements (stars, sparkles, clouds), background music, Gemini branding
- **Kid-safe** — all characters are warm, age-appropriate, and tuned for children aged 4–10
- **Multilingual** — Indian grandmother characters tell stories in Tamil, Hindi, Telugu, Marathi, and Bengali
- **15-minute session timeout** — idle sessions close automatically

---

## Tech Stack

| Layer | Technology |
|---|---|
| Conversation | `gemini-live-2.5-flash-native-audio` via Vertex AI |
| Scene extraction | `gemini-2.0-flash-lite` (narration → English visual scene) |
| Image generation | `gemini-3.1-flash-image-preview` via Gemini API key |
| Backend | Python 3.13 + FastAPI + WebSocket |
| Frontend | React 19 + Vite + TailwindCSS v4 + TypeScript + Framer Motion |
| Audio I/O | Web Audio API + AudioWorklet (16kHz capture, 24kHz playback) |
| Auth | GCP Application Default Credentials for Vertex AI; Gemini API key for image gen |
| Hosting | Cloud Run — single service serves frontend + backend |
| CI/CD | Google Cloud Build — auto-deploys on every push to `main` |

---

## Characters

| ID | Name | Language | Voice |
|---|---|---|---|
| grandma-rose | Grandma Rose | English | Aoede |
| captain-leo | Captain Leo | English | Charon |
| fairy-sparkle | Fairy Sparkle | English | Kore |
| professor-whiz | Professor Whiz | English | Puck |
| dragon-blaze | Dragon Blaze | English | Fenrir |
| paati | Paati | Tamil | Leda |
| dadi | Dadi | Hindi | Orus |
| ammamma | Ammamma | Telugu | Zephyr |
| aaji | Aaji | Marathi | Autonoe |
| dida | Dida | Bengali | Umbriel |

---

## How It Works

```
Child opens app → Landing page (ambient music, floating animations)
    → "Begin Your Adventure" → CharacterSelect
    → picks a character → StoryScreen
    → "Begin the Story!" → WebSocket → backend /ws/story
        → backend connects to Gemini Live API (Vertex AI)
        → sends character system prompt + voice config
        → mic capture starts (AudioWorklet, 16kHz PCM)

Story plays
    → Gemini speaks → 24kHz PCM → playback worklet → speakers
    → outputTranscription accumulates per turn
    → turnComplete → full turn text → useStoryImages
        → visual keyword pre-filter (EN/Tamil/Hindi/Telugu/Marathi/Bengali)
        → 30s rate limit + 8 image cap
        → POST /api/image → Flash Lite extracts scene → Gemini 3.1 generates image
        → base64 image → StorySceneGrid (shimmer → fade-in)

Child interrupts
    → Gemini VAD detects speech → playback clears
    → Gemini weaves child's words into the next story beat
```

---

## Repo Structure

```
/
├── backend/
│   ├── main.py            # FastAPI: /ws/story, /api/image, /api/health, SPA catch-all
│   ├── proxy.py           # Bidirectional WS proxy: browser ↔ Gemini Live API (15min timeout)
│   ├── characters.py      # 10 character configs: system prompts, voices, image styles
│   ├── image_gen.py       # POST /api/image — scene extraction + image generation
│   └── requirements.txt
├── frontend/
│   ├── public/audio-processors/
│   │   ├── capture.worklet.js    # 16kHz PCM mic capture
│   │   └── playback.worklet.js   # 24kHz PCM speaker playback
│   └── src/
│       ├── App.tsx                   # Router: landing | story-select | story
│       ├── characters/index.ts       # 10 character definitions + PNG portraits
│       ├── assets/characters/        # 10 PNG character portraits
│       ├── screens/
│       │   ├── LandingPage.tsx       # Ambient landing: CTA, Gemini branding, music
│       │   ├── CharacterSelect.tsx   # 5 English + 5 Indian rows with divider
│       │   └── StoryScreen.tsx       # Live session: portrait + scene canvas
│       ├── components/
│       │   ├── FloatingElements.tsx  # Framer Motion stars/sparkles/clouds
│       │   ├── MuteButton.tsx        # Ambient sound toggle
│       │   ├── StorySceneGrid.tsx    # Scrollable image grid
│       │   ├── StorySceneCard.tsx    # Shimmer → loaded image card
│       │   ├── AudioVisualizer.tsx   # Real-time waveform
│       │   └── StorybookEmpty.tsx    # Empty state illustration
│       └── hooks/
│           ├── useLiveAPI.ts         # WebSocket + AudioWorklet state machine
│           └── useStoryImages.ts     # Image trigger, rate limiting, story context
├── cloudbuild.yaml        # Cloud Build CI/CD pipeline
├── Dockerfile             # Multi-stage: node:22-slim builds frontend, python:3.13-slim serves both
└── implementation/        # Architecture and phase docs
```

---

## Local Development

**Backend** (runs on port 8000):
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Set credentials for local Vertex AI access:
```bash
gcloud auth application-default login
export GOOGLE_CLOUD_PROJECT=project-a8efccb1-2720-4a48-948
export GOOGLE_CLOUD_LOCATION=us-central1
export IMAGE_MODEL=gemini-3.1-flash-image-preview
export IMAGE_LOCATION=global
export GEMINI_API_KEY=your_key_here
```

**Frontend** (runs on port 5173):
```bash
cd frontend
npm install
npm run dev
```

Create `frontend/.env.local`:
```
VITE_WS_URL=ws://localhost:8000/ws/story
VITE_API_URL=http://localhost:8000
```

---

## Deployment

Single Cloud Run service at `https://taleweaver-950758825854.us-central1.run.app`.

The multi-stage Dockerfile builds the React frontend and embeds it in the Python container. FastAPI serves both the API and the SPA from the same origin — no CORS issues in production.

**CI/CD:** Every push to `main` triggers Cloud Build (`cloudbuild.yaml`) which builds, pushes to Artifact Registry, and deploys to Cloud Run automatically.

**Secrets:** `GEMINI_API_KEY` is stored in GCP Secret Manager (`gemini-api-key`) and injected at runtime. No secrets in the image or source code.

See `implementation/PHASE_6_DEPLOYMENT.md` for full setup instructions.

---

## Future Plans

### Learn & Explore Mode
Four subject-specialist characters that teach through interactive storytelling:
- **Count Cosmo** — Maths through space adventures
- **Dr. Luna** — Science & nature through discovery
- **Professor Pip** — Words & reading through magical stories
- **Arty** — Art & colours through creative play

### Character Animations
Replace static PNG portraits with Rive state machines — idle, speaking, listening, and thinking states tied to real-time audio amplitude.
