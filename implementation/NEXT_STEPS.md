# TaleWeaver — Next Steps
### Updated 11 Mar 2026

---

## Recently Completed

| Feature | Notes |
|---|---|
| ✅ Badge System (7.4) | `awardBadge` tool + `BadgePopup` centred on screen, 3s auto-dismiss, max 2/session |
| ✅ Sketch a Theme | Drawing canvas (19 colours) → `/api/sketch-preview` → AI recreates → confirm & start |
| ✅ Content Moderation | `/api/check-theme`, safety check on sketch label and camera label; friendly block message |
| ✅ Life Skills Themes | 5 life-skill tiles in ThemeSelect (Sharing, Courage, Gratitude, Creativity, Kindness) |
| ✅ Custom domain | `taleweaver.online` mapped to Cloud Run; added to CORS allowlist |
| ✅ Unlimited scenes | `MAX_SCENES = Infinity` — image generation continues for entire session |
| ✅ NEVER-END story rule | System prompt explicitly forbids Gemini from ending the story unprompted |
| ✅ Story pre-warm | `POST /api/story-opening` generates opening + first image before Begin is clicked; canvas never blank |
| ✅ Server-side image trigger | `generate_illustration` tool call → `forceImageGeneration` bypasses rate limit + skips extraction step |
| ✅ Story Recap | `POST /api/story-recap` uses actual session images; single Flash Lite call for title; narrations from transcript |
| ✅ StoryRecapModal | Scrollable storybook layout launched from "📖 See our story!" button |
| ✅ **Past Adventures gallery** | Auto-saves every session to localStorage; "Past Adventures" button on landing page; opens as illustrated storybook |
| ✅ **Begin! timing fix** | `await asyncio.sleep(0)` after creating proxy tasks ensures `gemini_to_browser` is in its event-loop before Begin! is sent — Gemini's first audio is never lost |
| ✅ **Recap 429 fix** | Narrations now come from story transcript stored at session-save time; `/api/story-recap` only makes 1 LLM call (title); eliminated parallel narration requests that caused RESOURCE_EXHAUSTED |
| ✅ **Description storage** | Scene descriptions stored at 500 chars (up from 100) so recap narrations have meaningful text |
| ✅ **Anti-repetition** | System prompt: model must never re-exclaim on subsequent turns; must never re-introduce itself mid-story; if child goes silent, keep narrating instead of meta-commentary |
| ✅ **Language guardrail** | Non-English characters must never switch to English regardless of child's request; enforced in system prompt |
| ✅ **generate_illustration guard** | Tool must not be called during meta-commentary — only during active story narration |
| ✅ **Audio garbling fix** | Replaced AudioWorklet queue with `AudioBufferSourceNode` scheduling — chunks scheduled at `max(currentTime, nextStartTime)` |
| ✅ **AudioContext suspension fix** | Context resumed after `getUserMedia()` resolves; ensures first audio chunks play immediately (Safari) |
| ✅ **WebSocket 30s drop fix** | `ping_interval=None` on Gemini WebSocket — Gemini Live doesn't respond to WS pings |
| ✅ **Graceful shutdown** | `--timeout-graceful-shutdown 25` in uvicorn CMD — Cloud Run SIGTERM sends clean close frames within 30s grace window |
| ✅ **Long-form narration** | System prompt: 5–7 sentence sustained flows; no stopping after 1–2 sentences |
| ✅ **challenges.md** | Living doc at `implementation/challenges.md` — hard-won lessons with symptom/root cause/fix |

---

## Not Started (Future / Stretch)

| Item | Notes |
|---|---|
| **Cloud Storage for images** | Upload to GCS for persistence beyond localStorage; signed URLs for SPA rendering |
| **User accounts** | Required for cross-device story gallery |
| **Story Director Agent (Phase A)** | Full ADK `run_live()` replacement for `proxy.py` — tools fire as Python functions, images pushed via WS. High risk; deferred post-hackathon. See `NEW_PLAN.md`. |
| OpenTelemetry observability | Structured traces to Cloud Trace |
| uv package manager | `pyproject.toml` and `uv.lock` exist at repo root; just wire Dockerfile |
