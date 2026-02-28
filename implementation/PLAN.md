# TaleWeaver — Interactive Storytelling for Kids
### Build Plan (updated 28 Feb 2026)

---

## Overview

A voice-driven, kid-friendly web app where a child talks with a beloved storyteller character
and listens to a live, improvised story — with AI-generated illustrations appearing as the
tale unfolds.

**Challenge category:** Creative Storyteller
**Key differentiator:** Gemini Live native audio API — true bidirectional conversation,
the child can interrupt, redirect, or react at any moment. Illustrations are generated
asynchronously against the live story context so images actually match what's being told.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Conversation | `gemini-live-2.5-flash-native-audio` via Vertex AI |
| Scene extraction | `gemini-2.0-flash-lite` (narration → English visual scene) |
| Image generation | `gemini-3.1-flash-image-preview` via Gemini API key (AI Studio) |
| Backend | Python 3.13 + FastAPI + google-genai SDK |
| Transport | WebSocket (bidirectional proxy: browser ↔ backend ↔ Gemini Live) |
| Frontend | React 19 + Vite + TailwindCSS v4 + TypeScript + Framer Motion |
| Audio I/O | Web Audio API + AudioWorklet (16kHz capture, 24kHz playback) |
| Auth | GCP Application Default Credentials (Vertex AI) + Gemini API key (image gen) |
| Hosting | Cloud Run — single service, frontend embedded in Python container |
| CI/CD | Google Cloud Build — `cloudbuild.yaml`, triggers on push to `main` |

---

## Repository Structure

```
/
├── backend/
│   ├── main.py            # FastAPI: /ws/story, /api/image, /api/health, SPA catch-all
│   ├── proxy.py           # Bidirectional WS proxy: browser ↔ Gemini Live (15min timeout)
│   ├── characters.py      # 10 character configs: system prompts, voices, image styles
│   ├── image_gen.py       # POST /api/image — scene extraction + image generation
│   └── requirements.txt
├── frontend/
│   ├── public/audio-processors/
│   │   ├── capture.worklet.js   # 16kHz PCM mic capture
│   │   └── playback.worklet.js  # 24kHz PCM speaker playback
│   └── src/
│       ├── App.tsx                   # Router: landing | story-select | story
│       ├── characters/index.ts       # 10 character definitions (PNG portraits)
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
│           └── useStoryImages.ts     # Image trigger, rate limiting (8s), story context
├── cloudbuild.yaml        # Cloud Build CI/CD pipeline
├── Dockerfile             # Multi-stage: node:22-slim builds frontend, python:3.13-slim serves both
└── implementation/        # Phase plans and architecture docs
```

---

## Characters

### Story Mode (10)

| ID | Name | Language | Voice |
|---|---|---|---|
| grandma-rose | Grandma Rose | English | Aoede |
| captain-leo | Captain Leo | English | Charon |
| fairy-sparkle | Fairy Sparkle | English | Kore |
| professor-whiz | Professor Whiz | English | Puck |
| dragon-blaze | Dragon Blaze | English | Fenrir |
| paati | Paati | Tamil தமிழ் | Leda |
| dadi | Dadi | Hindi हिंदी | Orus |
| ammamma | Ammamma | Telugu తెలుగు | Zephyr |
| aaji | Aaji | Marathi मराठी | Autonoe |
| dida | Dida | Bengali বাংলা | Umbriel |

---

## Phase 0 — Landing Page & Character Selection ✅ DONE

- Ambient landing page: Framer Motion floating elements (stars, sparkles, clouds), background music, Gemini branding, single "Begin Your Adventure" CTA
- `CharacterSelect`: 5 English + 5 Indian storytellers in two rows with Indian Languages divider
- PNG character portraits (replaced planned SVGs)
- Screen transitions: fade-out on select, fade-in on story screen
- Back navigation throughout

See `PHASE_0_CHARACTER_SELECTION.md` for details.

---

## Phase 1 — Live Audio Backend ✅ DONE

- FastAPI WebSocket endpoint `/ws/story`
- Bidirectional proxy: browser ↔ Gemini Live API
- GCP OAuth2 auth server-side (credentials never leave backend)
- Character config loaded from `characters.py` by `character_id`
- Full Gemini Live setup: system prompt, voice, affective dialog, VAD, proactive audio
- "Begin!" trigger sent after setup to start proactive character speech
- Graceful teardown on disconnect from either side
- `POST /api/image`: two-stage pipeline (Flash Lite scene extraction → Gemini image gen)
- React SPA served via `FileResponse` catch-all in `main.py`

See `PHASE_1_LIVE_API_BACKEND.md` for details.

---

## Phase 2 — Frontend Audio Pipeline ✅ DONE

