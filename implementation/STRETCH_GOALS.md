# TaleWeaver — Stretch Goals

---

## Stretch Goal 1 — Multi-Agent Pipeline (ADK)

**Current:** `image_gen.py` does scene extraction + image generation in one monolithic function.

**Target:** Break into dedicated agents using Google ADK — each runs independently, communicates via session state.

```
turnComplete fires
  ▼
Scene Detector Agent  (gemini-2.0-flash-lite)
  → extracts painter-specific English scene from narration
  → saves to session.state["current_scene"]
  ▼
Illustrator Agent  (gemini-3.1-flash-image-preview)
  → reads session.state["current_scene"] + previous image for continuity
  → generates image
  → saves base64 to session.state["latest_image"]
  ▼
(optional) Quality Judge Agent
  → validates: child-safe? visually coherent? character consistent?
  → pass → return to frontend
  → fail → retry with corrected prompt (max 2 retries)
```

**Why:** Agents can run with different temperatures, models, and retry logic independently. Judge agent catches bad images before the child sees them.

---

## Stretch Goal 2 — Tool Calling During Live Story

**Current:** Image generation is triggered client-side after `turnComplete` via `useStoryImages`.

**Target:** Gemini Live calls tools mid-story to trigger images, badges, and choices — all server-side.

```python
# Character system prompt includes tool definitions:
tools = [
    {
        "name": "generate_illustration",
        "description": "Generate a story scene image at a key visual moment",
        "parameters": { "scene_description": "string", "mood": "string" }
    },
    {
        "name": "award_badge",
        "description": "Award the child a badge for engagement",
        "parameters": { "badge_type": "string", "reason": "string" }
    },
    {
        "name": "show_choice",
        "description": "Present the child with a story branch choice",
        "parameters": { "option_a": "string", "option_b": "string" }
    }
]
```

Frontend listens for `toolCall` events from the WebSocket and renders accordingly.

**Why:** Character decides *when* an image is needed — more story-aware timing than client-side triggering.

---

## Stretch Goal 3 — Interactive Story Choices (Phase 7.3)

**Current:** Story is fully linear — Gemini narrates, child can only interrupt with voice.

**Target:** At key moments the character offers two branching choices rendered as tappable buttons.

```
Grandma Rose: "Now little one — should the dragon fly into the dark cave,
               or swim across the silver lake?"

UI renders:
  [ 🐉 Fly into the cave ]    [ 🌊 Swim the silver lake ]

Child taps → useLiveAPI sends text back → story continues that branch
```

**Implementation:** `show_choice` tool call from Gemini → frontend renders choice overlay → child taps → `client_content` message sent back.

---

## Stretch Goal 4 — Badge & Achievement System (Phase 7.4)

**Current:** No engagement mechanics beyond the story itself.

**Target:** Character awards virtual badges during the session for engagement behaviours.

| Badge | Trigger |
|---|---|
| 🎤 Great Storyteller | Child suggests 3+ story ideas |
| 🐉 Dragon Friend | Child picks a dragon-themed option |
| ⭐ Story Finisher | Session reaches a natural ending |
| 🌙 Bedtime Hero | Session runs past 8pm local time |

Badges rendered as a pop-up animation, persisted to localStorage.

---

## Stretch Goal 5 — Google Cloud Storage for Images

**Current:** Images returned as base64 in HTTP response body — fine for 8 images, but bloats memory.

**Target:** Backend saves generated images to GCS, returns a signed URL. Frontend loads from URL.

```
Image generated
  → upload to gs://taleweaver-images/{session_id}/{timestamp}.png
  → generate signed URL (1 hour TTL)
  → return URL to frontend
  → frontend renders <img src={signedUrl} />
```

**Benefits:**
- Images persist across page refreshes
- Can build a "Story Gallery" showing past sessions
- Reduces HTTP payload size dramatically

---

## Stretch Goal 6 — Story Gallery (Past Sessions)

**Current:** Each session is ephemeral — images disappear on refresh.

**Target:** After a session ends, save the story (transcript + images) to a named gallery entry.

```
Session ends
  → prompt Gemini: "Give this story a title in 5 words or less"
  → save to localStorage: { title, character, images[], timestamp }
  → LandingPage shows "Your Stories" section with story cards
```

