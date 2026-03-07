# Phase 5 — Story Pre-warm (Zero Blank Canvas)

## Status: ✅ DONE

---

## The Problem

```
User confirms theme → navigates to StoryScreen
  → blank canvas while Gemini Live warms up
  → child clicks "Begin Story!"
  → Gemini starts narrating from zero context
  → first image generates 8–10s into the story (turnComplete + image pipeline)
```

The storybook canvas is empty for the first 15–20 seconds of every session. Gemini starts from scratch with no creative seed.

---

## Solution

```
User confirms theme → StoryScreen mounts
  → immediately calls POST /api/story-opening (runs while user sees the character)
      → Flash Lite generates creative story opening (in character's language) + English scene description
      → Image model renders the first illustration from that scene
  → first image appears in canvas before the child even clicks Begin
  → "Begin the Story!" button enables when pre-warm completes (or 20s timeout fallback)
  → child clicks Begin → Gemini Live session starts
      → opening_text sent in WebSocket handshake to backend
      → proxy includes opening in the "Begin!" trigger: "Continue from exactly where this leaves off..."
      → Gemini Live picks up mid-story, no repetition, no cold start
  → subsequent images use the pre-generated image as lastImageRef for visual continuity
```

---

## Files Changed

| File | Change |
|---|---|
| `backend/image_gen.py` | `_generate_opening()` — one Flash Lite call produces STORY + SCENE in both character language and English; `POST /api/story-opening` endpoint |
| `backend/main.py` | Read `opening_text` from init message, pass to `run_proxy_session` |
| `backend/proxy.py` | `_opening_suffix()` helper; `opening_text` param injected into all four "Begin!" variants |
| `frontend/src/screens/ThemeSelect.tsx` | `onConfirm` signature adds optional `propDescription` (camera/sketch label) |
| `frontend/src/App.tsx` | Thread `propDescription` state through to `StoryScreen` |
| `frontend/src/screens/StoryScreen.tsx` | `useEffect` on mount → `POST /api/story-opening` → `seedInitialImage` + store `openingText`; button disabled until ready |
| `frontend/src/hooks/useLiveAPI.ts` | `openingText` option + ref; sent in WS handshake as `opening_text` |
| `frontend/src/hooks/useStoryImages.ts` | `seedInitialImage()` — sets `lastImageRef` + adds first scene as loaded |

---

## API: `POST /api/story-opening`

**Request:**
```json
{
  "character_id": "dadi",
  "character_name": "Dadi Maa",
  "character_language": "Hindi",
  "image_style": "warm watercolor illustration, traditional Indian home...",
  "theme": "Animals",
  "prop_description": ""
}
```

**Response:**
```json
{
  "opening_text": "एक बार की बात है, एक छोटी सी गौरैया...",
  "image_data": "<base64 PNG>",
  "mime_type": "image/png",
  "scene_description": "A tiny brown sparrow perched on the rim of a clay pot in a sunlit Indian courtyard, her eyes wide with curiosity, surrounded by marigold petals."
}
```

**Flow inside the endpoint:**
1. `_generate_opening()` — single Flash Lite call with structured output:
   - `STORY:` section — 3-4 sentences in character's language, mid-scene start
   - `SCENE:` section — 1-2 English painter's sentences for image gen
2. Image generated from `SAFETY_PREFIX + image_style + scene_description`
3. No `skip_extraction` needed — scene is already painter-ready

---

## `_opening_suffix()` in proxy.py

Appended to every "Begin!" variant when `opening_text` is provided:

```
The story has already begun with this opening — continue from exactly where it leaves off:

<opening_text>

Do NOT repeat anything already said. Your very next word continues the story mid-flow.
```

Works across all four Begin! branches: themed, camera_prop, sketch, and plain.

---

## UX Timeline

```
0s    StoryScreen mounts → pre-warm starts in background
1-2s  Flash Lite generates opening + scene description
3-8s  Image model renders first illustration
5-8s  First image appears in the canvas (shimmer → fade-in)
      "Begin the Story!" button becomes enabled
Xs    Child clicks "Begin Story!" → session connects
      Gemini continues the story from the opening mid-sentence
```

Fallback: if pre-warm fails (network error, rate limit, timeout >20s), `preWarmReady` is set to `true` anyway and the story starts from scratch — current behaviour.

---

## What This Gives You

| | Before | After |
|---|---|---|
| Canvas at session start | Blank (StorybookEmpty) | First illustration already loaded |
| Gemini story start | Cold start from theme only | Continues mid-scene from pre-generated opening |
| Image timing | First image ~15s in | First image ready before Begin is clicked |
| Visual continuity | `lastImageRef` starts null | `lastImageRef` seeded with opening image |
| Languages | n/a | Opening in character's language (Hindi, Tamil, etc.) |
