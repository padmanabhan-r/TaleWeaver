# Changelog

All notable changes to TaleWeaver are documented here.

---

## [Unreleased]

### Added
- `.github/workflows/deploy.yml` — GitHub Actions auto-deploy on push to `main` (needs `GCP_SA_KEY` secret to activate)

### Planned
- Rename Cloud Run service from `taleweaver-backend` → `taleweaver`
- Backend rate limiting on `/api/image`
- Tighten CORS to Cloud Run URL
- Character avatar animations (Rive/Lottie)

---

## [0.3.0] — 2026-02-26

### Added
- **Landing page** (`LandingPage.tsx`) — ambient landing with floating elements, rainbow title
- **3 new Indian story characters** — Ammamma (Telugu, voice: Zephyr), Aaji (Marathi, voice: Autonoe), Dida (Bengali, voice: Umbriel)
- **Full app routing** — screens: `landing | story-select | story` with back navigation
- **7 new SVG portraits** — Ammamma, Aaji, Dida, and updated English characters
- Visual keyword dictionary extended to Telugu, Marathi, Bengali for image trigger pre-filter
- Browser tab: `<title>TaleWeaver</title>` + book emoji favicon

### Changed
- `CharacterSelect` now shows 10 story characters in **two rows of 5** with 🇮🇳 Indian Languages divider
- Rolling story context extended from 600 → 2000 chars
- Image payload to backend extended from 400 → 2000 chars

### Fixed
- **Image quality** — images now fire at `turnComplete` with full turn text instead of a 20-word mid-sentence fragment; images now match the actual story being told
- Removed `>= 10 words` bypass in `useStoryImages` that allowed garbage through the keyword filter

---

## [0.2.0] — 2026-02-20

### Added
- **Story scene image generation** (`useStoryImages` hook + `POST /api/image` endpoint)
- Two-stage image pipeline: `gemini-2.0-flash-lite` extracts English visual scene → `imagen-3.0-fast-generate-001` generates image
- `StorySceneGrid` + `StorySceneCard` components with shimmer skeleton → fade-in transition
- `StorybookEmpty` placeholder illustration
- Client-side visual keyword pre-filter (English + Tamil + Hindi)
- 30-second rate limit, 20-second session startup delay, 8-image cap per session
- `IMAGE_MODEL` env var to switch between Imagen and Gemini image models
- 429 (rate limit) handling: silently discard card, reset timer for immediate retry next turn

### Changed
- `image_gen.py` refactored: separate `_generate_imagen()` and `_generate_gemini()` paths
- Scene extraction prompt improved for painter-level specificity

---

## [0.1.0] — 2026-02-14

### Added
- **5 Indian story characters** — Paati (Tamil, voice: Leda), Dadi (Hindi, voice: Orus), and placeholders for Telugu/Marathi/Bengali
- **5 SVG portraits** for Indian grandmother characters
- Indian Languages section divider in `CharacterSelect`
- Character-specific image styles for all Indian characters (watercolor, regional art styles)

---

## [0.0.1] — 2026-02-10

### Added
- **FastAPI backend** with WebSocket endpoint `/ws/story`
- **Bidirectional proxy** (`proxy.py`) — browser ↔ Gemini Live API
- **GCP OAuth2 authentication** — server-side only, credentials never sent to browser
- **5 English story characters** — Grandma Rose, Captain Leo, Fairy Sparkle, Professor Whiz, Dragon Blaze — each with unique voice, system prompt, and image style
- **`capture.worklet.js`** — AudioWorklet mic capture at 16kHz PCM
- **`playback.worklet.js`** — AudioWorklet speaker playback at 24kHz PCM, FIFO queue, barge-in clear
- **`useLiveAPI` hook** — full session state machine, barge-in handling, transcription accumulation
- **`CharacterSelect` screen** — character cards with gradient backgrounds, hover lift, selection ring, dismiss animation
- **`CharacterPortrait`** — SVG portraits for 5 English characters
- **`StoryScreen`** — live session UI with portrait panel, audio visualiser, scene area
- **`AudioVisualizer`** — real-time amplitude waveform
- Gemini Live session config: affective dialog, VAD, proactive audio, input/output transcription
- "Begin!" trigger sent after setup to start proactive character speech
- Graceful session teardown on disconnect from either side
- `GET /api/health` endpoint
- Dockerfile + `requirements.txt`
- Vite + React 18 + TailwindCSS v3 + TypeScript frontend scaffold
