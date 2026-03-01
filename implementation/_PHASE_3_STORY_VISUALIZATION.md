# Phase 3 — Story Visualization

## Status: ✅ DONE

---

## What Was Built

### Image Generation Pipeline

```
turnComplete fires
    → full accumulated turn text (outputTextAccRef)
    → useStoryImages.triggerImageGeneration(text)
        → append to rolling story context (last 2000 chars)
        → session startup delay check (20s from connect)
        → rate limit check (1 image per 30s)
        → visual keyword pre-filter (must contain visual words)
        → optimistic loading card added to scenes[]
        → POST /api/image { scene_description, story_context, image_style, session_id }
            → backend: gemini-2.0-flash-lite extracts English visual scene (2-3 sentences)
            → backend: safety prefix + image_style + scene → imagen-3.0-fast-generate-001
            → returns base64 image
        → loading card → loaded card (shimmer → fade-in)
```

### `useStoryImages` Hook (`frontend/src/hooks/useStoryImages.ts`)

**Rate limiting & guards:**
- Session startup delay: 20 seconds (story needs to establish before first image)
- Rate limit: 1 image per 30 seconds per session
- Cap: 8 images maximum per session
- Client-side visual keyword pre-filter — requires actual visual content words in the text

**Visual keyword dictionary** covers 6 languages:
- English: castle, dragon, forest, ocean, mountain, cave, village, sky, sparkled, kingdom, wizard, fairy, princess, knight, robot, once upon, etc.
- Tamil: காடு (forest), மலை (mountain), கடல் (ocean), கோட்டை (castle), திடீரென்று (suddenly), அரண்மனை (palace), etc.
- Hindi: जंगल (forest), पहाड़ (mountain), समुद्र (ocean), महल (palace), अचानक (suddenly), etc.
- Telugu: అడవి (forest), పర్వతం (mountain), సముద్రం (ocean), రాజ్యం (kingdom), etc.
- Marathi: जंगल (forest), डोंगर (mountain), समुद्र (ocean), राज्य (kingdom), etc.
- Bengali: জঙ্গল (forest), পাহাড় (mountain), সমুদ্র (ocean), রাজ্য (kingdom), হঠাৎ (suddenly), etc.

**Rolling story context:**
- Appends each turn's text to a running buffer (trimmed to last 2000 chars)
- Sent as `story_context` to backend for scene extraction — helps the model name exact characters and settings from earlier in the story

**429 handling:**
- Vertex AI rate limit → silently discard loading card, reset timer to 0 (allow immediate retry next turn)

### Scene Display (`frontend/src/components/`)

**`StorySceneGrid.tsx`:**
- Horizontally scrollable grid of scene cards
- Renders `StorybookEmpty` placeholder when no images yet

**`StorySceneCard.tsx`:**
- `status: "loading"` → shimmer skeleton animation
- `status: "loaded"` → fade-in image with `object-cover` fill

**`StorybookEmpty.tsx`:**
- SVG illustration shown before first image appears

### Backend Scene Extraction (`backend/image_gen.py`)

`gemini-2.0-flash-lite` extraction prompt engineered for specificity:
- Identifies single most visually interesting moment
- Names exact character (species, appearance, clothing)
- Names exact setting (forest, village, ocean, cave, etc.)
- Names precise action happening
- Uses story context to get character details right
- Refuses generic descriptions ("a character in a setting")

---

## Key Fix (Feb 2026)

**Problem:** Images had no connection to the story being told.

**Root cause:** A 20-word early trigger fired with an incomplete mid-sentence fragment. `imageTriggeredThisTurnRef = true` then prevented the full turn text from ever being sent at `turnComplete`. The image model was generating from 20-word fragments like "Once upon a time in a land far away there was a little girl who".

**Fix:**
- Removed the 20-word early trigger entirely
- Removed `imageTriggeredThisTurnRef`
- Image now fires only at `turnComplete` with the full accumulated turn text (100–300 words)
- Removed the `>= 10 words` bypass that let garbage through without keyword check
- Rolling context extended from 600 → 2000 chars
- Payload to backend extended from 400 → 2000 chars

---

## Differences from Original Plan

| Original Plan | What Was Built |
|---|---|
| Scene triggers from `scene_detector.py` in backend | Scene triggers entirely client-side in `useStoryImages` |
| Backend SSE/push for generated images | Client initiates `POST /api/image` and polls response directly |
| Triggers on "picture this..." phrases | Triggers on `turnComplete` with visual keyword pre-filter |
| Image displayed inline in story text flow | Separate `StorySceneGrid` panel with scrollable cards |
