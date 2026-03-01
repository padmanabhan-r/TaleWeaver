# TaleWeaver — Interactive Storytelling for Kids
### Build Plan (updated 1 Mar 2026)

---

## Overview

A voice-driven, kid-friendly web app where a child talks with a beloved storyteller character
and listens to a live, improvised story — with AI-generated illustrations appearing as the
tale unfolds.

**Live:** https://taleweaver.online

**Key differentiator:** Gemini Live native audio API — true bidirectional conversation,
the child can interrupt, redirect, or react at any moment. Illustrations are generated
asynchronously against the live story context so images actually match what's being told.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Conversation | `gemini-live-2.5-flash-native-audio` via Vertex AI |
| Scene extraction / safety | `gemini-2.0-flash-lite` |
| Image generation | `gemini-2.0-flash-preview-image-generation` via Gemini API key |
| Backend | Python 3.13 + FastAPI + google-genai SDK |
| Transport | WebSocket (bidirectional proxy: browser ↔ backend ↔ Gemini Live) |
| Frontend | React 19 + Vite + TailwindCSS v4 + TypeScript + Framer Motion |
| Audio I/O | Web Audio API + AudioWorklet (16kHz capture, 24kHz playback) |
| Auth | GCP Application Default Credentials (Vertex AI) + Gemini API key (image gen) |
| Hosting | Cloud Run — single service, frontend embedded in Python container |
| CI/CD | Google Cloud Build — `cloudbuild.yaml`, triggers on push to `main` |
| Domain | taleweaver.online (custom domain mapped to Cloud Run) |

---

## Repository Structure

