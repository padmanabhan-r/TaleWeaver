# Phase 1 — Live API Backend

## Status: ✅ DONE

---

## What Was Built

### FastAPI App (`backend/main.py`)
- `GET /api/health` → `{"status": "ok"}`
- `POST /api/image` → image generation (via `image_gen.py` router)
- `WebSocket /ws/story` → bidirectional proxy to Gemini Live API
- CORS middleware (currently `allow_origins=["*"]` — to tighten before public launch)
- `GET /` and `GET /{full_path:path}` → serves built React SPA (frontend/dist)

### WebSocket Proxy (`backend/proxy.py`)
- Receives first message `{ "character_id": "..." }` from browser
- Loads character config from `characters.py`
- Obtains GCP OAuth2 Bearer token via Application Default Credentials (server-side only, never sent to browser)
- Connects to Gemini Live API WebSocket (Vertex AI `us-central1`)
- Sends full Gemini setup message: system prompt + voice + affective dialog + VAD + proactive audio
- Waits for `setupComplete` from Gemini, then forwards confirmation to browser
- Sends `"Begin!"` `client_content` turn to trigger proactive character speech
- Runs bidirectional proxy: browser ↔ Gemini Live (transparent forwarding)
- Graceful teardown when either side disconnects

### Character Configs (`backend/characters.py`)
14 characters total:

**Story Mode (10):**
| ID | Name | Language | Voice |
|---|---|---|---|
| grandma-rose | Grandma Rose | English | Aoede |
| captain-leo | Captain Leo | English | Charon |
| fairy-sparkle | Fairy Sparkle | English | Kore |
| professor-whiz | Professor Whiz | English | Puck |
| dragon-blaze | Dragon Blaze | English | Fenrir |
| paati | Paati | Tamil | Leda |
| dadi | Dadi | Hindi | Orus |
| ammamma | Ammamma | Telugu | Zephyr |
| aaji | Aaji | Marathi | Autonoe |
| dida | Dida | Bengali | Umbriel |

All story characters share `SYSTEM_PROMPT_BASE` (STORY VARIETY directive, never fixed openers).

### Image Generation (`backend/image_gen.py`)
- `POST /api/image { scene_description, story_context, image_style, session_id }`
- Two-stage pipeline:
  1. `gemini-2.0-flash-lite` extracts a specific English visual scene (2-3 sentences) from the narration + story context
  2. Extracted scene + safety prefix + character image style → image model
- Model selected via `IMAGE_MODEL` env var (`imagen-3.0-fast-generate-001` in production)
- `_generate_imagen()` for `imagen-*` models, `_generate_gemini()` for Gemini models
- Returns base64 image + MIME type
- 429 handling for Vertex AI rate limiting

### Gemini Live Session Config
```
model: gemini-live-2.5-flash-native-audio
voice: character-specific (Aoede / Charon / Kore / Puck / Fenrir / Leda / Orus / Zephyr / Autonoe / Umbriel)
response_modalities: ["AUDIO"]
enable_affective_dialog: true
input_audio_transcription: enabled
output_audio_transcription: enabled
proactive_audio: true
VAD: silence_duration_ms=1500, end_of_speech_sensitivity=HIGH, start_of_speech_sensitivity=HIGH
```

---

## Differences from Original Plan

| Original Plan | What Was Built |
|---|---|
| `scene_detector.py` used in proxy for server-side image triggers | `scene_detector.py` is dead code — image triggers are client-side (`useStoryImages` hook) |
| Image generation called from backend | Image generation called from frontend via `POST /api/image` |
| Firebase Hosting for frontend | Frontend served directly from same Cloud Run service (SPA catch-all in main.py) |
| Single `Dockerfile` in `backend/` | Multi-stage `Dockerfile` at repo root: Node builds frontend, Python serves both |

---

## Dead Code

- `backend/scene_detector.py` — never imported, safe to delete

---

## Known Issues / Tech Debt

- CORS `allow_origins=["*"]` — should be tightened to Cloud Run URL before public launch
- No backend rate limit on `/api/image` — only frontend throttles
- No WebSocket session timeout for idle sessions
- GCP token refresh: tokens expire after 1 hour; long sessions will fail without reconnect logic
