# TaleWeaver — Next Steps
### Updated 3 Mar 2026

---

## Recently Completed

| Feature | Notes |
|---|---|
| ✅ Story Branching (7.3) | `showChoice` tool + `ChoiceOverlay`; queued after `turnComplete` + 700ms; voice dismissal |
| ✅ Badge System (7.4) | `awardBadge` tool + `BadgePopup` centred on screen, 3s auto-dismiss |
| ✅ Sketch a Theme | Drawing canvas (19 colours) → `/api/sketch-preview` → AI recreates → confirm & start |
| ✅ Content Moderation | `/api/check-theme`, safety check on sketch label, camera label; friendly block message |
| ✅ Life Skills Themes | 5 life-skill tiles in ThemeSelect (Sharing, Courage, Gratitude, Creativity, Kindness) |
| ✅ Custom domain | `taleweaver.online` mapped to Cloud Run; added to CORS allowlist |
| ✅ Unlimited scenes | `MAX_SCENES = Infinity` — image generation continues for entire session |
| ✅ NEVER-END story rule | System prompt explicitly forbids Gemini from ending the story unprompted |
| ✅ Story pre-warm | `POST /api/story-opening` generates opening + first image before Begin is clicked; canvas never blank |
| ✅ Server-side image trigger | `generate_illustration` tool call → `forceImageGeneration` bypasses rate limit + skips Flash Lite extraction |
| ✅ **Story Planner ADK Agent** | `backend/story_planner.py` — `google.adk LlmAgent` + `Runner` + `InMemorySessionService`; `POST /api/story-plan` generates structured 4-beat story plan before session starts; returns `opening_text` hint injected into WebSocket init |
| ✅ **Story Recap (Interleaved Output)** | `backend/image_gen.py` — `POST /api/story-recap` uses `response_modalities=["TEXT","IMAGE"]`; single Gemini call produces alternating text paragraphs + illustrations; satisfies Creative Storyteller hackathon mandatory requirement |
| ✅ **StoryRecapModal** | `frontend/src/components/StoryRecapModal.tsx` — modal launched from "📖 See our story!" button in `sessionState === "ended"`; renders interleaved pages in a scrollable storybook layout |

---

## Immediate / High Value

### 7.2 Movement Challenges ("Hero's Tasks")
Camera is live (7.1 ✅), so vision-verified challenges are unblocked.

- Add movement challenge prompts to character system prompts in `characters.py`
- Gemini embeds a physical challenge mid-story ("Can you jump like a frog three times?")
- Because camera is streaming, Gemini can visually detect when the child completes the challenge and react
- No backend changes needed — system prompt change only

---

## Medium Priority

### Rive Lip-Sync Avatars
Framer Motion currently covers all 4 character states. Rive is the next visual level.

- Create Rive state machine files for all 10 characters (idle / speaking / thinking / listening)
- Wire mouth animation intensity to real-time audio amplitude
- Replace PNG `<img>` in `StoryScreen.tsx` portrait with `<RiveComponent>`
- **Effort:** Very High (requires Rive asset creation per character)

---

## Lower Priority / Future

### Story Gallery (Past Sessions)
Removed from landing page for now (ephemeral sessions are fine for v1).

- Requires Cloud Storage (GCS) to persist images across refreshes
- After session ends: prompt Gemini for 5-word title → save `{ title, character, images[], timestamp }` to localStorage
- Display on landing page or character select

### Cloud Storage for Images
Currently images are base64 in HTTP response body — fine for typical session lengths.

- Upload to `gs://taleweaver-images/{session_id}/{timestamp}.png`
- Return signed URL (1hr TTL) → frontend renders `<img src={signedUrl} />`
- Prerequisite for persistent story gallery

### uv Package Manager
`pyproject.toml` and `uv.lock` already exist at repo root. Just wire the Dockerfile.

```dockerfile
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/
RUN uv sync --frozen --no-dev
```

---

## Not Started (Future / Stretch)

| Item | Notes |
|---|---|
| **Story Director Agent (Phase A)** | Full ADK `run_live()` replacement for `proxy.py` — tools fire as Python functions, images pushed via WS. High risk; deferred post-hackathon. See `NEW_PLAN.md` Phase A for design. |
| OpenTelemetry observability | Structured traces to Cloud Trace |
| User accounts | Required for cross-device story gallery |
