# TaleWeaver — Interactive Storytelling for Kids
### Build Plan (updated 26 Feb 2026)

---

## Overview

A voice-driven, kid-friendly web app where a child talks with a beloved storyteller character
and listens to a live, improvised story — with AI-generated illustrations appearing as the
tale unfolds. Two modes: **Story Time** (narrative characters) and **Learn & Explore**
(educational characters).

**Challenge category:** Creative Storyteller
**Key differentiator:** Gemini Live native audio API — true bidirectional conversation,
the child can interrupt, redirect, or react at any moment. Illustrations are generated
asynchronously against the live story context, so images actually match what's being told.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Conversation model | `gemini-live-2.5-flash-native-audio` via Vertex AI (Gemini Live WebSocket API) |
| Image extraction | `gemini-2.0-flash-lite` (scene description extraction, any language → English) |
| Image generation | `imagen-3.0-fast-generate-001` (env-selectable via `IMAGE_MODEL`) |
| Backend | Python 3.12 + FastAPI + google-genai SDK |
| Transport | WebSocket (bidirectional proxy: browser ↔ backend ↔ Gemini Live) |
| Frontend | React 18 + Vite + TailwindCSS v3 + TypeScript |
| Audio I/O | Web Audio API + custom AudioWorklet (16kHz capture, 24kHz playback) |
| Auth | Application Default Credentials / GCP service account (no API key exposure) |
| Hosting | Cloud Run (backend + frontend served from same service) |

---

## Repository Structure

```
/
├── backend/
│   ├── main.py            # FastAPI app — /ws/story, /api/image, /api/health, SPA catch-all
│   ├── proxy.py           # Bidirectional WS proxy: browser ↔ Gemini Live API
│   ├── characters.py      # 14 character configs (system prompts, voices, image styles)
│   ├── image_gen.py       # POST /api/image — scene extraction + image generation
│   ├── scene_detector.py  # DEAD CODE — never imported, safe to delete
│   ├── Dockerfile         # (old, backend-only — superseded by root Dockerfile)
│   └── requirements.txt
├── frontend/
│   ├── index.html         # Title: TaleWeaver, book emoji favicon, Google Fonts
│   ├── public/
│   │   └── audio-processors/
│   │       ├── capture.worklet.js   # 16kHz PCM mic capture
│   │       └── playback.worklet.js  # 24kHz PCM speaker playback
│   └── src/
│       ├── App.tsx                        # Router: landing | story-select | story | study-select | study
│       ├── characters/index.ts            # 14 character definitions (+ isStudy flag)
│       ├── screens/
│       │   ├── LandingPage.tsx            # Mode selector (Story / Study)
│       │   ├── CharacterSelect.tsx        # 5 English + 5 Indian chars (two rows with divider)
│       │   ├── StudyCharacterSelect.tsx   # 4 study chars (2×2 grid)
│       │   └── StoryScreen.tsx            # Live session UI (portrait, visualiser, scenes)
│       ├── components/
│       │   ├── CharacterPortrait.tsx      # Hand-crafted SVG for all 14 characters
│       │   ├── StorySceneGrid.tsx         # Image grid panel
│       │   ├── StorySceneCard.tsx         # Single scene card (shimmer → image)
│       │   ├── AudioVisualizer.tsx        # Real-time amplitude waveform
│       │   └── StorybookEmpty.tsx         # Empty state illustration
│       └── hooks/
│           ├── useLiveAPI.ts              # WebSocket + AudioWorklet orchestration
│           └── useStoryImages.ts          # Image trigger, scene context, rate limiting
├── Dockerfile             # Multi-stage: Node builds frontend, Python serves both
├── .dockerignore
├── .github/
│   └── workflows/
│       └── deploy.yml     # Auto-deploy to Cloud Run on push to main (needs GCP_SA_KEY secret)
├── implementation/
│   └── PLAN.md            # This file
└── .gitignore
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

### Study Mode (4)

| ID | Name | Subject | Voice |
|---|---|---|---|
| count-cosmo | Count Cosmo | Maths | Puck |
| dr-luna | Dr. Luna | Science & Nature | Kore |
| professor-pip | Professor Pip | Words & Reading | Aoede |
| arty | Arty | Art & Colours | Fenrir |

---

## Phase 0 — Landing Page & Character Selection ✅ DONE

- Kid-friendly landing page: Story Time / Learn & Explore mode cards
- `CharacterSelect`: 5 English + 5 Indian storytellers in two rows with 🇮🇳 Indian Languages divider
- `StudyCharacterSelect`: 4 study characters in 2×2 grid
- Full App.tsx routing: `landing | story-select | story | study-select | study`
- Back navigation throughout
- Character cards: gradient backgrounds, hover lift, selection pulse ring, dismiss animation
- `CharacterPortrait`: 14 hand-crafted SVG portraits
- Screen transitions: fade-out on character select, fade-in on story screen
- Browser tab: `<title>TaleWeaver</title>` + book emoji favicon

See `PHASE_0_CHARACTER_SELECTION.md` for details.

---

## Phase 1 — Live Audio Backend ✅ DONE

- FastAPI WebSocket endpoint `/ws/story`
- Bidirectional proxy: browser ↔ Gemini Live API
- GCP OAuth2 auth server-side (credentials never leave backend)
- Character config loaded from `characters.py` by `character_id`
- Full Gemini Live setup: system prompt, voice, affective dialog, activity detection, proactive audio
- "Begin!" trigger sent after setup to start proactive character speech
- Graceful teardown on disconnect from either side
- `POST /api/image`: two-stage pipeline (Gemini Flash Lite scene extraction → Imagen)
- Frontend SPA served via `FileResponse` catch-all in `main.py`

See `PHASE_1_LIVE_API_BACKEND.md` for details.

---

## Phase 2 — Frontend Audio Pipeline ✅ DONE

- Custom AudioWorklet (`capture.worklet.js`) captures mic at 16kHz PCM
- Chunks base64-encoded and sent over WebSocket as `realtime_input.media_chunks`
- Playback worklet (`playback.worklet.js`) queues 24kHz PCM chunks, supports interrupt/clear
- AudioContext manages capture (16kHz) and playback (24kHz) separately
- `useLiveAPI` hook manages full session state machine:
  `idle → connecting → ready → active (idle/thinking/speaking/listening) → ended`
- Barge-in: child can interrupt at any time (Gemini handles VAD)
- Real-time audio visualiser on both mic and playback streams

See `PHASE_2_AUDIO_STREAMING.md` for details.

---

## Phase 3 — Story Scene Images ✅ DONE

**Pipeline:**
1. Character speech accumulates in `outputTextAccRef` (useLiveAPI)
2. On `turnComplete`: full turn text (100–300 words) sent to `useStoryImages`
3. Client-side keyword pre-filter (visual words in EN/Tamil/Hindi/Telugu/Marathi/Bengali)
4. 30-second rate limit + 20-second session startup delay + 8 image cap
5. `POST /api/image { scene_description, story_context, image_style, session_id }`
6. Backend: `gemini-2.0-flash-lite` extracts specific English visual scene from narration
   — forced to be painter-specific: exact character, exact setting, exact moment
7. Safety prefix + character image style + extracted scene → image model
8. Returned as base64, displayed in `StorySceneGrid` with shimmer → fade-in transition

**Key fix (Feb 2026):** Previously fired at 20 words mid-turn (incomplete fragment).
Now fires at `turnComplete` with full turn text. Story context extended to 2000 chars.

See `PHASE_3_STORY_VISUALIZATION.md` for details.

---

## Phase 4 — Characters & UI ✅ DONE

- Landing page with Story Time / Learn & Explore mode cards
- `CharacterSelect`: two rows of 5 with Indian Languages divider
- `StudyCharacterSelect`: 4 study characters in 2×2 grid
- `StoryScreen`: portrait + audio visualiser + scene grid
- `CharacterPortrait`: 14 hand-crafted SVG portraits (static — no animation yet)
- Screen transitions: fade-out on select, fade-in on story

See `PHASE_4_CHARACTER_ANIMATION.md` for details.

---

## Phase 5 — Study Mode ⏸ DEFERRED

Study mode removed from active scope. The 4 educational characters (Count Cosmo, Dr. Luna,
Professor Pip, Arty) are documented in README as future plans. App is Story Time only.

See `PHASE_5_STORY_INTELLIGENCE.md` for the original plan when this is revisited.

---

## Phase 6 — Deployment & Production Hardening ✅ DONE

- Cloud Run service live: `https://taleweaver-950758825854.us-central1.run.app`
- Multi-stage Dockerfile: `node:22-slim` builds React → `python:3.13-slim` serves both
- **Cloud Build** CI/CD via `cloudbuild.yaml` — auto-deploys on every push to `main`
- `GEMINI_API_KEY` stored in Secret Manager, injected into Cloud Run at runtime
- Image model: `gemini-3.1-flash-image-preview` via Gemini API key (shorter rate limit intervals)
- Frontend same-origin fallbacks — no env vars needed in production

