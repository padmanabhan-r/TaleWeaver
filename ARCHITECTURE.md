# TaleWeaver — Architecture

---

## System Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                            Browser                                   │
│                                                                      │
│   React SPA (Vite + TailwindCSS + Framer Motion)                     │
│                                                                      │
│   ┌──────────────────┐  16kHz PCM (base64)  ┌──────────────────┐    │
│   │ capture.worklet  │ ───────────────────► │                  │    │
│   │ (AudioWorklet)   │                      │  WebSocket       │    │
│   └──────────────────┘  24kHz PCM (base64)  │  /ws/story       │    │
│   ┌──────────────────┐ ◄─────────────────── │                  │    │
│   │ AudioBufferSource│                      └────────┬─────────┘    │
│   │ Node scheduling  │                               │              │
│   └──────────────────┘  POST /api/image              │              │
│   ┌──────────────────┐ ─────────────────────────────►│              │
│   │ useStoryImages   │  POST /api/story-opening       │              │
│   └──────────────────┘ ─────────────────────────────►│              │
│                         POST /api/story-recap         │              │
│   ┌──────────────────┐ ─────────────────────────────►│              │
│   │ localStorage     │ ◄── auto-saved on session end  │              │
│   │ (gallery)        │                               │              │
│   └──────────────────┘                               │              │
└──────────────────────────────────────────────── ─────┼──────────────┘
                                                        │
                                   ── Cloud Run ────────┼─────────────
                                                        │
