# TaleWeaver

![TaleWeaver Landing Page](images/0.%20TaleWeaver%20-%20Landing%20Page.png)

A voice-first interactive storytelling app for kids aged 4–10, powered by Google Gemini Live API. Children pick a beloved storyteller character and have a real-time voice conversation to co-create magical tales — with AI-generated illustrations appearing as the story unfolds.

---

## Features

- **10 storyteller characters** — 5 English (Grandma Rose, Captain Leo, Fairy Sparkle, Professor Whiz, Dragon Blaze) and 5 Indian language grandmothers (Paati/Tamil, Dadi/Hindi, Ammamma/Telugu, Aaji/Marathi, Dida/Bengali)
- **Real-time bidirectional voice** via WebSocket + Gemini Live API — the child can interrupt, redirect, or react at any moment
- **Native audio** — no TTS/STT round-trips; Gemini handles voice directly at 24kHz
- **AI-generated scene illustrations** — images triggered at `turnComplete` with full story context, rate-limited to 1 per 30s with up to 8 per session
- **Character consistency** — negative prompts + continuity instructions keep characters visually stable across scenes
- **Ambient landing page** — animated floating elements (stars, sparkles, clouds), background music, Google Gemini branding
- **Kid-safe content** — all characters are warm, age-appropriate, and tuned for children aged 4–10
- **Multilingual** — Indian grandmother characters tell stories in Tamil, Hindi, Telugu, Marathi, and Bengali

---

## Tech Stack

| Layer | Technology |
|---|---|
| Conversation | `gemini-live-2.5-flash-native-audio` via Vertex AI |
| Scene extraction | `gemini-2.0-flash-lite` (narration → English visual scene) |
| Image generation | `imagen-3.0-fast-generate-001` (env-selectable via `IMAGE_MODEL`) |
| Backend | Python 3.12 + FastAPI + WebSocket |
| Frontend | React 19 + Vite + TailwindCSS v4 + TypeScript + Framer Motion |
| Audio I/O | Web Audio API + custom AudioWorklet (16kHz capture, 24kHz playback) |
| Auth | GCP Application Default Credentials / service account (no API key exposure) |
| Hosting | Cloud Run (backend + frontend served from same container) |

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

## Architecture

```
Child opens app → Landing page (ambient music, Framer Motion animations)
    → "Begin Your Adventure" → CharacterSelect
    → selects a character → StoryScreen mounts
    → "Begin the Story!" → useLiveAPI.connect()
        → WebSocket → backend /ws/story
        → backend loads character config + GCP OAuth2 token
        → backend connects to Gemini Live API
        → setup: system prompt + voice + affective dialog + VAD
        → sends "Begin!" to trigger proactive speech
        → mic capture starts (AudioWorklet, 16kHz PCM)

Story plays
    → Gemini speaks → 24kHz PCM audio chunks → playback worklet
    → outputTranscription accumulates in ref
    → turnComplete → full turn text → useStoryImages
        → keyword pre-filter (EN/Tamil/Hindi/Telugu/Marathi/Bengali)
        → 30s rate limit + 8 image cap
        → POST /api/image → Flash Lite extracts scene → Imagen generates
        → base64 image → StorySceneGrid (shimmer → fade-in)

Child interrupts
    → VAD detects → playback clears → characterState = "listening"
    → Gemini weaves child's words into the next story beat
```

---

## Repo Structure

```
/
├── backend/
│   ├── main.py            # FastAPI: /ws/story, /api/image, /api/health, SPA catch-all
│   ├── proxy.py           # Bidirectional WS proxy: browser ↔ Gemini Live API
│   ├── characters.py      # 10 character configs (system prompts, voices, image styles)
│   ├── image_gen.py       # POST /api/image — scene extraction + image generation
│   └── requirements.txt
├── frontend/
│   ├── public/
│   │   └── audio-processors/
│   │       ├── capture.worklet.js    # 16kHz PCM mic capture
│   │       └── playback.worklet.js   # 24kHz PCM speaker playback
│   └── src/
│       ├── App.tsx                   # Router: landing | story-select | story
│       ├── characters/index.ts       # 10 character definitions (PNG portraits)
│       ├── assets/
│       │   ├── characters/           # 10 PNG character portraits
│       │   ├── hero-bg.jpg           # Landing page background
│       │   └── google-gemini-icon.svg
│       ├── screens/
│       │   ├── LandingPage.tsx       # Ambient landing: CTA, Gemini branding, music
│       │   ├── CharacterSelect.tsx   # 5 English + 5 Indian (two rows, divider)
│       │   └── StoryScreen.tsx       # Live session: 1/5 portrait + 4/5 scene canvas
│       ├── components/
│       │   ├── FloatingElements.tsx  # Framer Motion stars/sparkles/clouds
│       │   ├── MuteButton.tsx        # Ambient sound toggle
│       │   ├── StorySceneGrid.tsx    # Scrollable image grid
│       │   ├── StorySceneCard.tsx    # Shimmer → loaded image card
│       │   ├── AudioVisualizer.tsx   # Real-time waveform
│       │   └── StorybookEmpty.tsx    # Empty state illustration
│       └── hooks/
│           ├── useLiveAPI.ts         # WebSocket + AudioWorklet state machine
│           └── useStoryImages.ts     # Image trigger, context, rate limiting
├── Dockerfile             # Multi-stage: Node builds frontend, Python serves both
├── images/                # Screenshots and assets for documentation
└── implementation/        # Phase plans and architecture docs
```

---

## Local Development

**Backend:**
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8080
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Set `VITE_WS_URL=ws://localhost:8080` in `frontend/.env.local` to point at the local backend.

---

## Deployment

The app deploys as a single Cloud Run service — the multi-stage Dockerfile builds the React frontend and serves it from the FastAPI backend's static file handler.

Live service: `https://taleweaver-backend-950758825854.us-central1.run.app`

CI/CD via GitHub Actions (`deploy.yml`) activates once `GCP_SA_KEY` is added to repo secrets.

See `implementation/DEPLOYMENT.md` for full deployment instructions.

---

## Future Plans

### Learn & Explore Mode

A dedicated educational mode with four subject-specialist characters designed to teach through storytelling and interactive adventures:

- **Count Cosmo** (Maths) — A friendly astronaut who teaches counting, shapes, and patterns through space adventures
- **Dr. Luna** (Science & Nature) — A warm scientist who sparks wonder about animals, plants, weather, and the universe
- **Professor Pip** (Words & Reading) — A wise bookworm owl who makes letters, phonics, and vocabulary feel magical
- **Arty** (Art & Colours) — A creative art teacher who explores colour mixing, shapes, and famous artworks

This mode would have a distinct green/teal theme, a separate character selection screen, and a specialised session UI with concept panels and end-of-session summaries.

### Character Animations

Replace static PNG portraits with Rive state machines — idle, speaking, listening, and thinking animations tied to real-time audio amplitude.