No backend changes needed for v1 — localStorage only. GCS + user accounts for v2.

---

## Stretch Goal 7 — OpenTelemetry Observability

**Current:** `print()` statements in proxy.py and image_gen.py.

**Target:** Structured traces exported to Google Cloud Trace.

```python
from opentelemetry import trace
from opentelemetry.exporter.cloud_trace import CloudTraceSpanExporter

tracer = trace.get_tracer("taleweaver")

with tracer.start_as_current_span("image_generation") as span:
    span.set_attribute("character_id", character_id)
    span.set_attribute("image_model", IMAGE_MODEL)
    span.set_attribute("session_id", session_id)
    image = await _generate_gemini_api_key(prompt)
    span.set_attribute("success", True)
```

**What to trace:**
- WebSocket session lifetime (connect → disconnect)
- Image generation latency per model
- Gemini Live API setup time
- Per-session image count

---

## Stretch Goal 8 — uv Package Manager

**Current:** `pip install -r requirements.txt` in Dockerfile — slow, no lock file.

**Target:** Switch to `uv` (Astral) — 10–100x faster installs, `uv.lock` for reproducible builds.

```dockerfile
FROM python:3.13-slim
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/
WORKDIR /app
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev
COPY backend/ .
CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
```

Already have `pyproject.toml` and `uv.lock` at repo root. Just need to wire the Dockerfile.

---

## Stretch Goal 9 — Life Skills Story Themes

**Current:** Child can ask for any story — no structured educational thread.

**Target:** Character selection screen includes an optional "What shall we learn today?" picker.

| Theme | Prompt seed |
|---|---|
| 🤝 Sharing | "Tell a story where sharing makes everything better" |
| 💪 Courage | "Tell a story about being brave when you're scared" |
| 🙏 Gratitude | "Tell a story about saying thank you" |
| 🎨 Creativity | "Tell a story where imagination saves the day" |
| 🌍 Kindness | "Tell a story about being kind to someone different" |

Theme is injected as an additional `client_content` message after setup, before "Begin!".

---

## Stretch Goal 10 — Rive Animated Avatars (Lip-sync)

**Current:** PNG portraits with Framer Motion per-state animations (idle breathing, thinking sway,
speaking scale pulse + sound waves, listening bob). `characterState` drives all visual states.

**What's done:** Framer Motion approach fully implemented — characters visually react to all 4 states
with smooth Framer Motion transitions. This covers the core use case without Rive.

**Target (remaining):** Replace PNGs with Rive state machine animations for true lip-sync.

```
characterState = "speaking"
  → Rive: activate "speaking" state → mouth animates to audio amplitude
characterState = "listening"
  → Rive: activate "listening" state → character leans forward, eyes wide
characterState = "thinking"
  → Rive: activate "thinking" state → head tilts, thought bubble
characterState = "idle"
  → Rive: activate "idle" state → breathing, subtle blink
```

Audio amplitude from `AudioVisualizer` drives mouth animation intensity in real time.

**Effort:** Very High — requires creating Rive assets for all 10 characters.
**Impact:** Very High — transforms from "nice animations" to "living character".

---

## Priority Order (Updated)

| # | Goal | Effort | Impact | Status |
|---|---|---|---|---|
| 1 | Interactive story choices (7.3) | Medium | High | ⬜ Planned |
| 2 | Life skills themes | Low | High | ⬜ Not started |
| 3 | Movement challenges (7.2) | Low–Medium | High | ⬜ Camera ready (7.1 ✅) |
| 4 | Badge system (7.4) | Medium | Medium | ⬜ Planned |
| 5 | Story gallery (localStorage) | Low | Medium | ⬜ Not started |
| 6 | Rive lip-sync avatars | Very High | Very High | ⬜ Framer Motion covers it for now |
| 7 | Tool calling during live story | High | High | ⬜ Not started |
| 8 | Cloud Storage for images | Medium | Medium | ⬜ Not started |
| 9 | uv package manager | Low | Low | ⬜ Files exist, just wire Dockerfile |
| 10 | Multi-agent ADK pipeline | Very High | Medium | ⬜ Not started |
| 11 | OpenTelemetry observability | Medium | Low | ⬜ Not started |
