# Architecture

---

## Overview

TaleWeaver is a voice-driven storytelling app built around the **Gemini Live native audio API** — a true bidirectional WebSocket that lets a child interrupt, redirect, and react to a story in real time. The browser cannot call Vertex AI directly (auth, CORS), so a lightweight Python backend acts as an authenticated proxy.

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser                                 │
│                                                                 │
│   React SPA                                                     │
│   ┌──────────────┐   PCM audio (16kHz)    ┌─────────────────┐  │
│   │ AudioWorklet │ ──────────────────────► │                 │  │
│   │  (capture)   │                         │   WebSocket     │  │
│   └──────────────┘   PCM audio (24kHz)    │   /ws/story     │  │
│   ┌──────────────┐ ◄────────────────────── │                 │  │
│   │ AudioWorklet │                         └────────┬────────┘  │
│   │  (playback)  │                                  │           │
│   └──────────────┘   HTTP POST /api/image           │           │
│   ┌──────────────┐ ──────────────────────►          │           │
│   │ useStoryImage│                                  │           │
│   └──────────────┘                                  │           │
└──────────────────────────────────────────────────────┼──────────┘
                                                       │
                              ─ ─ ─ ─ Cloud Run ─ ─ ─ │ ─ ─ ─ ─ ─
                                                       │
