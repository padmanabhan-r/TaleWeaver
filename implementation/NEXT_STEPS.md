# TaleWeaver — Next Steps
### Updated 11 Mar 2026

---

## Recently Completed

| Feature | Notes |
|---|---|
| ✅ Badge System (7.4) | `award_badge` tool + `BadgePopup` centred on screen, 3s auto-dismiss, max 2/session |
| ✅ Sketch a Theme | Drawing canvas (19 colours) → `/api/sketch-preview` → AI recreates → confirm & start |
| ✅ Content Moderation | `/api/check-theme`, safety check on sketch label and camera label; friendly block message |
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
| ✅ **Story continuity** | `clearBuffer()` removed from `award_badge` handler. Added "NEVER restart mid-session" system prompt rule. Audio no longer cut mid-sentence on badge award. |
| ✅ **Long-form narration** | System prompt instructs model to speak in 5–7 sentence sustained flows like an audiobook narrator, reducing perceived pause frequency. `backend/characters.py` |
| ✅ **challenges.md** | New living doc at `implementation/challenges.md` — 11 hard-won lessons with symptom, root cause, fix, and file references. |
| ✅ **Story Gallery / Past Adventures (Phase 10B)** | `StoryGalleryEntry` in localStorage — saves title, images, narrations, badges, timestamp. `PastAdventuresModal` on landing page: grid of story cards → tap → `StorybookView` (same style as StoryRecapModal). Always saves even with 0 images. Narrations patched in after recap. |
| ✅ **Home button** | 🏠 button on CharacterSelect, ThemeSelect, and StoryScreen — saves gallery state and returns to landing. `handleBackToLanding` wired in App.tsx. |
| ✅ **Narrations saved to gallery** | `StoryRecapModal` now calls `onRecapGenerated(title, narrations[])`. `updateGalleryEntry` patches both `recapTitle` and `narrations` into localStorage. `StorybookView` displays narrations under each image — identical style to recap. |
| ✅ **Anti-repetition system prompt** | Per-sentence self-check, explicit ban on rephrasing, resume-exactly-where-left-off rule after tool-call pauses, prohibited resumption phrases. Fixed mid-session repetition. `backend/characters.py` |
| ✅ **Child safety calling** | Inappropriate child input now triggers an immediate warm call-out as the model's *first* response — before any story continuation. `backend/characters.py` |
| ✅ **Double begin-turn fix** | Removed frontend begin-turn re-send that was causing story repetition at session start. AudioContext resume is the correct fix for auto-start. `frontend/src/hooks/useLiveAPI.ts` |
| ✅ **Removed image interval control** | Developer-facing interval control removed from StoryScreen UI. Rate limit (8s fallback) hardcoded internally; not relevant for Vertex AI production quota. `frontend/src/screens/StoryScreen.tsx` |

---

## Next Up

### Phase 10A — Cloud Storage for Images
Currently images are base64 in localStorage. Upload to GCS for cross-device persistence.

- Upload to `gs://taleweaver-images/{session_id}/{timestamp}.png`
- Return signed URL (1hr TTL) → frontend renders `<img src={signedUrl} />`
- Prerequisite for user accounts + cross-device gallery

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
| **Cloud Storage for images** | Upload to GCS for persistence beyond localStorage; signed URLs for SPA rendering |
| **User accounts** | Required for cross-device story gallery |
| **Story Director Agent (Phase A)** | Full ADK `run_live()` replacement for `proxy.py` — tools fire as Python functions, images pushed via WS. High risk; deferred post-hackathon. See `NEW_PLAN.md`. |
| OpenTelemetry observability | Structured traces to Cloud Trace |
| uv package manager | `pyproject.toml` and `uv.lock` exist at repo root; just wire Dockerfile |
