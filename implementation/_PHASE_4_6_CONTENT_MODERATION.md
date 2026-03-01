# Phase 4.6 — Content Moderation ✅ DONE

All content entry points (typed theme, camera prop, sketch drawing) are safety-checked before the story starts.

---

## What Gets Moderated

| Entry Point | When | How |
|---|---|---|
| Custom typed theme | On "Begin the Story!" tap | `/api/check-theme` → Flash Lite classifier |
| Camera prop | After label extracted from prop image | `_is_safe_for_children(label)` in `sketch_preview` |
| Sketch drawing | After label extracted from drawing | `_is_safe_for_children(label)` in `sketch_preview` |

---

## Backend

### Classifier (`image_gen.py`)
```python
async def _is_safe_for_children(content: str) -> bool:
    prompt = (
        f"Is this content appropriate for a children's story app for ages 4-10?\n"
        f"Content: \"{content}\"\n\n"
        "Reply with exactly one word: SAFE or UNSAFE.\n"
        "Mark UNSAFE for: violence, weapons, blood, death, horror, adult/sexual themes, "
        "drugs, hate speech, self-harm, war, terrorism, or anything frightening or dangerous.\n"
        "Mark SAFE for: animals, magic, adventure, friendship, food, space, nature, fantasy, everyday life."
    )
    try:
        response = await asyncio.wait_for(
            _extract_client.aio.models.generate_content(model=EXTRACT_MODEL, contents=prompt),
            timeout=6.0,
        )
        return "UNSAFE" not in response.text.strip().upper()
    except Exception:
        return True  # fail open — never block on classifier error
```

- Model: `gemini-2.0-flash-lite` (same as scene extraction)
- Timeout: 6s — fails open if classifier is slow
- Returns HTTP 400 `detail: "unsafe_content"` when blocked

### `/api/check-theme` endpoint
Accepts `{ theme: str }` → runs classifier → returns `{ safe: bool }`.

### Sketch/Camera flow
Safety check runs after Flash Lite label extraction. If unsafe, raises `HTTPException(status_code=400, detail="unsafe_content")` before image generation is attempted.

---

## Frontend

### ThemeSelect.tsx
- `Preview` type includes `unsafe?: boolean`
- `callPreviewAPI`: catches HTTP 400 `unsafe_content` → sets `{ loading: false, unsafe: true }`
- Camera/Sketch preview shows 🚫 emoji + "That theme isn't available for stories" message
- `handleGo` is `async`: calls `/api/check-theme` for custom text before `onConfirm`
- `contentWarning` state: shown below custom text input when blocked
- Input `onChange` clears `contentWarning`

### User-facing message
> 🚫 That theme isn't available for stories. Try something like animals, space, or magic!

---

## Files Changed
- `backend/image_gen.py` — `_is_safe_for_children`, `ThemeCheckRequest/Response`, `/api/check-theme`, safety check in `sketch_preview`
- `frontend/src/screens/ThemeSelect.tsx` — `unsafe` flag handling, `contentWarning` state, async `handleGo`
