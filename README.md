# TaleWeaver

![TaleWeaver Landing Page](images/0.%20TaleWeaver%20-%20Landing%20Page.png)

A voice-first interactive storytelling app for kids aged 4–10, powered by Google Gemini Live API. Children pick a beloved storyteller character, choose how to spark their adventure, and have a real-time voice conversation to co-create magical tales — with AI-generated illustrations appearing as the story unfolds.

**Live:** https://taleweaver.online

---

## Features

- **10 storyteller characters** — 5 English (Wizard Wally, Fairy Flora, Captain Coco, Robo Ricky, Draco the Dragon) and 5 Indian language storytellers (Dadi Maa/Hindi, Raja Vikram/Marathi, Little Hanuman/Tamil, Rajkumari Meera/Telugu, Rishi Bodhi/Bengali)
- **Three ways to start a story** — Pick a theme tile, use the Magic Camera to hold up a prop, or Sketch a Theme on a drawing canvas
- **Real-time bidirectional voice** via WebSocket + Gemini Live API — the child can interrupt, redirect, or react at any moment
- **Native audio** — no TTS/STT round-trips; Gemini handles voice directly at 24kHz
- **AI-generated scene illustrations** — triggered at `turnComplete` with full story context, rate-limited, continuous throughout the session
- **Visual continuity** — reference image + continuity instructions keep characters consistent across scenes
- **Story branching** — at key moments Gemini presents 2–3 choice buttons; child picks by tapping or voice
- **Achievement badges** — Gemini awards badges for creative contributions; animated pop-up in the centre of the screen
- **Interactive moments** — character invites the child to clap, wave, or make a face (camera-verified)
- **Life skills themes** — Sharing, Courage, Gratitude, Creativity, Kindness alongside the main adventure themes
- **Content moderation** — typed themes, sketches, and camera props are safety-checked before the story starts
- **Camera vision** — optional live webcam feed lets Gemini see and react to the child
- **Sketch a Theme** — drawing canvas with 19 colours; sketch is recreated as a storybook illustration and becomes the story's starting image
- **Kid-safe** — all characters are warm, age-appropriate, and tuned for children aged 4–10; story never ends unless the child asks
- **Multilingual** — Indian storytellers tell stories in Hindi, Marathi, Tamil, Telugu, and Bengali
- **15-minute session timeout** — idle sessions close automatically

---

## Tech Stack

| Layer | Technology |
|---|---|
| Conversation | `gemini-live-2.5-flash-native-audio` via Vertex AI |
| Scene extraction / safety | `gemini-2.0-flash-lite` |
| Image generation | `gemini-2.0-flash-preview-image-generation` via Gemini API key |
| Backend | Python 3.13 + FastAPI + WebSocket |
| Frontend | React 19 + Vite + TailwindCSS v4 + TypeScript + Framer Motion |
| Audio I/O | Web Audio API + AudioWorklet (16kHz capture, 24kHz playback) |
| Auth | GCP Application Default Credentials for Vertex AI; Gemini API key for image gen |
| Hosting | Cloud Run — single service serves frontend + backend |
| Domain | taleweaver.online (custom domain mapped to Cloud Run) |
| CI/CD | Google Cloud Build — auto-deploys on every push to `main` |

---

## Characters

| ID | Name | Language | Voice |
|---|---|---|---|
| wizard | Wizard Wally | English | Puck |
| fairy | Fairy Flora | English | Aoede |
| pirate | Captain Coco | English | Charon |
| robot | Robo Ricky | English | Laomedeia |
| dragon | Draco the Dragon | English | Fenrir |
| dadi | Dadi Maa | Hindi हिंदी | Autonoe |
| maharaja | Raja Vikram | Marathi मराठी | Umbriel |
| hanuman | Little Hanuman | Tamil தமிழ் | Alnilam |
| rajkumari | Rajkumari Meera | Telugu తెలుగు | Kore |
| rishi | Rishi Bodhi | Bengali বাংলা | Puck |

---

## How It Works

