# Changelog

All notable changes to TaleWeaver are documented here.

---

## [1.0.0] — 2026-03-13

### Added

- **Magic Camera** — child holds up any toy or object, Gemini recognises it, speaks its name aloud in the character's voice, recreates it as a storybook illustration, and makes it the hero of the story
- **Sketch a Theme** — 19-colour drawing canvas; child's sketch is labelled by Gemini, spoken aloud, and recreated as a storybook illustration before the story starts
- **Gemini-controlled illustration timing** — `generate_illustration` tool call lets the model decide the right visual moment and write its own scene description; no extraction step required
- **Visual continuity** — each scene illustration is generated with the previous image as a reference, keeping characters and art style consistent across the whole session
- **Fallback illustration** — if no illustration has been triggered in ~25 s, one is generated from the last narration fragment automatically
- **Achievement badges** — Gemini awards a creativity badge (max 2 per session) when the child contributes a genuine creative idea; badge appears on screen and auto-dismisses after 3 s
- **Story recap storybook** — at session end, all session images are sent to `gemini-2.5-flash-lite` which generates a storybook title and per-scene narrations in parallel; rendered as a scrollable storybook
- **Past Adventures gallery** — all completed stories saved to `localStorage`; accessible from the landing page; tap any card to re-read the full storybook
- **Per-story delete** — individual delete button on each gallery card (previously only "Clear All" existed)
- **Pause / Resume** — mutes playback and suspends mic capture mid-story; WebSocket and session stay alive; resume restores both
- **Content safety filter** — `gemini-2.5-flash-lite` checks every custom theme, Magic Camera photo, and sketch before the story starts; inappropriate content is blocked with a friendly redirect
- **Character TTS** — `gemini-2.5-flash-preview-tts` speaks the toy/sketch label aloud in the character's own voice on ThemeSelect, using the same voice as the Live session
- **Language-locked characters** — all 10 characters now stay in their own language unconditionally; English characters never switch to another language; world-language characters never switch to English
- **Life skills themes** — Sharing, Courage, Gratitude, Creativity, Kindness added as selectable story themes
- **Session transcript logging** — full story events (speech, tool calls, interruptions) saved to `backend/transcripts/` after each session
- **15-minute session timeout** — idle sessions close automatically with a clean teardown
- **Graceful Cloud Run shutdown** — SIGTERM handled cleanly within the 30 s grace window
- **`POST /api/tts`** — new endpoint for character TTS generation
- **`POST /api/check-theme`** — new endpoint for content safety checks
- **`POST /api/sketch-preview`** — new endpoint for sketch/camera label + illustration

### Changed

- Image generation pipeline simplified — Gemini writes the scene description directly via tool call; no separate extraction model call needed for tool-triggered images
- `gemini-2.0-flash-preview-image-generation` → `gemini-3.1-flash-image-preview` for scene illustrations
- Safety filter prompt rewritten as a structured explicit block-list with "when in doubt, mark UNSAFE" default — previously marked "guns and knives" as safe
- Badge awarding criteria loosened — "when in doubt, DO award"; previously the model was too conservative
- Character system prompts hardened with absolute language-lock rules; removed "switch to match child" behaviour
- Story recap now reuses session images — no new images generated during recap
- Cloud Build CI/CD replaces GitHub Actions — push to `main` triggers build → Artifact Registry → Cloud Run deploy
- Single Cloud Run service now serves both API and compiled React frontend as static files

### Fixed

- **Gallery save race condition** — gallery was saving before all images had loaded, resulting in entries with no images; fixed with a reactive `useEffect` that re-saves as each image finishes loading
- **Recap image save** — `onRecapGenerated` now calls `saveToGallery` before `updateGalleryEntry` so recap always includes all loaded images
- **Content warning persistence** — warning from a custom theme no longer persists when switching to a preset theme tile
- **Session start first-frame drop** — `await asyncio.sleep(0)` added before sending "Begin!" so both proxy tasks are blocking on `recv()` before Gemini's first audio frame arrives
- **Camera mirror** — front camera preview mirrored correctly; capture canvas flipped only for front camera

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
