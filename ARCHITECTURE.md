# TaleWeaver — Architecture

---

## Current Architecture (Phase 1–4, live)

```
┌─────────────────────────────────────────────────────────────────────┐
│                            Browser                                  │
│                                                                     │
│   React SPA (Vite + TailwindCSS + Framer Motion)                    │
│                                                                     │
│   ┌──────────────┐  PCM audio (16kHz, Int16)   ┌─────────────────┐ │
│   │   capture    │ ──────────────────────────► │                 │ │
│   │  .worklet.js │                              │  WebSocket      │ │
│   └──────────────┘  PCM audio (24kHz, Int16)   │  /ws/story      │ │
│   ┌──────────────┐ ◄────────────────────────── │                 │ │
│   │  playback    │                              └────────┬────────┘ │
│   │  .worklet.js │                                       │          │
│   └──────────────┘  HTTP POST /api/image                │          │
│   ┌──────────────┐ ────────────────────────────────────►│          │
│   │useStoryImages│                                       │          │
│   └──────────────┘                                       │          │
└───────────────────────────────────────────────────────── │ ─────────┘
                                                           │
                                    ── Cloud Run ──────────┼───────────
                                                           │
┌──────────────────────────────────────────────────────────▼──────────┐
│                         FastAPI Backend                             │
│                                                                     │
│   /ws/story ──► proxy.py ─────────────────────────────────────►    │
│                    │        WebSocket (wss + Bearer token)          │
│                    │ ◄───────────────────────────────────────────   │
│                    │        Gemini Live API (Vertex AI)             │
│                    │        gemini-live-2.5-flash-native-audio      │
│                                                                     │
│   /api/image ──► image_gen.py                                      │
│                    ├─► gemini-2.0-flash-lite   (scene extraction)  │
│                    └─► imagen-3.0-fast-generate-001  (image gen)   │
│                                                                     │
│   /*  ──────────► FileResponse(frontend/dist/)   (React SPA)       │
└─────────────────────────────────────────────────────────────────────┘
```

### Key design decisions

| Decision | Reason |
|---|---|
| Backend as WebSocket proxy | Browser cannot auth to Vertex AI directly (CORS, credentials) |
| Single Cloud Run service | Frontend bundled into Python container — no separate hosting, no CORS |
| AudioWorklet (not ScriptProcessor) | Low-latency, runs off main thread — no audio dropouts |
| Image trigger at `turnComplete` | Full turn text (100–300 words) gives the model enough context; mid-sentence fragments produced garbage images |
| Client-side image rate limiting | Simple; backend `/api/image` trusts client rate, avoids over-engineering |

---

## Components

### Frontend (`frontend/src/`)

| File | Role |
|---|---|
| `App.tsx` | Router: `landing → story-select → story` |
| `screens/LandingPage.tsx` | Ambient landing: CTA, Framer Motion elements, ambient music, Gemini branding |
| `screens/CharacterSelect.tsx` | 10 story characters (5 English + 5 Indian, two rows with divider) |
| `screens/StoryScreen.tsx` | Live session: 1/5 character portrait + 4/5 scene canvas |
| `hooks/useLiveAPI.ts` | WebSocket session + AudioWorklet state machine |
| `hooks/useStoryImages.ts` | Image trigger, rolling story context, rate limiting |
| `components/FloatingElements.tsx` | Framer Motion animated stars/sparkles/clouds |
| `components/MuteButton.tsx` | Ambient sound toggle |
| `components/StorySceneGrid.tsx` | Scrollable grid of generated scene images |
| `components/AudioVisualizer.tsx` | Real-time amplitude waveform |
| `characters/index.ts` | 10 character definitions (PNG portraits, voice, image style) |

### Backend (`backend/`)

| File | Role |
|---|---|
| `main.py` | FastAPI app: routes, CORS, SPA static file serving |
| `proxy.py` | Authenticated bidirectional WebSocket proxy to Gemini Live API |
| `characters.py` | 10 character configs: system prompts, voices, image styles |
| `image_gen.py` | `/api/image`: scene extraction (Flash Lite) → image generation (Imagen) |