┌──────────────────────────────────────────────────────▼──────────┐
│                      FastAPI Backend                            │
│                                                                 │
│   /ws/story ──► proxy.py ──────────────────────────────────►   │
│                   │           WebSocket (wss, Bearer token)     │
│                   │    ◄────────────────────────────────────    │
│                   │           Gemini Live API (Vertex AI)       │
│                   │           gemini-live-2.5-flash-native-audio│
│                                                                 │
│   /api/image ──► image_gen.py                                  │
│                   ├─► gemini-2.0-flash-lite  (scene extract)   │
│                   └─► imagen-3.0-fast-generate-001 (image gen) │
│                                                                 │
│   /* ──────────► FileResponse(frontend/dist/)   (SPA)          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Components

### Frontend (`frontend/src/`)

| File | Role |
|---|---|
| `App.tsx` | Top-level router: `landing → story-select → story → study-select → study` |
| `screens/LandingPage.tsx` | Mode selector (Story Time / Learn & Explore) |
| `screens/CharacterSelect.tsx` | 10 story characters in two rows (English + Indian) |
| `screens/StudyCharacterSelect.tsx` | 4 study characters in 2×2 grid |
| `screens/StoryScreen.tsx` | Live session: portrait, audio visualiser, scene image grid |
| `hooks/useLiveAPI.ts` | WebSocket session + AudioWorklet orchestration |
| `hooks/useStoryImages.ts` | Image trigger logic, rate limiting, rolling story context |
| `components/CharacterPortrait.tsx` | 14 hand-crafted SVG portraits |
| `components/StorySceneGrid.tsx` | Scrollable grid of generated scene images |
| `components/AudioVisualizer.tsx` | Real-time amplitude waveform |
| `characters/index.ts` | Registry of 14 character definitions |

### Backend (`backend/`)

| File | Role |
|---|---|
| `main.py` | FastAPI app: routes, CORS, SPA file serving |
| `proxy.py` | Authenticated WebSocket proxy to Gemini Live API |
| `characters.py` | 14 character configs: system prompts, voices, image styles |
| `image_gen.py` | `/api/image` endpoint: scene extraction + image generation |
| `scene_detector.py` | Dead code — safe to delete |

---

## Audio Pipeline

### Capture (browser → Gemini)

```
Microphone
  │  getUserMedia (mono, echoCancellation, noiseSuppression, autoGainControl)
  ▼
AudioContext (16kHz)
  │  resamples from native device rate → 16kHz
  ▼
capture.worklet.js (AudioWorkletProcessor)
  │  Float32 → Int16, 1024-sample chunks
  ▼
useLiveAPI (main thread)
  │  Int16Array → base64
  ▼
WebSocket → backend → Gemini Live API
  │  { realtime_input: { media_chunks: [{ mime_type: "audio/pcm;rate=16000", data: "..." }] } }
```

### Playback (Gemini → speaker)

```
Gemini Live API → backend (transparent proxy) → WebSocket → browser
  │  serverContent.modelTurn.parts[].inlineData.data  (base64 PCM 24kHz)
  ▼
useLiveAPI → playChunk()
  │  base64 → Int16Array (transferable buffer)
  ▼
playback.worklet.js (AudioWorkletProcessor)
  │  FIFO queue → Int16 → Float32 on each process() call
  ▼
AudioContext (24kHz) → GainNode → speakers
```

### Barge-in (child interrupts)

```
Gemini VAD detects child speech
  → Gemini sends serverContent.interrupted = true
  → frontend: clearBuffer() → worklet drains FIFO instantly
  → characterState = "listening"
  → child's audio continues streaming in real time
  → Gemini weaves child's words into the story
```

---

## Image Generation Pipeline

Images are triggered **after a full character turn** (not mid-sentence):

```
Gemini turn ends (turnComplete)
  ▼
useLiveAPI fires onImageTrigger(fullTurnText)
  ▼
useStoryImages.triggerImageGeneration(text)
  ├── append to rolling story context (last 2000 chars)
  ├── guard: session startup delay (20s)
  ├── guard: rate limit (1 image per 30s)
  ├── guard: max 8 images per session
  ├── guard: visual keyword pre-filter (EN/Tamil/Hindi/Telugu/Marathi/Bengali)
  └── POST /api/image { scene_description, story_context, image_style, session_id }
        ▼
      image_gen.py
        ├── gemini-2.0-flash-lite
        │     extracts a painter-specific English scene description (2-3 sentences)
        │     uses story_context to name exact characters, settings, actions
        └── imagen-3.0-fast-generate-001
              prompt = safety_prefix + image_style + extracted_scene
              → base64 PNG (4:3 aspect ratio)
  ▼
StorySceneCard: shimmer skeleton → fade-in image
```

---

## Session State Machine

```
              connect()
idle ──────────────────► connecting
                              │
                         setupComplete received
                              │
                              ▼
                           ready ──► mic capture starts ──► active
                                                               │
                              ┌────────────────────────────────┤
                              │                                │
                         interrupted                     turnComplete
                         (barge-in)                           │
                              │                          characterState
                         clearBuffer()                   = "listening"
                         state="listening"                    │
                              └────────────────────────────────┘
                                                               │
                                                       ws.onclose / error
                                                               │
                                                       ended / error
```

---

## Character System

Each character is defined by:

| Field | Purpose |
|---|---|
| `id` | URL-safe slug, matched against `character_id` in WebSocket init |
| `name` | Display name |
| `voice_name` | Gemini Live voice (Aoede, Charon, Kore, Puck, Fenrir, Leda, Orus, Zephyr, Autonoe, Umbriel) |
| `image_style` | Art direction string prepended to every image prompt |
| `system_prompt` | Full character personality + language + story style instructions |
| `isStudy` (frontend) | Separates study characters from story characters in UI routing |

Story characters share `SYSTEM_PROMPT_BASE` (safety rules, STORY VARIETY directive, scene markers). Study characters have standalone English-only educational prompts.

---

## Deployment Architecture

```
GitHub (main branch)
  │  push
  ▼
GitHub Actions (.github/workflows/deploy.yml)
  │  google-github-actions/auth (GCP_SA_KEY secret)
  │  docker build --platform linux/amd64 .   ← multi-stage: Node + Python
  │  docker push → Artifact Registry
  ▼
gcloud run deploy taleweaver-backend
  │
  ▼
Cloud Run (us-central1)
  ├── serves React SPA (frontend/dist/) via FileResponse
  ├── proxies /ws/story → Gemini Live API (Vertex AI)
  └── /api/image → Gemini Flash Lite + Imagen (Vertex AI)
```

GCP auth on Cloud Run uses the attached service account's identity — no API keys or secrets in the container.
