# TaleWeaver — Next Steps
### Updated 3 Mar 2026

---

## Recently Completed

| Feature | Notes |
|---|---|
| ~~Story Branching~~  | **Removed** — appeared randomly, disappeared randomly; all branching now via voice |
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
| ✅ **Recap uses session images** | Recap now passes actual base64 session images to Gemini for narration — no new image generation, no hallucination. Parallel `_narrate_scene()` calls via `asyncio.gather`. |
| ✅ **Movement Challenges (7.2)** | Physical challenges in system prompt every ~60s (was: once per story). Character instructs child to jump/spin/roar; camera stream lets Gemini visually confirm and react. |
| ✅ **Opening image timing** | Prewarm image stored in `prewarmImageRef`, seeded into canvas only when "Begin" is clicked via `handleBegin()` — not before. |
| ✅ **Opening image ↔ story match** | `_begin_turns()` injects `opening_text` as a fake model turn so Gemini Live continues naturally from Flash Lite's opening, matching the image shown on screen. |
| ✅ **ThemeSelect responsiveness** | `goLoading` state shows "Checking… ✨" immediately on custom theme submit — no frozen button during `/api/check-theme` call. |

---

## Next Up

### Phase 10A — Cloud Storage for Images
Currently images are base64 in HTTP response body. Upload to GCS for persistence.

- Upload to `gs://taleweaver-images/{session_id}/{timestamp}.png`
- Return signed URL (1hr TTL) → frontend renders `<img src={signedUrl} />`
- Prerequisite for Story Gallery

### Phase 10B — Story Gallery
After session ends, save and display past stories on the landing page.

- Gemini generates 5-word title on session end
- Save `{ title, character, imageUrls[], timestamp }` to localStorage
- "Your Stories" grid on landing page

---

## Lower Priority / Future

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