┌───────────────────────────────────────────────────────▼─────────────┐
│                          FastAPI Backend                             │
│                                                                      │
│   /ws/story ──► proxy.py ◄────────────────────────────────────────  │
│                    │       WebSocket (wss, Vertex AI auth)           │
│                    │ ──────────────────────────────────────────────► │
│                    │       Gemini Live 2.5 Flash (Native Audio)      │
│                                                                      │
│   /api/story-opening ──► image_gen.py                               │
│                    └─► gemini-2.5-flash-lite  (plan + opening)      │
│                    └─► gemini image gen       (first illustration)   │
│                                                                      │
│   /api/image ──► image_gen.py                                       │
│                    └─► gemini image gen  (scene illustrations)       │
│                                                                      │
│   /api/story-recap ──► image_gen.py                                 │
│                    └─► gemini-2.5-flash-lite  (storybook title)     │
│                                                                      │
│   /*  ──────────────► FileResponse(frontend/dist/)  (React SPA)    │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Key Design Decisions

| Decision | Reason |
|---|---|
| Backend as WebSocket proxy | Browser cannot authenticate to Vertex AI directly (CORS, credentials) |
| Single Cloud Run service | Frontend bundled into Python container — no separate hosting, no cross-origin issues |
| AudioWorklet capture | Runs off main thread — no audio dropouts; `AudioContext({ sampleRate: 16000 })` handles resampling |
| `AudioBufferSourceNode` scheduling for playback | Each chunk scheduled at `max(currentTime, nextStartTime)` — Gemini can stream 30 s of audio in 5 s without queue overflow or garbling |
| `asyncio.sleep(0)` before Begin! | Yields one event-loop tick so `gemini_to_browser` task enters its `async for` loop before Gemini's first audio arrives — no audio is ever silently dropped |
| `generate_illustration` tool call | Gemini picks visually rich moments rather than a fixed clock; image always matches what was just narrated |
| Narrations from transcript, not LLM | Recap narrations stored from story transcript at session-save time — no parallel LLM calls, no 429 rate limit errors |
| `ping_interval=None` on Gemini WS | Gemini Live does not respond to standard WS ping frames; disabling prevents 1006 drops |
| `--timeout-graceful-shutdown 25` | uvicorn cleanly closes WebSocket sessions on Cloud Run SIGTERM before the 30 s SIGKILL |

---

## Components

### Frontend (`frontend/src/`)

| File | Role |
|---|---|
| `App.tsx` | Screen router: `landing → character-select → theme-select → story` |
| `screens/LandingPage.tsx` | Ambient landing page with CTA, floating animations, Past Adventures button |
| `screens/CharacterSelect.tsx` | 10 character picker (5 English + 5 Indian language, two rows) |
| `screens/ThemeSelect.tsx` | Three-option accordion: Pick a Theme / Magic Camera / Sketch a Theme |
| `screens/StoryScreen.tsx` | Live session: character portrait + scene canvas; auto-saves to localStorage on end |
| `hooks/useLiveAPI.ts` | WebSocket session state machine, AudioWorklet lifecycle, Begin! handshake |
| `hooks/useStoryImages.ts` | Tool-call and fallback image triggers, rate limiting, visual continuity context |
| `components/StoryRecapModal.tsx` | Scrollable storybook shown after "End Story"; uses transcript narrations |
| `components/PastAdventuresModal.tsx` | Gallery of all saved sessions; opens any session as an illustrated storybook |
| `components/AudioVisualizer.tsx` | Real-time mic amplitude waveform |
| `components/StorySceneGrid.tsx` | Scrollable grid of generated scene images with shimmer skeletons |
| `components/FloatingElements.tsx` | Framer Motion animated stars/sparkles/clouds |
| `characters/index.ts` | 10 character definitions (PNG portraits, voice, image style, language, category) |
| `public/audio-processors/capture.worklet.js` | Float32 → Int16, 1024-sample chunks, off main thread |
| `public/audio-processors/playback.worklet.js` | Legacy worklet (superseded by `AudioBufferSourceNode` scheduling in useLiveAPI) |

### Backend (`backend/`)

| File | Role |
|---|---|
| `main.py` | FastAPI app: routes, CORS, SPA static file serving, graceful WebSocket error handling |
| `proxy.py` | Authenticated bidirectional WebSocket proxy to Gemini Live; sends Begin! after `asyncio.sleep(0)` |
| `characters.py` | 10 character configs: system prompts, voice names, image styles, Gemini setup message builder |
| `image_gen.py` | `/api/story-opening`, `/api/image`, `/api/story-recap`, `/api/sketch-preview`, `/api/check-theme`, `/api/tts` |

---

## Audio Pipeline

### Capture (browser → Gemini)

```
Microphone  (getUserMedia — mono, echoCancellation, noiseSuppression, autoGainControl)
  │
AudioContext({ sampleRate: 16000 })
  │  resamples from device native rate to 16kHz
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
  │  base64 → Int16Array → Float32Array
  │  AudioBuffer created, scheduled at max(currentTime, nextStartTime)
  ▼
AudioBufferSourceNode → GainNode → AudioContext(24kHz) → speakers

Note: AudioContext resumed after getUserMedia() resolves (Safari: context
      auto-suspends before user gesture on playback context)
```

### Barge-in (child interrupts mid-story)

```
Child speaks while Gemini is narrating
  → Gemini VAD detects speech
  → serverContent.interrupted = true arrives
  → clearBuffer(): all scheduled AudioBufferSourceNodes stopped instantly
  → characterState = "listening"
  → child audio continues streaming to Gemini
  → Gemini weaves child's words into next story beat
```

---

## Session Startup (Begin! Handshake)

```
Browser clicks Begin
  → useLiveAPI.connect()
  → initPlayback() — AudioContext(24kHz) created and resumed
  → new WebSocket("/ws/story")

WebSocket open
  → browser sends { character_id, theme, prop_image, prop_description }
  → backend: connects to Gemini Live (Vertex AI, authenticated)
  → backend: sends setup message (system prompt, voice, tools, audio config)
  → Gemini sends { setupComplete }
  → backend: sends { setupComplete: true, characterName } to browser

Browser receives setupComplete
  → startCapture() — AudioContext(16kHz) + AudioWorklet started
  → AudioContext(24kHz) resumed (getUserMedia counts as user gesture)
  → sessionState = "active"

Backend (after creating proxy tasks)
  → asyncio.sleep(0)   ← yields one tick; gemini_to_browser is now in its async for loop
  → sends Begin! message directly to Gemini Live
  → Gemini starts narrating; audio forwarded immediately
```

---

## Image Generation Pipeline

### Tool-call path (primary)

```
Gemini calls generate_illustration tool mid-narration
  → backend forwards tool call to browser
  → browser sends tool response immediately (Gemini continues narrating without waiting)
  → forceImageGeneration(scene_description)
      → bypasses rate-limit timers
      → POST /api/image { scene_description, story_context, image_style,
                          previous_image_data, previous_scene_description,
                          skip_extraction: true }
      → image model generates illustration
      → base64 image → StorySceneGrid (shimmer → fade-in)
      → lastImageRef updated for next call's continuity context
```

### Fallback path (turn-complete)

```
turnComplete fires (character finishes a turn)
  → triggerImageGeneration(transcriptionText)
      → guard: no tool call in last 25 s? → skip (trust Gemini)
      → guard: interval since last trigger < 30 s? → skip
      → POST /api/image { scene_description: transcriptionText,
                          story_context, image_style,
                          previous_image_data, previous_scene_description }
      → image model generates illustration
```

### Visual continuity

Every `/api/image` call passes the previous image as a reference. The model is instructed to:
- Maintain character designs and art style if same scene
- Rebuild background but preserve carried-over characters if scene shifts
- Start fresh if entirely new cast appears

---

## Story Recap & Gallery

```
Session ends (child says stop or presses End Story)
  │
  ├── StoryScreen.saveToGallery()
  │     → resizes all images to 800px JPEG 0.8 (~100–200 KB each)
  │     → stores narrations from scene.description (transcript text, up to 500 chars)
  │     → saves { id, characterId, images[], narrations[], badges[], timestamp } to localStorage
  │
  └── "📖 See our story!" → StoryRecapModal
        → POST /api/story-recap
            → narrations: already built from transcript → sent in request body
            → backend: single Flash Lite call generates 4–6 word storybook title
            → returns { title, narrations }
        → renders scrollable storybook: title → scene image + narration pairs → "The End"

Past Adventures
  → PastAdventuresModal reads localStorage gallery
  → each entry opens as StorybookView
  → if recapTitle missing: one Flash Lite call to generate title (narrations already present)
  → persists title back to localStorage for instant future opens
```

---

## Session State Machine

```
idle ──── connect() ────► connecting
                               │
                          WS open + setupComplete
                               │
                               ▼
                            ready
                               │
                          startCapture() resolves
                               │
                               ▼
                ┌───────── active ──────────────────────┐
                │                                       │
          interrupted                             turnComplete
          (barge-in)                        image trigger fires
                │                         state = "thinking/speaking"
          clearBuffer()                               │
          state = "listening"                         │
                │                                     │
                └─────────────────────────────────────┘
                               │
                   ws.onclose or user clicks End Story
                               │
                    ┌──────────┴──────────┐
                 ended                 error
             (user-initiated)    (unexpected drop)
```

---

## Deployment

```
Push to main branch
  │
  ▼
Cloud Build (cloudbuild.yaml)
  │  Stage 1: node:22-slim  — npm ci + npm run build → frontend/dist/
  │  Stage 2: python:3.13-slim — pip install + copy dist/
  │
  ▼
Artifact Registry
  us-central1-docker.pkg.dev/…/taleweaver/backend
  │
  ▼
Cloud Run (us-central1)
  Service: taleweaver
  Memory: 1Gi | CPU: 2 | Max instances: 10 | Timeout: 3600s
  CMD: uvicorn main:app --workers 1 --loop uvloop --http h11
       --timeout-graceful-shutdown 25

  ├── React SPA  (frontend/dist/ via FileResponse)
  ├── /ws/story  → Gemini Live API (Vertex AI, ADC auth)
  ├── /api/image → Gemini image gen (GEMINI_API_KEY from Secret Manager)
  └── /api/story-* → gemini-2.5-flash-lite (Vertex AI, ADC auth)

Custom domain: taleweaver.online → Cloud Run URL mapping
```

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
