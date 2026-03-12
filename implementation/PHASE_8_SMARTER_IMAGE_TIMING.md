# Phase 8 — Smarter Image Timing (Server-side Tool Calling)

---

## The Problem Today

```
Every turnComplete fires
  → client checks rate limit (10s)
  → POST /api/image regardless of whether the moment is visually interesting
  → Flash Lite has to guess a scene from whatever Gemini just said
```

Images are timed by a clock, not by story content. A dramatic reveal gets the same treatment as Gemini saying "hmm, what shall we do next?"

---

## Target Flow

```
Gemini narrates a visually rich moment (new scene, character appears, dramatic reveal)
  → Gemini calls generate_illustration tool with its own scene description
  → frontend receives toolCall → fires POST /api/image with that description
  → image generated → renders in StorySceneGrid
  → frontend sends toolResponse back to Gemini → story continues
```

Gemini decides *when* and *what* — no guessing, no clock.

---

## Approach

**Frontend-handled tool call** — same pattern as `showChoice` / `award_badge`. No new backend infrastructure needed.

### Files to Change

| Step | File | Change |
|---|---|---|
| 1 | `backend/characters.py` | Add `generate_illustration` function declaration to tools list |
| 2 | `backend/characters.py` | System prompt: instruct Gemini when to call it and when not to |
| 3 | `frontend/src/hooks/useLiveAPI.ts` | Handle `generate_illustration` toolCall → call `triggerImageGeneration(description)` → send toolResponse |
| 4 | `frontend/src/hooks/useStoryImages.ts` | Accept a forced trigger (bypass rate limit) when called from tool |
| 5 | `frontend/src/hooks/useStoryImages.ts` | Keep `turnComplete` as fallback at ~30s interval — in case Gemini forgets |

---

## Key Decisions

### Why frontend-handled (not backend)?
Backend-handled would require `proxy.py` to call `image_gen.py`, then relay the result to the frontend via a new WebSocket message type — significant new plumbing. Frontend-handled reuses all existing machinery with minimal changes.

### Why keep the `turnComplete` fallback?
Gemini won't call the tool on every turn — especially dialogue-heavy turns. Without a fallback, a long conversation segment would produce zero images. A 30s fallback keeps the storybook filling up even when Gemini doesn't trigger explicitly.

### Skip Flash Lite extraction?
Gemini writes the `scene_description` directly in the tool call — so the Flash Lite extraction step becomes optional. Try passing Gemini's description straight to image gen, saving one model call and ~1s latency.

---

## System Prompt Addition (characters.py)

Add to `SYSTEM_PROMPT_BASE` alongside the existing tool instructions:

```
ILLUSTRATION TOOL (using generate_illustration tool):
- Call this when you describe: a new location, a character appearing for the first time,
  a magical transformation, a dramatic reveal, or any moment that would make a beautiful storybook picture.
- Do NOT call it for dialogue turns, thinking pauses, or routine story progression.
- Write the scene_description as a vivid, painter-friendly English sentence even if telling the story in another language.
- Call it at most once every 2 story beats. Do not flood with illustration requests.
```

## Tool Declaration (characters.py `build_gemini_setup_message`)

```python
{
    "name": "generate_illustration",
    "description": (
        "Generate a storybook illustration at a key visual moment. "
        "Call at scene changes, character introductions, and dramatic reveals."
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "scene_description": {
                "type": "string",
                "description": "Vivid painter-friendly English description of the scene to illustrate (1-2 sentences)",
            }
        },
        "required": ["scene_description"],
    },
},
```

---

## Frontend Changes

### useLiveAPI.ts

In the `toolCall` handler (alongside `showChoice` / `award_badge`):

```typescript
if (fn.name === "generate_illustration") {
  const description = fn.args?.scene_description as string ?? "";
  onGenerateIllustration?.(description, fn.id);
}
```

Send toolResponse immediately (don't block Gemini waiting for image):

```typescript
export function answerIllustration(callId: string) {
  ws.send(JSON.stringify({
    toolResponse: {
      functionResponses: [{ id: callId, response: { output: "Illustration generated." } }]
    }
  }));
}
```

### useStoryImages.ts

Add a `forceTrigger` path that bypasses the rate limit (tool-called images should always fire):

```typescript
const forceImageGeneration = useCallback(async (sceneDescription: string) => {
  // Same as triggerImageGeneration but skips the rate-limit check
  // Pass sceneDescription directly — skip Flash Lite extraction on backend
}, [imageStyle, sessionId]);
```

Pass a flag to `/api/image` (e.g., `skip_extraction: true`) so the backend uses `scene_description` directly without calling Flash Lite.

---

## What This Gives You

| | Now | After |
|---|---|---|
| Trigger | Clock (10s rate limit) | Story moment (Gemini decides) |
| Scene description | Flash Lite guesses from narration | Gemini writes it directly |
| Latency per image | ~4–6s (extraction + gen) | ~3–5s (skip extraction) |
| Relevance | Hit or miss | Matches what Gemini just described |
| Fallback | None | `turnComplete` at 30s |

---

## Backend Change (image_gen.py)

Add `skip_extraction: bool = False` to the `/api/image` request model. When `True`, skip the Flash Lite call and use `scene_description` directly as the image prompt (still apply style + continuity as normal).
