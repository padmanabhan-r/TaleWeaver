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
│                    └─► gemini-3.1-flash-image-preview       (first illustration)   │
│                                                                      │
│   /api/image ──► image_gen.py                                       │
│                    └─► gemini-3.1-flash-image-preview  (scene illustrations)       │
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
| `generate_illustration` tool call | Gemini Live acts as an **agent** — picks visually rich moments autonomously and calls `generate_illustration` or `award_badge` tools; image always matches what was just narrated |
| Narrations from transcript, not LLM | Recap narrations stored from story transcript at session-save time — no parallel LLM calls, no 429 rate limit errors |
| `ping_interval=None` on Gemini WS | Gemini Live does not respond to standard WS ping frames; disabling prevents 1006 drops |
| `--timeout-graceful-shutdown 25` | uvicorn cleanly closes WebSocket sessions on Cloud Run SIGTERM before the 30 s SIGKILL |

---

## Components

### Frontend (`frontend/src/`)

| File | Role |
|---|---|
| `App.tsx` | Router: `landing → story-select → theme-select → story`; home navigation wired to all screens |
| `screens/LandingPage.tsx` | Ambient landing: CTA, Past Adventures button, Framer Motion elements, ambient music |
| `screens/CharacterSelect.tsx` | 10 story characters (5 English + 5 Indian, two rows with divider); 🏠 home button |
| `screens/ThemeSelect.tsx` | Three start modes: theme tile, Magic Camera, Sketch; safety check; 🏠 home button |
| `screens/StoryScreen.tsx` | Live session: 1/5 character panel + 4/5 scene canvas; saves gallery on end/home |
| `hooks/useLiveAPI.ts` | WebSocket session + `AudioBufferSourceNode` scheduling; AudioContext resume on mic start |
| `hooks/useStoryImages.ts` | Tool-call-first image trigger, fallback every 8s, unlimited scenes, AbortController cancel |
| `components/StoryRecapModal.tsx` | Inline storybook after session; calls `/api/story-recap`; saves narrations via `onRecapGenerated` |
| `components/PastAdventuresModal.tsx` | Story gallery grid + `StorybookView` (matches recap style with narrations + badges) |
| `components/BadgePopup.tsx` | Centred badge overlay, 3s auto-dismiss, queued for multiple badges |
| `components/FloatingElements.tsx` | Framer Motion animated stars/sparkles/clouds |
| `components/MuteButton.tsx` | Ambient sound toggle |
| `components/StorySceneGrid.tsx` | Scrollable grid of generated scene images with shimmer loading state |
| `components/AudioVisualizer.tsx` | Real-time amplitude waveform (playback + capture) |
| `characters/index.ts` | 10 character definitions (PNG portraits, voice, image style) |

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
  │  creates AudioBuffer (24kHz, 1ch)
  │  schedules source.start(nextStartTime)
  │  nextStartTime += buffer.duration
  ▼
AudioBufferSourceNode chain → GainNode → AudioContext (24kHz) → speakers
  (no queue, no overflow cap — chunks scheduled into the future)
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

Two paths — tool call (primary) and fallback:

```
PATH 1: Gemini calls generate_illustration(scene_description)
  ▼
useLiveAPI → onGenerateIllustration(description)
  ├── immediately sends toolResponse (Gemini doesn't wait for image)
  └── useStoryImages → forceImageGeneration(description)
        ├── bypasses all rate limits
        ├── sets lastToolCallTimeRef (fallback stays silent for 25s)
        └── POST /api/image { skip_extraction: true, ... }
              ▼
            image_gen.py → safety filter (blocks dangerous objects) → gemini-3.1-flash-image-preview → base64
  ▼
StorySceneCard: shimmer skeleton → fade-in

PATH 2: Fallback — turnComplete fires, no tool call in last 25s, 8s since last image
  ▼
useStoryImages → triggerImageGeneration(turnText)
  ├── appends to rolling story context (last 2000 chars)
  ├── guard: 3s minimum after session start (first image)
  ├── guard: 8s between fallback images
  └── POST /api/image { scene_description, story_context, image_style, session_id,
                         previous_image_data, previous_image_mime_type, previous_scene_description }
        ▼
      image_gen.py → safety filter (blocks dangerous objects) → gemini-3.1-flash-image-preview → base64 (with visual continuity context)
  ▼
StorySceneCard: shimmer skeleton → fade-in
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
| fairy | Fairy Flora | English | Aoede |
| pirate | Captain Coco | English | Charon |
| robot | Robo Ricky | English | Laomedeia |
| rajkumari | Rajkumari Meera | English (Indian accent) | Kore |
| wizard | Wizard Wally | English | Puck |
| dadi | Dadi Maa | Hindi हिंदी | Autonoe |
| rajvikram | Raja Vikram | Tamil தமிழ் | Umbriel |
| naInai | Yé Ye | Mandarin 普通话 | Alnilam |
| abuela | Abuelo Miguel | Spanish | Fenrir |
| mamie | Mamie Claire | French | Leda |