### Remaining ⬜ (low priority)
- Tighten CORS from `*` to Cloud Run URL
- Delete dead code: `backend/scene_detector.py`
- Backend rate limit on `/api/image`
- WebSocket session timeout (15 min idle)
- GCP token refresh for sessions > 50 min

See `PHASE_6_DEPLOYMENT.md` for details.

---

## End-to-End Session Flow

```
Child opens app → Landing page
    → taps "Let's Go!" → CharacterSelect
    → selects Grandma Rose → StoryScreen mounts
    → taps "Begin the Story!"
    → useLiveAPI.connect()
        → WebSocket → backend /ws/story
        → backend: load grandma-rose character config
        → backend: get GCP OAuth2 token
        → backend: connect to Gemini Live API
        → backend: send setup (system prompt + Aoede voice + all config)
        → backend: send "Begin!" client_content turn
        → Gemini: setupComplete
        → frontend: sessionState = "active"
        → mic capture starts (16kHz PCM via AudioWorklet)

Story begins
    → Gemini proactively speaks the story opening
    → backend proxies audio chunks → browser playback worklet
    → outputTranscription chunks accumulate in outputTextAccRef
    → turnComplete fires → full turn text sent to useStoryImages
    → keyword pre-filter passes (story contains visual words)
    → 30s rate check passes → POST /api/image
    → backend: Gemini Flash Lite extracts scene → Gemini 3.1 Flash Image generates
    → base64 image returned → StorySceneGrid: shimmer → fade-in

Child interrupts
    → VAD detects speech → Gemini sends interrupted signal
    → playback buffer cleared, characterState = "listening"
    → child's audio streamed to Gemini in real time
    → Gemini responds, weaving child's words into the story
    → new audio chunks → new turn → new image triggered
```

---

## Known Issues / Tech Debt

| Item | Priority | Notes |
|---|---|---|
| `scene_detector.py` never imported | Low | Dead code, safe to delete |
| CORS `allow_origins=["*"]` | Medium | Tighten before public launch |
| No backend rate limit on `/api/image` | Medium | Frontend throttles but backend is open |
| No WebSocket session timeout | Low | Long-idle sessions waste Cloud Run resources |
| GCP token refresh for long sessions | Low | Reconnect Gemini WS with fresh token after 50 min |
