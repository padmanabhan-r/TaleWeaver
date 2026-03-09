# TaleWeaver — Next Steps
### Updated 9 Mar 2026

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
| ✅ **Audio garbling fix** | Replaced AudioWorklet queue with `AudioBufferSourceNode` scheduling — each chunk scheduled to start exactly when the previous ends using `audioContext.currentTime`. Gemini streams 30s of audio in 5s; it just schedules into the future. No queue overflow, no garbling. `frontend/src/hooks/useLiveAPI.ts` |
| ✅ **WebSocket 30s drop fix** | Disabled standard WebSocket ping frames (`ping_interval=None`) — Gemini Live API does not respond to WS pings, causing 1006 drops. `backend/proxy.py` |
| ✅ **AudioContext suspension fix** | `audioContext.resume()` now awaited in `initPlayback()` — first chunks no longer scheduled on a frozen timeline. `frontend/src/hooks/useLiveAPI.ts` |
| ✅ **"Begin!" moved to backend** | Kick-off message sent directly to Gemini before bidirectional proxy starts, preventing mic audio from racing with the first response. `backend/proxy.py` |
| ✅ **Removed participation challenges** | Challenges removed entirely — non-verbal actions (clapping, roaring) are below VAD threshold with `START_SENSITIVITY_LOW`; combined with `proactive_audio` the model never waited reliably. `backend/characters.py` |
| ✅ **Removed camera during storytelling** | Camera caused model to stop and say "I see you!" mid-story, breaking narrative flow. Removed from `StoryScreen` entirely. `frontend/src/screens/StoryScreen.tsx`, `frontend/src/hooks/useLiveAPI.ts` |
| ✅ **Simplified badge system** | Badges now awarded only for spontaneous child creativity (max 2/session). No challenge-completion badges. `backend/characters.py` |
| ✅ **Story continuity** | `clearBuffer()` removed from `awardBadge` handler. Added "NEVER restart mid-session" system prompt rule. Audio no longer cut mid-sentence on badge award. |
| ✅ **Long-form narration** | System prompt instructs model to speak in 5–7 sentence sustained flows like an audiobook narrator, reducing perceived pause frequency. `backend/characters.py` |
| ✅ **challenges.md** | New living doc at `implementation/challenges.md` — 9 hard-won lessons with symptom, root cause, fix, and file references. |

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
