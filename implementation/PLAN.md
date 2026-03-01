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
│       ├── App.tsx                   # Router: landing | story-select | theme-select | story
│       ├── characters/index.ts       # 10 character definitions (PNG portraits)
│       ├── assets/characters/        # 10 PNG character portraits
│       ├── screens/
│       │   ├── LandingPage.tsx       # Ambient landing: CTA, Gemini branding, music
│       │   ├── CharacterSelect.tsx   # 5 English + 5 Indian rows with divider
│       │   ├── ThemeSelect.tsx       # Theme/camera/sketch picker (between char select + story)
│       │   └── StoryScreen.tsx       # Live session: animated portrait + scene canvas
│       ├── components/
│       │   ├── FloatingElements.tsx  # Framer Motion stars/sparkles/clouds
│       │   ├── MuteButton.tsx        # Ambient sound toggle
│       │   ├── StorySceneGrid.tsx    # Scrollable image grid
│       │   ├── StorySceneCard.tsx    # Shimmer → loaded image card
│       │   ├── AudioVisualizer.tsx   # Real-time waveform
│       │   └── StorybookEmpty.tsx    # Empty state illustration
│       └── hooks/
│           ├── useLiveAPI.ts         # WebSocket + AudioWorklet + camera stream state machine
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
- VAD tuned to LOW sensitivity (both start and end) with 2000ms silence window — avoids false triggers in children's home environments
- "Begin!" trigger sent after setup with explicit theme instruction to start proactive character speech
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
- **Per-state Framer Motion animations** on portrait:
  - `idle`: slow breathing scale (4s, easeInOut)
  - `thinking`: side-to-side sway starting at 0° + floating 💭 bubble
  - `speaking`: fast scale pulse (0.45s) + 3 expanding sound-wave rings
  - `listening`: gentle vertical bob (2.5s, cyan border)
- Border colour cycles per state: gold/40 → violet/60 → gold → cyan/70
- `key={characterState}` on portrait ensures clean Framer Motion remount on state change (no jerk)
- `AudioVisualizer`: real-time waveform
- Ambient landing page with `FloatingElements` and `MuteButton`
- Speaking indicator bars below portrait when speaking

**Still deferred:**
- Rive/Lottie animated avatars with lip-sync tied to audio amplitude (see Stretch Goal 10)

See `PHASE_4_CHARACTER_ANIMATION.md` for details.

---

## Phase 4.5 — Theme Selection ✅ DONE

A new screen inserted between `CharacterSelect` and `StoryScreen`.

**Three options:**

| Option | Status | Behaviour |
|---|---|---|
| Pick a Theme | ✅ Done | Grid of 12 themed tiles (Animals, Space, Kingdoms, Ocean…) + free-text custom input |
| Magic Camera | ✅ Done | Live camera viewfinder with scan-line + corner reticles; captures a still, sends as `inline_data` to Gemini to inspire story |
| Sketch a Theme | 🔒 Coming soon | Locked placeholder |

**Implementation details:**
- `ThemeSelect.tsx`: prop-based navigation (no React Router), AnimatePresence accordion expand/collapse
- Camera capture: resized to max 512px JPEG @ 0.75 quality, raw base64 (no `data:` prefix) stored in state
- Theme + prop_image wired through full stack: `App.tsx` → `StoryScreen` → `useLiveAPI` → WebSocket → `proxy.py`
- `proxy.py` sends three-branch `Begin!` turn:
  - `camera_prop` + image → multimodal `inline_data` + strong instruction to centre the object
  - theme set → directive with theme name injected into first sentence instruction
  - no theme → plain `"Begin!"`

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

## Phase 7 — Movement & Vision

### 7.1 Camera Vision (Gemini sees the child) ✅ DONE

Live webcam feed piped into Gemini Live session alongside audio at 1 FPS.

**What it enables:**
- Storyteller reacts to what the child is wearing or doing
- Notices expressions ("You look surprised! Should I slow down?")
- Visual verification for movement challenges (7.2)

**Implementation:**
- `useCameraStream` hook inside `useLiveAPI.ts`
- `getUserMedia({ video: { facingMode: "user" }, audio: false })`
- 1 FPS `setInterval`: canvas resize to max 512px → `toDataURL('image/jpeg', 0.6)` → strip prefix → send via WebSocket as `realtime_input.media_chunks` with `mime_type: "image/jpeg"`
- Camera toggle button in `StoryScreen` left panel (opt-in, off by default) — shows "📷 Share Camera" / "📷 Camera On"
- Mirrored video preview below the button (child sees selfie view; Gemini receives unmirrored frame)
- `disconnect()` calls `stopCamera()` to release tracks