```
/
├── backend/
│   ├── main.py            # FastAPI: /ws/story, /api/image, /api/check-theme, /api/sketch-preview, SPA catch-all
│   ├── proxy.py           # Bidirectional WS proxy: browser ↔ Gemini Live (15min timeout)
│   ├── characters.py      # 10 character configs: system prompts, voices, image styles, tool declarations
│   ├── image_gen.py       # /api/image, /api/sketch-preview, /api/check-theme — scene extraction + safety + image gen
│   └── requirements.txt
├── frontend/
│   ├── public/audio-processors/
│   │   ├── capture.worklet.js   # 16kHz PCM mic capture
│   │   └── playback.worklet.js  # 24kHz PCM speaker playback
│   └── src/
│       ├── App.tsx                   # Router: landing | character-select | theme-select | story
│       ├── characters/index.ts       # 10 character definitions (PNG portraits)
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
└── implementation/        # Phase plans and architecture docs
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
- VAD tuned to LOW sensitivity (both start and end) with 2000ms silence window
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

- Image trigger fires at `turnComplete` with full accumulated turn text
- Rate limit: configurable (default 10s), **no scene cap** — images generated for entire session
- `POST /api/image` → Flash Lite extracts specific English visual scene → Gemini generates image
- Visual continuity: reference image + continuity instructions keep characters consistent across scenes
- 8-second session startup delay before first image
- `StorySceneGrid`: horizontally scrollable, shimmer skeleton → fade-in
- 429 rate-limit handling: silently discard, reset timer so next turn can retry

See `PHASE_3_STORY_VISUALIZATION.md` for details.

---

## Phase 4 — Characters & UI ✅ DONE

- `StoryScreen`: 1/5 character portrait panel + 4/5 scene canvas
- PNG portraits for all 10 story characters
- **Per-state Framer Motion animations** on portrait:
  - `idle`: slow breathing scale (4s, easeInOut)
  - `thinking`: side-to-side sway + floating 💭 bubble
  - `speaking`: fast scale pulse (0.45s) + 3 expanding sound-wave rings
  - `listening`: gentle vertical bob (2.5s, cyan border)
- Border colour cycles per state: gold/40 → violet/60 → gold → cyan/70
- `key={characterState}` on portrait ensures clean Framer Motion remount on state change
- `AudioVisualizer`: real-time waveform
- Ambient landing page with `FloatingElements`

**Still deferred:**
- Rive/Lottie animated avatars with lip-sync tied to audio amplitude (see Stretch Goal 10)

See `PHASE_4_CHARACTER_ANIMATION.md` for details.

---

## Phase 4.5 — Theme Selection ✅ DONE

A screen inserted between `CharacterSelect` and `StoryScreen`.

**Three options:**

| Option | Status | Behaviour |
|---|---|---|
| Pick a Theme | ✅ Done | Grid of 12 adventure tiles + 5 life skills tiles + free-text custom input |
| Magic Camera | ✅ Done | Live camera viewfinder; captures prop photo → safety check → AI recreates as storybook illustration → confirm & start |
| Sketch a Theme | ✅ Done | Drawing canvas with 19 colours → AI recreates as storybook illustration → confirm & start |

**Implementation details:**
- `ThemeSelect.tsx`: AnimatePresence accordion expand/collapse; `overflow-y-auto` cards container
- Camera capture: resized to max 512px JPEG, base64 stored in state
- Sketch canvas: 19-colour palette, submit sends drawing to `/api/sketch-preview` for AI recreation
- Sequential backend processing for sketch: label extracted first (Flash Lite, 15s timeout), then passed as `subject_hint` to image gen — ensures label matches image
- Theme + prop_image wired through full stack: `App.tsx` → `StoryScreen` → `useLiveAPI` → WebSocket → `proxy.py`
- `proxy.py` sends three-branch `Begin!` turn: camera_prop (multimodal inline_data) / theme name / plain

---

## Phase 4.6 — Content Moderation ✅ DONE

All content entry points (typed theme, camera prop, sketch) safety-checked before story starts.

- `_is_safe_for_children(content: str) -> bool` — Flash Lite classifier, 6s timeout, fails open
- Blocks: violence, weapons, blood, death, horror, adult/sexual, drugs, hate speech, self-harm, war, terrorism
- `/api/check-theme` endpoint for typed custom themes
- Safety check runs after label extraction in `/api/sketch-preview`; raises HTTP 400 `unsafe_content` if unsafe
- Frontend shows friendly "🚫 That theme isn't available" message with suggestion to try something else
- Camera preview shows 🚫 with explanation when unsafe content detected

---

## Phase 5 — Study Mode ⏸ DEFERRED

Study mode removed from active scope.

See `PHASE_5_STORY_INTELLIGENCE.md` for full details when revisited.

---

## Phase 6 — Deployment & Production Hardening ✅ DONE

- Cloud Run service: `https://taleweaver-950758825854.us-central1.run.app`
- Custom domain: **https://taleweaver.online** (mapped via GCP Cloud Run domain mapping)
- Multi-stage Dockerfile: `node:22-slim` builds React → `python:3.13-slim` serves both
- Cloud Build CI/CD via `cloudbuild.yaml` — auto-deploys on push to `main`
- `GEMINI_API_KEY` in GCP Secret Manager, injected at runtime via `--update-secrets`
- CORS locked to taleweaver.online, www.taleweaver.online, Cloud Run URL, localhost dev ports
- 15-minute WebSocket session timeout

See `PHASE_6_DEPLOYMENT.md` for details.

---

## Phase 7 — Engagement & Vision

### 7.1 Camera Vision (Gemini sees the child) ✅ DONE

Live webcam feed piped into Gemini Live session alongside audio at 1 FPS.

- `useCameraStream` hook inside `useLiveAPI.ts`
- 1 FPS: canvas resize to max 512px → JPEG → WebSocket `realtime_input.media_chunks`
- Camera toggle in `StoryScreen` left panel (opt-in, off by default)
- Mirrored video preview for child; Gemini receives unmirrored frame

### 7.2 Movement Challenges ("Hero's Tasks") ⬜ PLANNED

Storyteller embeds physical challenges into the narrative; Gemini watches via camera (7.1 ✅) and reacts when it detects movement.

### 7.3 Story Branching (Choice Buttons) ✅ DONE

At key story moments Gemini presents 2–3 choices the child picks from.