---

## Audio Pipeline

### Capture (browser → Gemini)
```
Microphone  (getUserMedia — mono, echoCancellation, noiseSuppression)
  │
AudioContext (16kHz)
  │  Float32 samples at device rate → resampled to 16kHz
  ▼
capture.worklet.js  (AudioWorkletProcessor, off main thread)
  │  Float32 → Int16, 1024-sample chunks
  ▼
useLiveAPI (main thread)
  │  Int16Array → base64
  ▼
WebSocket → backend (transparent) → Gemini Live
  { realtime_input: { media_chunks: [{ mime_type: "audio/pcm;rate=16000", data: "..." }] } }
```

### Playback (Gemini → speaker)
```
Gemini Live → backend (transparent) → WebSocket → browser
  serverContent.modelTurn.parts[].inlineData.data  (base64 PCM 24kHz)
  │
useLiveAPI → playChunk()
  │  base64 → Int16Array (transferable)
  ▼
playback.worklet.js  (FIFO queue, Int16 → Float32)
  ▼
AudioContext (24kHz) → GainNode → speakers
```

### Barge-in (child interrupts mid-story)
```
Gemini VAD detects child speech
  → Gemini sends serverContent.interrupted = true
  → clearBuffer() sent to playback worklet → FIFO drains instantly
  → characterState = "listening"
  → child audio continues streaming to Gemini in real time
  → Gemini weaves child's words into next story beat
```

---

## Image Generation Pipeline

```
turnComplete fires  (character finishes speaking)
  ▼
onImageTrigger(fullTurnText)  →  useStoryImages
  ├── append to rolling story context (last 2000 chars)
  ├── guard: 20s session startup delay
  ├── guard: 1 image per 30s
  ├── guard: max 8 images per session
  ├── guard: visual keyword pre-filter (EN / Tamil / Hindi / Telugu / Marathi / Bengali)
  └── POST /api/image { scene_description, story_context, image_style, session_id }
        ▼
      image_gen.py
        ├── gemini-2.0-flash-lite
        │     → 2-3 sentence painter-specific English scene description
        │     → names exact character, exact setting, exact action
        └── imagen-3.0-fast-generate-001
              prompt = safety_prefix + character.image_style + extracted_scene
              negative_prompt = character inconsistency, morphing, style mismatch
              → base64 PNG (4:3)
  ▼
StorySceneCard: shimmer skeleton → fade-in
```

---

## Session State Machine

```
idle ──── connect() ────► connecting
                               │
                          setupComplete
                               │
                               ▼
                            ready ──► mic capture starts
                               │
                               ▼
                ┌───────── active ─────────────┐
                │                              │
          interrupted                    turnComplete
          (barge-in)                          │
                │                      image trigger fires
          clearBuffer()                       │
          state="listening"         state="thinking/speaking"
                │                             │
                └─────────────────────────────┘
                               │
                         ws.onclose / error
                               │
                        ended / error
```

---

## Deployment Architecture (current)

```
GitHub  ──push to main──►  GitHub Actions (.github/workflows/deploy.yml)
                                │
                          google-github-actions/auth  (GCP_SA_KEY secret)
                                │
                          docker build --platform linux/amd64
                          (Stage 1: node:22-slim  builds React → dist/)
                          (Stage 2: python:3.13-slim  serves FastAPI + dist/)
                                │
                          docker push → Artifact Registry
                          us-central1-docker.pkg.dev/.../taleweaver/backend
                                │
                          gcloud run deploy taleweaver-backend
                                │
                                ▼
                    Cloud Run (us-central1)  — 1Gi / 2 vCPU / 3600s timeout
                    https://taleweaver-backend-950758825854.us-central1.run.app
                          ├── React SPA (frontend/dist/)
                          ├── /ws/story  → Gemini Live API (Vertex AI)
                          └── /api/image → Gemini Flash Lite + Imagen (Vertex AI)
```

