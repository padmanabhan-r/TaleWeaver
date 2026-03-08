# TaleWeaver: Image Generation Deep Dive

## The Core Question

> As the story unfolds and the model talks, what text is sent to generate each image?
> Is there a sliding window where the previous image provides continuity for the next one?

**Short answer:** Yes — there is a sliding window, but it is **turn-based**, not time-based.
The previous image is always passed as a visual reference. The text window for each image is
the raw transcription of the current Gemini "turn" (one complete utterance), sent directly
to the image model — no intermediate extraction step.

---

## Two Paths to Image Generation

### Path 1 — Tool Call (`generate_illustration`) — Primary

Gemini Live itself decides when to generate an image by calling the `generate_illustration` tool.
It writes the scene description directly in English (painter-friendly, 1-2 sentences).

**Trigger:** Gemini fires during its narration at key visual moments:
- New location / setting introduced
- Character appears for the first time
- Magical transformation or dramatic reveal

**Frontend handler** (`useLiveAPI.ts:321-329`):
```
Gemini fires toolCall → frontend receives description → calls forceImageGeneration(description)
```
- Bypasses all rate limits — fires immediately
- Resets the fallback timer so the fallback doesn't double-fire right after

### Path 2 — Turn Complete Fallback

When Gemini finishes a complete utterance (`turnComplete` event), the frontend fires
`triggerImageGeneration(accText)` where `accText` is everything Gemini said in that turn.

**Rate limits:**
- First image: fires if session has been running > 3 seconds
- Subsequent images: enforces the configurable `intervalSeconds` (default: 10s)

---

## What Is Actually Sent to `/api/image`

```json
{
  "scene_description": "<current turn transcription or tool-call description, up to 2000 chars>",
  "story_context":     "<rolling last ~2000 chars of ALL character speech>",
  "image_style":       "<character-specific art style descriptor>",
  "session_id":        "...",
  "previous_image_data":        "<base64 of last generated image>",
  "previous_image_mime_type":   "image/png",
  "previous_scene_description": "<raw transcription that produced the last image>"
}
```

---

## Backend Processing: Direct Pipeline (no extraction)

The backend builds the image prompt directly — no intermediate model call:

```python
# _build_scene_prompt()
"Story context (characters and setting established so far): <last 600 chars of full story>

Story narration to illustrate: <current transcription, up to 1500 chars>"
```

Final prompt sent to Gemini image model:
```
<SAFETY_PREFIX> <image_style>. Story context: ... Story narration to illustrate: ...
```

The image model reads the raw narration and generates an illustration directly. No flash-lite
middleman rewriting what was said.

---

## Multi-Part Request to Gemini (with previous image)

When a previous image exists, `_build_contents()` assembles a three-part request:

```
[Part 1 — Instruction]
The previous scene showed: "<previous scene transcription>"
You are given the previous story illustration as a reference.

CONTINUITY RULES:
1. SAME CONTEXT → maintain full visual continuity (same character designs, palette, style)
2. SHIFTED CONTEXT (new location/theme) → keep characters, build a fresh background
3. COMPLETELY NEW CAST → fresh illustration, maintain only art style

ALWAYS prioritize the new scene description below over the reference image.

[Part 2 — Previous image (base64 inline_data)]

[Part 3 — New scene]
<SAFETY_PREFIX> <image_style>. Story narration to illustrate: ...
```

For the very first image (no previous), only the text prompt is sent.

---

## The Sliding Window

```
Session start
     │
[Turn 1 completes]
  scene_description = "Everything Gemini said in Turn 1"
  story_context     = "Turn 1 text"  (rolling, ~2000 chars)
  previous_image    = (none — first image)
     │
     ▼ → Image 1 generated → stored as lastImageRef
     │
[Turn 2 completes — intervalSeconds not elapsed, skipped]
  story_context += " Turn 2 text"
     │
[Turn 3 completes — intervalSeconds elapsed]
  scene_description = "Everything Gemini said in Turn 3"
  story_context     = "Turn 1 + 2 + 3 text" (last ~2000 chars)
  previous_image    = Image 1 (base64) + Turn 1 transcription
     │
     ▼ → Image 2 generated with Image 1 as visual anchor
```

### What the window contains

| Component | Window | Purpose |
|---|---|---|
| `scene_description` | Current turn transcription | "What to paint NOW" — raw, faithful to what was said |
| `story_context` | Last ~2000 chars of all turns | Gives image model character/setting history |
| `previous_image` | Last generated image (base64) | Visual continuity — same art style, same character look |
| `previous_scene_description` | Transcription that produced last image | Tells image model what was illustrated before |

---

## Image Generation Model

Only Gemini image models are used. Two clients, same model, different auth:

| Client | When used |
|---|---|
| `_api_key_client` (AI Studio API key) | Preferred — shorter rate limit intervals |
| `_client` (Vertex AI) | Fallback when no API key configured |

Imagen has been removed entirely — all image generation goes through Gemini.

---

## Summary

The pipeline is now:

```
Gemini Live narrates
       │
       ├─ Tool call fires → scene description (written by Gemini, English)
       │                                          │
       └─ turnComplete fires → raw transcription  │
                                                  │
                              ┌───────────────────┘
                              ▼
                   _build_scene_prompt()
                   (story_context + raw narration)
                              │
                              ▼
                   _build_contents()
                   (instruction + previous image + new prompt)
                              │
                              ▼
                   Gemini image model → base64 PNG
                              │
                              ▼
                   stored in lastImageRef → passed to next image call
```

Images stay true to what is actually being told. The only transformation is the continuity
instruction wrapper — the story narration itself reaches the image model verbatim.