- `capture.worklet.js`: Float32 → Int16, 16kHz, 1024-sample chunks → base64 → WebSocket
- `playback.worklet.js`: FIFO queue, Int16 → Float32, 24kHz, instant clear on interrupt
- `useLiveAPI` hook: full session state machine (`idle → connecting → ready → active → ended`)
- Barge-in: child interrupts at any time, Gemini VAD handles it natively
- Real-time audio visualiser on mic and playback streams

See `PHASE_2_AUDIO_STREAMING.md` for details.

---

## Phase 3 — Story Scene Images ✅ DONE

- Image trigger fires at `turnComplete` with full accumulated turn text (100–300 words)
- Client-side visual keyword pre-filter (EN / Tamil / Hindi / Telugu / Marathi / Bengali)
- Rate limit: 1 image per 8 seconds, 8 images max per session, 20s startup delay
- `POST /api/image` → Flash Lite extracts specific English visual scene → Gemini 3.1 generates image
- Character continuity: negative prompts + reference image passed for scene-to-scene consistency
- `StorySceneGrid`: horizontally scrollable, shimmer skeleton → fade-in

See `PHASE_3_STORY_VISUALIZATION.md` for details.

---

## Phase 4 — Characters & UI ✅ DONE

- `StoryScreen`: 1/5 character portrait panel + 4/5 scene canvas
- PNG portraits for all 10 story characters
- `characterState` label: idle / thinking / speaking / listening
- `AudioVisualizer`: real-time waveform
- Ambient landing page with `FloatingElements` and `MuteButton`

**Not built (deferred):**
- Rive/Lottie animated avatars (breathing, lip-sync, state animations)
- Character hover animations on selection cards

See `PHASE_4_CHARACTER_ANIMATION.md` for details.

---

## Phase 5 — Study Mode ⏸ DEFERRED

Study mode removed from active scope. The 4 educational characters (Count Cosmo, Dr. Luna,
Professor Pip, Arty) are documented in README as a future plan.

Original plan covered:
- `StudyScreen` with single concept image panel (vs scrollable grid)
- Green/teal visual theme
- Prompt Q&A cadence — character asks questions, waits for child's answer
- End-of-session summary card generated by Gemini

See `PHASE_5_STORY_INTELLIGENCE.md` for full details when revisited.

---

## Phase 6 — Deployment & Production Hardening ✅ DONE

- Cloud Run service: `https://taleweaver-950758825854.us-central1.run.app`
- Multi-stage Dockerfile: `node:22-slim` builds React → `python:3.13-slim` serves both
- Cloud Build CI/CD via `cloudbuild.yaml` — auto-deploys on push to `main`
- `GEMINI_API_KEY` in GCP Secret Manager, injected at runtime via `--update-secrets`
- CORS locked to Cloud Run URL + localhost dev ports
- 15-minute WebSocket session timeout
- Same-origin frontend/backend — no CORS issues in production

See `PHASE_6_DEPLOYMENT.md` for details.

---

## End-to-End Session Flow

```
Child opens app → Landing page (ambient music, floating animations)
    → "Begin Your Adventure" → CharacterSelect
    → selects a character → StoryScreen mounts
    → "Begin the Story!"
    → useLiveAPI.connect()
        → WebSocket → backend /ws/story
        → backend: load character config
        → backend: get GCP OAuth2 token
        → backend: connect to Gemini Live API
        → backend: send setup (system prompt + voice + affective dialog + VAD)
        → backend: send "Begin!" client_content turn
        → Gemini: setupComplete
        → frontend: sessionState = "active"
        → mic capture starts (16kHz PCM via AudioWorklet)

Story begins
    → Gemini proactively speaks the story opening
    → backend proxies audio chunks → browser playback worklet → speakers
    → outputTranscription chunks accumulate in outputTextAccRef
    → turnComplete fires → full turn text sent to useStoryImages
    → keyword pre-filter passes (story contains visual words)
    → 8s rate check passes → POST /api/image
    → backend: Flash Lite extracts scene → Gemini 3.1 Flash Image generates
    → base64 image returned → StorySceneGrid: shimmer → fade-in

Child interrupts
    → VAD detects speech → Gemini sends interrupted signal
    → playback buffer cleared, characterState = "listening"
    → child's audio streamed to Gemini in real time
    → Gemini weaves child's words into the story
    → new audio chunks → new turn → new image triggered
```

---

## What Remains

| Item | Priority | Notes |
|---|---|---|
| Character animations (Rive/Framer Motion) | High | Biggest visual upgrade — portraits react to speaking/listening/thinking |
| Study mode | Medium | Deferred — 4 chars exist, need distinct UI + prompt tuning |
| Backend rate limit on `/api/image` | Low | Frontend throttles at 8s; Gemini API is secondary backstop |
| GCP token refresh for long sessions | Low | Reconnect Gemini WS with fresh token after 50 min |
| Custom domain | Optional | Cloud Run domain mapping → `taleweaver.app` |