- Gemini calls `showChoice` tool with `{ options: ["…", "…"] }`
- `pendingChoiceRef` pattern: queues tool call result, dispatches 700ms after `turnComplete` (ensures audio drains before overlay appears)
- `ChoiceOverlay` renders at top of scene canvas — tappable buttons
- Child taps OR speaks any response → overlay dismisses
- `answerChoice` sends both `toolResponse` + `client_content` so Gemini resumes immediately
- `onChildSpoke` callback fires on `sc.interrupted` or `sc.inputTranscription.finished` → clears overlay
- System prompt: `showChoice` called AT MOST ONCE per session

### 7.4 Achievement / Badge System ✅ DONE

- Gemini calls `awardBadge` tool for genuine creative contributions
- `BadgePopup` appears centred on screen, auto-dismisses after 3s
- Criteria: child suggests story ideas, picks brave/creative options, does a physical challenge, chooses to end the story
- Explicitly prohibited: turning on camera, random movement, being quiet, just joining the session

---

## Phase 8 — Stretch Goals ⬜ FUTURE

See `STRETCH_GOALS.md` for full details.

| # | Goal | Effort | Impact | Status |
|---|---|---|---|---|
| 1 | Rive animated avatars (lip-sync) | Very High | Very High | ⬜ Framer Motion covers it for now |
| 2 | Tool calling pipeline (server-side image trigger) | High | High | ⬜ Not started |
| 3 | Cloud Storage for images (GCS signed URLs) | Medium | Medium | ⬜ Not started |
| 4 | Story Gallery (past sessions) | Low | Medium | ⬜ Deferred |
| 5 | Multi-agent ADK pipeline | Very High | Medium | ⬜ Not started |
| 6 | OpenTelemetry observability | Medium | Low | ⬜ Not started |
| 7 | uv package manager | Low | Low | ⬜ pyproject.toml + uv.lock exist |
| 8 | Study Mode (Phase 5) | High | Medium | ⬜ Deferred |

---

## End-to-End Session Flow

```
Child opens app → Landing page (ambient music, floating animations)
    → "Begin Your Adventure" → CharacterSelect
    → selects a character → ThemeSelect
        Option A: Pick a theme tile (Animals / Space / Ocean… / Life Skills) or type custom
                  → custom text → /api/check-theme safety check
        Option B: Magic Camera — capture prop photo → safety check → AI recreates → confirm
        Option C: Sketch a Theme — draw on canvas → /api/sketch-preview → AI recreates → confirm
    → "Begin the Story!" → StoryScreen mounts

    → useLiveAPI.connect()
        → WebSocket → backend /ws/story
        → backend: load character config
        → backend: connect to Gemini Live API
        → backend: send setup (system prompt + voice + VAD LOW + tools)
        → backend: send "Begin!" client_content turn (with theme or prop/sketch image)
        → Gemini: setupComplete → frontend: sessionState = "active"
        → mic capture starts (16kHz PCM via AudioWorklet)

Story plays
    → Gemini proactively speaks the story opening
    → 24kHz PCM audio chunks → playback worklet → speakers
    → outputTranscription accumulates per turn
    → turnComplete → full turn text → useStoryImages
        → 8s startup delay + 10s rate limit check → POST /api/image
        → Flash Lite extracts scene → Gemini generates image
        → base64 → StorySceneGrid: shimmer → fade-in
        → continues generating until session ends (no scene cap)

Story branching (at most once per session)
    → Gemini calls showChoice tool → stored in pendingChoiceRef
    → turnComplete + 700ms → ChoiceOverlay renders
    → child taps button → toolResponse + client_content sent → Gemini continues
    → OR child speaks → onChildSpoke → overlay dismissed

Achievement badges
    → Gemini calls awardBadge for genuine creative engagement
    → BadgePopup appears centred, auto-dismisses after 3s

Child interrupts
    → VAD detects speech → playback clears, choice overlay dismissed
    → Gemini weaves child's words into the next story beat
```

---

## What Remains

| Item | Priority | Notes |
|---|---|---|
| 7.2 Movement Challenges | Medium | Needs system prompt tuning — camera already live |
| Rive lip-sync avatars | Low | Highest visual impact but very high effort |
| Study mode | Low | 4 chars exist, need distinct UI + prompt tuning |
| Cloud Storage for images | Low | Reduces memory, enables story gallery |
| Story Gallery | Low | Deferred — removed from landing page |
