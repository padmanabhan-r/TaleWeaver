# Phase 4.5 — Theme Selection ✅ DONE

A screen inserted between `CharacterSelect` and `StoryScreen` giving children three ways to spark their adventure.

---

## Three Entry Points

### Option A — Pick a Theme
- Grid of 12 adventure tiles: Animals, Space, Kingdoms, Ocean, Jungle, Dragons, Robots, Fairies, Pirates, Mystery, Dinosaurs, Weather
- 5 life skills tiles: Sharing 🤝, Courage 💪, Gratitude 🙏, Creativity 🎨, Kindness 🌍
- Free-text custom input with `/api/check-theme` safety check before proceeding

### Option B — Magic Camera
- Live camera viewfinder with scan-line overlay and corner reticles
- Child holds up a physical prop (toy, book, drawing)
- Captured still → `/api/sketch-preview` → Flash Lite identifies object → Gemini recreates as storybook illustration
- Child confirms the illustrated version before the story starts
- Safety check on the identified label — blocks unsafe content

### Option C — Sketch a Theme
- Drawing canvas with 19 colours + eraser + clear
- Child draws anything
- Canvas submitted to `/api/sketch-preview` → Flash Lite labels it → Gemini recreates as storybook illustration
- Sequential processing: label extracted first (15s timeout), then label passed as `subject_hint` to image gen — ensures label matches image
- Child confirms the illustrated version before the story starts
- Safety check on label after extraction — returns HTTP 400 `unsafe_content` if blocked

---

## Implementation

**Frontend:** `ThemeSelect.tsx`
- AnimatePresence accordion: only one card expanded at a time
- Cards container: `overflow-y-auto min-h-0`, `justify-start` when expanded to prevent top clipping
- Preview image: `max-h-72 object-contain`
- Compact card header when expanded (smaller padding + emoji + title, description hidden)

**Backend:** `image_gen.py`
- `/api/sketch-preview`: accepts base64 image → runs Flash Lite label extraction → safety check → generates storybook illustration
- `_generate_from_sketch(image_data, label)`: label passed as `subject_hint` in prompt
- `/api/check-theme`: accepts text string → `_is_safe_for_children()` → returns `{ safe: bool }`

**Data flow:**
```
App.tsx (selectedTheme, propImage, sketchImage)
  → StoryScreen props
  → useLiveAPI.connect()
  → WebSocket init message { character_id, theme, prop_image }
  → proxy.py Begin! turn (three branches):
      camera_prop → multimodal inline_data + strong instruction
      theme set   → directive with theme name
      no theme    → plain "Begin!"
```

---

## Files Changed
- `frontend/src/screens/ThemeSelect.tsx` — new screen (accordion, camera, sketch, moderation)
- `frontend/src/App.tsx` — new route + state for theme/propImage
- `frontend/src/screens/StoryScreen.tsx` — accepts and forwards theme/propImage
- `frontend/src/hooks/useLiveAPI.ts` — sends theme/propImage in init message
- `backend/main.py` — new `/api/sketch-preview`, `/api/check-theme` endpoints (via image_router)
- `backend/image_gen.py` — `sketch_preview`, `check_theme`, `_generate_from_sketch`, `_is_safe_for_children`
- `backend/proxy.py` — three-branch Begin! message
