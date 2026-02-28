# TaleWeaver — Next Steps

---

## Immediate (High Impact, Low–Medium Effort)

### 7.2 Movement Challenges ("Hero's Tasks")
Camera is live (7.1 ✅), so vision-verified challenges are unblocked.

- Add movement challenge prompts to character system prompts in `characters.py`
- Gemini embeds a physical challenge mid-story ("Can you jump like a frog three times?")
- Because camera is streaming, Gemini can visually detect when the child completes the challenge and react ("Amazing! You did it! Now back to our story…")
- No backend changes needed — system prompt + camera stream is enough

### 7.3 Story Branching (Choice Buttons)
Low code change, high engagement impact.

- Add `show_choice` tool definition to character system prompts in `characters.py`
- Frontend listens for `toolCall` events in `useLiveAPI.ts` WebSocket message handler
- New `ChoiceOverlay` component renders 2–3 tappable buttons over the scene canvas
- Tapped choice sent back as `client_content` text turn via WebSocket
- Gemini weaves the choice into the continuing story

Files to change: `characters.py`, `useLiveAPI.ts`, new `ChoiceOverlay.tsx`, `StoryScreen.tsx`

### Life Skills Story Themes
Tiny effort, strong educational value — pairs well with Theme Selection already built.

- Add a "Life Lesson" row to the `ThemeSelect` tile grid (Sharing 🤝, Courage 💪, Gratitude 🙏, Creativity 🎨, Kindness 🌍)
- Or add a 4th ThemeSelect accordion card: "Teach Me Something"
- Theme injected via existing Begin! message pipeline — zero backend changes

---

## Medium Priority

### 7.4 Badge & Achievement System
- Add `award_badge` tool definition to character system prompts
- Frontend listens for `toolCall` events, shows animated badge pop-up
- Persist earned badges to `localStorage` per character
- Display badge shelf on the landing page or character select screen

| Badge | Trigger |
|---|---|
| 🎤 Great Storyteller | Child suggests 3+ story ideas |
| ⭐ Story Finisher | Session reaches a natural ending |
| 🌙 Bedtime Hero | Session runs past 8pm local time |
| 🏃 Active Hero | Completes a movement challenge |

Files to change: `characters.py`, `useLiveAPI.ts`, new `BadgePopup.tsx`

### Story Gallery (Past Sessions)
- On session end, prompt Gemini for a 5-word story title
- Save `{ title, characterId, images[], transcript, timestamp }` to `localStorage`
- Add a "Your Stories" section to `LandingPage.tsx` showing story cards

---

## Lower Priority / Longer Effort

### Rive Lip-Sync Avatars (Stretch Goal 10)
Framer Motion animations currently cover all 4 character states well. Rive is the next level.

- Create Rive state machine files for all 10 characters (idle / speaking / thinking / listening)
- Wire mouth animation intensity to real-time audio amplitude from `AudioVisualizer`
- Replace PNG `<img>` in `StoryScreen.tsx` portrait with `<RiveComponent>`
- **Effort:** Very High (requires Rive asset creation per character)

### Tool Calling Pipeline (Stretch Goal 2)
Moves image generation server-side so Gemini decides *when* to generate images.

- Add `generate_illustration` tool to character prompts
- Backend handles `toolCall` → calls `image_gen.py` → returns result via WebSocket
- More story-aware image timing vs current client-side `turnComplete` trigger

### uv Package Manager (Stretch Goal 8)
`pyproject.toml` and `uv.lock` already exist at repo root. Just wire the Dockerfile.

```dockerfile
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/
RUN uv sync --frozen --no-dev
```

### Study Mode (Phase 5)
4 educational characters (Count Cosmo, Dr. Luna, Professor Pip, Arty) already defined.
Needs a distinct `StudyScreen` with Q&A prompt cadence and end-of-session summary card.

---

## Not Started (Future / Stretch)

| Item | Notes |
|---|---|
| Cloud Storage for images | GCS signed URLs instead of base64 in response |
| Multi-agent ADK pipeline | Scene Detector → Illustrator → Quality Judge |
| OpenTelemetry observability | Structured traces to Cloud Trace |
| Custom domain | `taleweaver.app` via Cloud Run domain mapping |
| User accounts | Required for cross-device story gallery |
