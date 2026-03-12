# TaleWeaver — Stretch Goals
### Updated 1 Mar 2026

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
Illustrator Agent  (gemini-2.0-flash-preview-image-generation)
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

## Stretch Goal 2 — Tool Calling During Live Story (Server-side Image Trigger) ✅ DONE

~~Image generation is triggered client-side after `turnComplete` via `useStoryImages`.~~

**Implemented:** `generate_illustration` tool declared in character setup. Gemini calls it at visually rich moments → `useLiveAPI` handles the `toolCall`, immediately sends `toolResponse` (unblocking narration), calls `forceImageGeneration(description)` → bypasses rate limit, passes `skip_extraction: true` to `/api/image` (Gemini wrote the scene description directly, no Flash Lite needed). `turnComplete` fallback at user-configured interval still runs for dialogue-heavy turns.

---

## Stretch Goal 3 — Interactive Story Choices ✅ DONE

~~At key moments the character offers two branching choices rendered as tappable buttons.~~

**Implemented:** `showChoice` tool call from Gemini → `pendingChoiceRef` queued until `turnComplete` + 700ms → `ChoiceOverlay` renders over scene canvas → child taps OR speaks → dismissed. AT MOST ONCE per session.

---

## Stretch Goal 4 — Badge & Achievement System ✅ DONE

~~Character awards virtual badges during the session for engagement behaviours.~~

**Implemented:** `award_badge` tool call from Gemini → `BadgePopup` appears centred on screen → auto-dismisses after 3 seconds. Criteria: genuine creative contributions (story ideas, brave choices, movement challenges, ending the story). Prohibited: camera toggle, random movement, just being present.

---

## Stretch Goal 5 — Google Cloud Storage for Images

**Current:** Images returned as base64 in HTTP response body — fine for typical session lengths.

**Target:** Backend saves generated images to GCS, returns a signed URL.

```
Image generated
  → upload to gs://taleweaver-images/{session_id}/{timestamp}.png
  → generate signed URL (1 hour TTL)
  → return URL to frontend
  → frontend renders <img src={signedUrl} />
```

**Benefits:** Images persist across page refreshes; enables story gallery; reduces HTTP payload.

---

## Stretch Goal 6 — Story Gallery (Past Sessions) ⏸ DEFERRED

**Current:** Each session is ephemeral — images disappear on refresh. "Your Stories" section removed from landing page.

**Target (future):** After a session ends, save the story to a named gallery entry.

```
Session ends
  → prompt Gemini: "Give this story a title in 5 words or less"
  → save to localStorage: { title, character, images[], timestamp }
  → LandingPage shows "Your Stories" section with story cards
```

Prerequisite: Cloud Storage (Stretch Goal 5) for persistent images.

---

## Stretch Goal 7 — OpenTelemetry Observability

**Current:** `print()` statements in proxy.py and image_gen.py.

**Target:** Structured traces exported to Google Cloud Trace.

```python
from opentelemetry import trace
tracer = trace.get_tracer("taleweaver")

with tracer.start_as_current_span("image_generation") as span:
    span.set_attribute("character_id", character_id)
    span.set_attribute("session_id", session_id)
    image = await _generate(prompt)
    span.set_attribute("success", True)
```

---

## Stretch Goal 8 — uv Package Manager

**Current:** `pip install -r requirements.txt` in Dockerfile.

**Target:** Switch to `uv` — 10–100x faster installs, `uv.lock` for reproducible builds.

```dockerfile
FROM python:3.13-slim
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/
WORKDIR /app
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev
COPY backend/ .
CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
```

`pyproject.toml` and `uv.lock` already exist at repo root — just wire the Dockerfile.

---

## Stretch Goal 9 — Life Skills Story Themes ✅ DONE

~~Child can pick an educational theme alongside adventure themes.~~

**Implemented:** ThemeSelect includes 5 life-skill tiles: Sharing 🤝, Courage 💪, Gratitude 🙏, Creativity 🎨, Kindness 🌍. Theme injected into `Begin!` message via existing pipeline.

---

## Stretch Goal 10 — Rive Animated Avatars (Lip-sync)

**Current:** PNG portraits with Framer Motion per-state animations — idle breathing, thinking sway, speaking scale pulse + sound waves, listening bob. Covers all 4 states well.

**Target:** Replace PNGs with Rive state machine animations for true lip-sync tied to audio amplitude.

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

**Effort:** Very High — requires Rive asset creation for all 10 characters.
**Impact:** Very High — transforms from "nice animations" to "living character".

---

## Priority Order (Current)

| # | Goal | Effort | Impact | Status |
|---|---|---|---|---|
| 1 | Rive lip-sync avatars | Very High | Very High | ⬜ Framer Motion covers it for now |
| 2 | Story Gallery | Low–Medium | Medium | ⏸ Deferred (needs GCS) |
| 3 | Cloud Storage for images | Medium | Medium | ⬜ Not started |
| 4 | Multi-agent ADK pipeline | Very High | Medium | ⬜ Not started |
| 5 | uv package manager | Low | Low | ⬜ Files exist, just wire Dockerfile |
| 6 | OpenTelemetry observability | Medium | Low | ⬜ Not started |
| — | Story pre-warm (zero blank canvas) | — | — | ✅ Done |
| — | Tool calling image trigger | — | — | ✅ Done |
| — | Interactive story choices | — | — | ✅ Done |
| — | Badge & achievement system | — | — | ✅ Done |
| — | Life skills themes | — | — | ✅ Done |