### 7.2 Movement Challenges ("Hero's Tasks") ⬜ PLANNED

Storyteller embeds physical challenges into the narrative and waits for the child to complete them.

**Approach A (prompt-only):** Add movement prompts to character system prompts. No code changes.
**Approach B (vision-verified):** Gemini watches via camera (7.1 ✅ now done) and reacts when it detects movement.

### 7.3 Story Branching (Choice Buttons) ⬜ PLANNED

At key story moments Gemini presents 2–3 choices and the child picks what happens next.

- Gemini calls a `showChoice` tool with `{ options: ["Option A", "Option B"] }`
- Frontend renders tappable choice buttons
- Tapped choice sent back as `client_content` text turn
- Gemini weaves the choice into the continuing story

**Effort:** Low — tool call infra exists, needs a UI component + system prompt change.

### 7.4 Achievements / Badge System ⬜ PLANNED

- Gemini Live calls an `awardBadge` tool at key moments (first jump, story redirect, etc.)
- Frontend shows badge pop-up, persists to `localStorage`

See `STRETCH_GOALS.md` for full stretch goal details.

---

## Phase 8 — Stretch Goals ⬜ FUTURE

See `STRETCH_GOALS.md` for full details. Updated priority order:

| # | Goal | Effort | Impact | Status |
|---|---|---|---|---|
| 1 | Rive animated avatars (lip-sync) | High | Very High | ⬜ Framer Motion done; Rive deferred |
| 2 | Interactive story choices (7.3) | Medium | High | ⬜ Planned |
| 3 | Life skills themes | Low | High | ⬜ Not started |
| 4 | Story gallery (localStorage) | Low | Medium | ⬜ Not started |
| 5 | Tool calling during live story | High | High | ⬜ Not started |
| 6 | Cloud Storage for images | Medium | Medium | ⬜ Not started |
| 7 | Badge system (7.4) | Medium | Medium | ⬜ Planned |
| 8 | uv package manager | Low | Low | ⬜ pyproject.toml + uv.lock exist |
| 9 | Multi-agent ADK pipeline | Very High | Medium | ⬜ Not started |
| 10 | OpenTelemetry observability | Medium | Low | ⬜ Not started |

---

## End-to-End Session Flow

```
Child opens app → Landing page (ambient music, floating animations)
    → "Begin Your Adventure" → CharacterSelect
    → selects a character → ThemeSelect
        Option A: Pick a theme tile (Animals / Space / Ocean…) or type custom
        Option B: Magic Camera — capture prop photo → confirms image
        Option C: Sketch (locked/coming soon)
    → "Begin the Story!" → StoryScreen mounts

    → useLiveAPI.connect()
        → WebSocket → backend /ws/story
        → backend: load character config
        → backend: get GCP OAuth2 token
        → backend: connect to Gemini Live API
        → backend: send setup (system prompt + voice + affective dialog + VAD LOW)
        → backend: send "Begin!" client_content turn (with theme or prop image)
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
    → VAD (LOW sensitivity, 2000ms silence) detects speech → Gemini sends interrupted signal
    → playback buffer cleared, characterState = "listening"
    → child's audio streamed to Gemini in real time
    → Gemini weaves child's words into the story
    → new audio chunks → new turn → new image triggered

Optional: Camera sharing
    → child taps "📷 Share Camera" → getUserMedia(video)
    → 1 FPS JPEG frames sent as realtime_input.media_chunks
    → Gemini reacts to what it sees ("Oh, you're wearing a red jumper!")
```

---

## What Remains

| Item | Priority | Notes |
|---|---|---|
| 7.2 Movement Challenges | High | Needs Approach B (vision) — camera is now live |
| 7.3 Story Branching | High | showChoice tool + UI component |
| 7.4 Badge System | Medium | awardBadge tool + pop-up UI |
| Rive lip-sync avatars | Medium | Highest visual impact but high effort |
| Study mode | Low | Deferred — 4 chars exist, need distinct UI + prompt tuning |
| GCP token refresh (50min+) | Low | Reconnect Gemini WS with fresh token for long sessions |
| Custom domain | Optional | Cloud Run domain mapping → `taleweaver.app` |