GCP auth on Cloud Run uses the service account's attached identity — no API keys in the container.

**To activate CI/CD:** Add `GCP_SA_KEY` secret to GitHub repo → Settings → Secrets → Actions.

---

## Future Architecture — Multi-Agent Pipeline

The next evolution (inspired by the reference architecture) introduces a multi-agent pipeline
to separate concerns, improve image quality, and enable richer story intelligence:

```
┌──────────────────────────────────────────────────────────────────────┐
│                     Google Cloud Run Services                        │
│                                                                      │
│   ┌────────────────────────┐       ┌─────────────────────────────┐  │
│   │    TaleWeaver Frontend │       │    TaleWeaver Backend       │  │
│   │    React SPA           │◄─────►│    FastAPI Service           │  │
│   │    (same-origin)       │       │                             │  │
│   └────────────────────────┘       └──────────┬──────────────────┘  │
│                                               │                      │
└───────────────────────────────────────────────┼──────────────────────┘
                                                │
                          ┌─────────────────────▼──────────────────────┐
                          │       Multi-Agent Pipeline (ADK)           │
                          │                                            │
                          │  ┌─────────────────────────────────────┐  │
                          │  │  1. Story Narrator Agent             │  │
                          │  │  Gemini Live 2.5 Flash Native Audio  │  │
                          │  │  Bidirectional voice conversation    │  │
                          │  └─────────────────┬───────────────────┘  │
                          │                    │                       │
                          │                    ▼                       │
                          │  ┌─────────────────────────────────────┐  │
                          │  │  2. Scene Detector Agent             │  │
                          │  │  Gemini 2.0 Flash Lite               │  │
                          │  │  Extracts visual scenes from turns   │  │
                          │  └─────────────────┬───────────────────┘  │
                          │                    │                       │
                          │                    ▼                       │
                          │  ┌─────────────────────────────────────┐  │
                          │  │  3. Illustrator Agent                │  │
                          │  │  Imagen 3.0 / Gemini 2.0 Flash Image │  │
                          │  │  Generates consistent scene images   │  │
                          │  └─────────────────────────────────────┘  │
                          └────────────────────────────────────────────┘
                                                │
                          ┌─────────────────────▼──────────────────────┐
                          │           Vertex AI Models                 │
                          │                                            │
                          │  Gemini Live 2.5 Flash  (voice)           │
                          │  Gemini 2.0 Flash Lite  (text/scene)      │
                          │  Imagen 3.0              (images)          │
                          └────────────────────────────────────────────┘
```

### Why multi-agent?

| Current (monolithic proxy) | Future (multi-agent) |
|---|---|
| Scene detection is client-side keyword matching | Dedicated agent with semantic understanding |
| Image prompt built from raw turn text | Agent crafts precise painter-style prompts |
| No story arc awareness | Story Intelligence agent tracks narrative arc, pacing, engagement |
| Image generation blocks on one model | Agents run in parallel — scene detect + image gen overlap |
| No session memory across turns | Shared context store feeds all agents |

---

## Characters

| ID | Name | Language | Voice | Style |
|---|---|---|---|---|
| grandma-rose | Grandma Rose | English | Aoede | Bedtime / fairy tales |
| captain-leo | Captain Leo | English | Charon | Adventure / seafaring |
| fairy-sparkle | Fairy Sparkle | English | Kore | Magic / fantasy |
| professor-whiz | Professor Whiz | English | Puck | Science / discovery |
| dragon-blaze | Dragon Blaze | English | Fenrir | Comedy / dragon fun |
| paati | Paati | Tamil | Leda | Traditional Tamil stories |
| dadi | Dadi | Hindi | Orus | Hindi folk tales |
| ammamma | Ammamma | Telugu | Zephyr | Telugu mythology |
| aaji | Aaji | Marathi | Autonoe | Marathi folk tales |
| dida | Dida | Bengali | Umbriel | Bengali fairy tales |