```
Child opens app → Landing page (ambient music, floating animations)
    → "Begin Your Adventure" → CharacterSelect
    → picks a character → ThemeSelect
        Option A: Pick a Theme — 12 theme tiles + 5 life skills + free-text custom
        Option B: Magic Camera — live viewfinder → capture prop → safety check
                  → AI recreates prop as storybook illustration → confirm & start
        Option C: Sketch a Theme — draw on canvas (19 colours) → AI recreates drawing
                  → confirm illustrated version → start story

    → StoryScreen mounts → useLiveAPI.connect()
        → WebSocket → backend /ws/story
        → backend connects to Gemini Live API (Vertex AI)
        → sends character system prompt + voice config
        → sends "Begin!" client_content (with theme / prop image / sketch)
        → mic capture starts (AudioWorklet, 16kHz PCM)

Story plays
    → Gemini speaks → 24kHz PCM → playback worklet → speakers
    → outputTranscription accumulates per turn
    → turnComplete → full turn text → useStoryImages
        → POST /api/image → Flash Lite extracts scene → Gemini generates image
        → base64 image → StorySceneGrid (shimmer → fade-in)
        → continues generating until session ends (no scene cap)

Story branching
    → Gemini calls showChoice tool (at most once per session)
    → frontend queues choice until turnComplete + 700ms audio drain
    → ChoiceOverlay appears at top of canvas with 2–3 buttons
    → child taps OR speaks any response → overlay dismisses
    → toolResponse + client_content sent → Gemini continues

Achievement badges
    → Gemini calls awardBadge tool for genuine creative contributions
    → BadgePopup appears centred on screen, auto-dismisses after 3s

Child interrupts
    → Gemini VAD detects speech → playback clears
    → choice overlay dismissed if showing
    → Gemini weaves child's words into the next story beat
```

---

## Repo Structure

```
/
├── backend/
│   ├── main.py            # FastAPI: /ws/story, /api/image, /api/check-theme, /api/sketch-preview, SPA catch-all
│   ├── proxy.py           # Bidirectional WS proxy: browser ↔ Gemini Live API (15min timeout)
│   ├── characters.py      # 10 character configs: system prompts, voices, image styles, tool declarations
│   ├── image_gen.py       # /api/image, /api/sketch-preview, /api/check-theme — scene extraction + safety + image gen
│   └── requirements.txt
├── frontend/
│   ├── public/audio-processors/
│   │   ├── capture.worklet.js    # 16kHz PCM mic capture
│   │   └── playback.worklet.js   # 24kHz PCM speaker playback
│   └── src/
│       ├── App.tsx                   # Router: landing | character-select | theme-select | story
│       ├── characters/index.ts       # 10 character definitions + PNG portraits
│       ├── assets/characters/        # 10 PNG character portraits
│       ├── screens/
│       │   ├── LandingPage.tsx       # Ambient landing: CTA, Gemini branding, music
│       │   ├── CharacterSelect.tsx   # 5 English + 5 Indian rows with divider
│       │   ├── ThemeSelect.tsx       # Pick/Camera/Sketch accordion; safety moderation
│       │   └── StoryScreen.tsx       # Live session: animated portrait + scene canvas + overlays
│       ├── components/
│       │   ├── ChoiceOverlay.tsx     # Story branching buttons (top of canvas)
│       │   ├── BadgePopup.tsx        # Centred achievement badge pop-up (3s auto-dismiss)
│       │   ├── FloatingElements.tsx  # Framer Motion stars/sparkles/clouds
│       │   ├── StorySceneGrid.tsx    # Scrollable image grid
│       │   ├── StorySceneCard.tsx    # Shimmer → loaded image card
│       │   ├── AudioVisualizer.tsx   # Real-time waveform
│       │   └── StorybookEmpty.tsx    # Empty state illustration
│       └── hooks/
│           ├── useLiveAPI.ts         # WebSocket + AudioWorklet + camera stream + tool call handling
│           └── useStoryImages.ts     # Image trigger, rate limiting, story context, unlimited scenes
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
export GOOGLE_CLOUD_PROJECT=your-project-id
export GOOGLE_CLOUD_LOCATION=us-central1
export IMAGE_MODEL=gemini-2.0-flash-preview-image-generation
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

Deployed at **https://taleweaver.online** (custom domain mapped to Cloud Run).

The multi-stage Dockerfile builds the React frontend and embeds it in the Python container. FastAPI serves both the API and the SPA from the same origin.

**CI/CD:** Every push to `main` triggers Cloud Build (`cloudbuild.yaml`) which builds, pushes to Artifact Registry, and deploys to Cloud Run automatically.

**Secrets:** `GEMINI_API_KEY` is stored in GCP Secret Manager and injected at runtime. No secrets in the image or source code.

See `implementation/PHASE_6_DEPLOYMENT.md` for full setup instructions.
