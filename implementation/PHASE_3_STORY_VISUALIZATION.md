# Phase 3 — Story Visualization

## Goal
As the character tells the story aloud, beautiful illustrated scenes appear on screen.
The visuals don't interrupt the audio — they appear naturally in parallel, like
illustrations in a pop-up book that turn the page themselves.

---

## Design Philosophy

Images appear as **story companions**, not story drivers.
- The audio (character's voice) is always primary
- Images appear when the story describes something visually rich
- They fade in gently — no jarring transitions
- Multiple scenes accumulate as the story grows
- Each image is a "snapshot" of a story moment

---

## Layout

### Desktop (side-by-side)
```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│   ┌────────────────────┐   ┌──────────────────────────┐  │
│   │                    │   │                          │  │
│   │  Animated          │   │  STORY SCENES            │  │
│   │  Character         │   │                          │  │
│   │  Avatar            │   │  ┌──────┐  ┌──────┐     │  │
│   │                    │   │  │Scene │  │Scene │     │  │
│   │  [speaking /       │   │  │  1   │  │  2   │     │  │
│   │   listening /      │   │  └──────┘  └──────┘     │  │
│   │   thinking]        │   │                          │  │
│   │                    │   │  ┌──────┐  ┌──────┐     │  │
│   │  ┌──────────────┐  │   │  │Scene │  │      │     │  │
│   │  │  subtitle    │  │   │  │  3   │  │shimm │     │  │
│   │  │  text (opt.) │  │   │  └──────┘  │er.. │     │  │
│   │  └──────────────┘  │   │            └──────┘     │  │
│   └────────────────────┘   └──────────────────────────┘  │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Mobile (stacked)
```
┌────────────────────────────────────┐
│  [Character Avatar — compact]      │
│  [Subtitle]                        │
├────────────────────────────────────┤
│  Story Scenes (horizontal scroll)  │
│  [Scene 1] [Scene 2] [Scene 3 ▷]  │
└────────────────────────────────────┘
```

---

## Image Generation Flow

```
Gemini Live API → outputTranscription.finished = true
    ↓
Backend: SceneDetector.process_transcription(text)
    ↓ (pattern match: does this contain a visual scene?)
    ↓ YES
POST /api/image
    {
      scene_description: "in the warmest cave in the whole mountain...",
      image_style: "warm watercolor illustration, storybook style...",
      session_id: "abc123"
    }
    ↓
Gemini Image Generation API
    model: gemini-2.0-flash-preview-image-generation
    response_modalities: ["IMAGE"]
    aspect_ratio: "4:3"
    ↓
Backend returns { image_data: "<base64>", mime_type: "image/png" }
    ↓
Frontend: image pops into scene grid
```

### Parallel Processing
Image generation (2-4 seconds) runs **completely in parallel** with:
- Ongoing character audio playback
- New audio chunks arriving
- Child speaking and interrupting

The story never pauses for an image to load.

---

## Frontend: Image State Management

### `useStoryImages.js`

```javascript
// frontend/src/hooks/useStoryImages.js
import { useState, useCallback, useRef } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";
const MAX_SCENES = 8;

/**
 * Manages story scene image generation and state.
 *
 * Returns:
 *   scenes: array of { id, status, imageData, mimeType, description }
 *   triggerImageGeneration: (transcriptionText, imageStyle, sessionId) => void
 */
export function useStoryImages() {
  const [scenes, setScenes] = useState([]);
  const pendingRef = useRef(new Set());
  const sceneCountRef = useRef(0);

  const triggerImageGeneration = useCallback(
    async (transcriptionText, imageStyle, sessionId) => {
      if (sceneCountRef.current >= MAX_SCENES) return;

      // Simple scene-worthiness check (backend also validates, this is fast pre-filter)
      const visualWords = ["castle", "dragon", "forest", "ocean", "mountain",
                           "cave", "village", "sky", "garden", "suddenly",
                           "appeared", "imagine", "picture", "there was"];
      const lower = transcriptionText.toLowerCase();
      const isVisual = visualWords.some(w => lower.includes(w));

      if (!isVisual && transcriptionText.split(" ").length < 20) return;

      const sceneId = `scene-${++sceneCountRef.current}`;

      // Optimistically add a "loading" scene card
      setScenes(prev => [
        ...prev,
        {
          id: sceneId,
          status: "loading",
          imageData: null,
          mimeType: null,
          description: transcriptionText.slice(0, 100),
        },
      ]);

      try {
        const response = await fetch(`${API_BASE}/api/image`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scene_description: transcriptionText.slice(0, 400),
            image_style: imageStyle,
            session_id: sessionId,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        // Update the scene card with the loaded image
        setScenes(prev =>
          prev.map(scene =>
            scene.id === sceneId
              ? {
                  ...scene,
                  status: "loaded",
                  imageData: data.image_data,
                  mimeType: data.mime_type,
                }
              : scene
          )
        );
      } catch (err) {
        console.error("[story-images] Generation failed:", err);
        // Remove the failed loading card silently
        setScenes(prev => prev.filter(s => s.id !== sceneId));
        sceneCountRef.current--;
      }
    },
    []
  );

  return { scenes, triggerImageGeneration };
}
```

---

## Frontend: Scene Display Components

### `StorySceneGrid.jsx`

```jsx
// frontend/src/components/StorySceneGrid.jsx

import { StorySceneCard } from "./StorySceneCard";

export function StorySceneGrid({ scenes }) {
  if (scenes.length === 0) return null;

  return (
    <div className="story-scene-grid">
      <div className="grid grid-cols-2 gap-4 overflow-y-auto max-h-[60vh]
                      p-2 rounded-2xl">
        {scenes.map((scene, index) => (
          <StorySceneCard
            key={scene.id}
            scene={scene}
            index={index}
            isLatest={index === scenes.length - 1}
          />
        ))}
      </div>
    </div>
  );
}
```

### `StorySceneCard.jsx`

```jsx
// frontend/src/components/StorySceneCard.jsx
import { useEffect, useRef } from "react";

export function StorySceneCard({ scene, index, isLatest }) {
  const cardRef = useRef(null);

  // Auto-scroll to latest scene
  useEffect(() => {
    if (isLatest && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [isLatest]);

  return (
    <div
      ref={cardRef}
      className={`
        relative rounded-2xl overflow-hidden border-4 border-white
        shadow-xl aspect-[4/3] bg-purple-100
        ${scene.status === "loaded" ? "scene-pop-in" : ""}
        ${isLatest && scene.status === "loaded" ? "ring-4 ring-yellow-400" : ""}
      `}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {scene.status === "loading" ? (
        // Shimmer loading state
        <SceneShimmer />
      ) : scene.imageData ? (
        // Loaded image
        <img
          src={`data:${scene.mimeType};base64,${scene.imageData}`}
          alt="Story scene"
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : null}

      {/* Scene number badge */}
      <div className="absolute top-2 left-2 bg-white/80 rounded-full
                      w-7 h-7 flex items-center justify-center
                      font-bangers text-sm text-purple-800 shadow">
        {index + 1}
      </div>
    </div>
  );
}

function SceneShimmer() {
  return (
    <div className="w-full h-full bg-gradient-to-br from-purple-200 via-pink-100
                    to-purple-200 animate-shimmer relative overflow-hidden">
      {/* Shimmer wave overlay */}
      <div className="absolute inset-0 shimmer-wave" />

      {/* Drawing icon */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl">🎨</span>
        <span className="font-comic-neue text-purple-600 text-sm mt-2">
          Drawing...
        </span>
      </div>
    </div>
  );
}
```

---

## CSS Animations

```css
/* Add to frontend/src/index.css */

/* Scene card pop-in when image loads */
@keyframes scene-pop-in {
  0%   { transform: scale(0.7) rotate(-2deg); opacity: 0; }
  60%  { transform: scale(1.05) rotate(1deg); opacity: 1; }
  80%  { transform: scale(0.98) rotate(-0.5deg); }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
}

.scene-pop-in {
  animation: scene-pop-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

/* Shimmer loading animation */
@keyframes shimmer {
  0%   { background-position: -200% center; }
  100% { background-position: 200% center; }
}

.animate-shimmer {
  background-size: 200% auto;
  animation: shimmer 1.5s linear infinite;
}

/* Shimmer wave overlay */
.shimmer-wave {
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255,255,255,0.4) 50%,
    transparent 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

/* Scene grid fade-in when first scene appears */
.story-scene-grid {
  animation: fade-up 0.4s ease forwards;
}

@keyframes fade-up {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

---

## Image Generation Prompt Engineering

Each call to the image API uses this prompt structure:

```
[SAFETY PREFIX] + [CHARACTER ART STYLE] + [SCENE DESCRIPTION]
```

**Example for Grandma Rose:**
```
child-safe illustration, age-appropriate for children aged 4-10, no violence,
no scary content, cartoon style,
warm watercolor illustration, storybook style, soft pastel colors,
cozy and gentle, children's picture book art, golden hour lighting,
a tiny brown bear with a little red hat sitting in front of a big wooden door in an enchanted forest
```

**Prompt construction in backend:**
```python
def build_image_prompt(scene_description: str, image_style: str) -> str:
    safety_prefix = (
        "child-safe illustration, age-appropriate for children aged 4-10, "
        "no violence, no scary content, no adult themes, cartoon style, "
        "colorful and cheerful, "
    )
    # Limit scene description to avoid overly complex prompts
    scene = scene_description[:300].strip()
    return f"{safety_prefix}{image_style}, {scene}"
```

---

## Scene Trigger Quality Improvement

### v1 (Pattern Matching) — implemented in Phase 1
Simple keyword and regex matching on output transcriptions.

### v2 (Structured Trigger via System Prompt) — optional enhancement
Add to character system prompt:
```
When you are describing a new scene or visual moment in the story,
begin the sentence with one of these markers:
- "Picture this:"
- "Imagine you see:"
- "There was:"
These help paint the story visually for the child.
```

Backend then looks specifically for these markers:
```python
STRONG_TRIGGER_PATTERNS = [
    r"Picture this:",
    r"Imagine you (see|can see):",
    r"There (was|were|stood|lived):",
    r"Once upon a time",
]
```

This makes trigger detection more reliable and precise.

---

## Image Queue: Preventing Flood

Multiple transcription turns can arrive quickly. We prevent image flooding:

```python
# backend/scene_detector.py
class SceneDetector:
    _MIN_SECONDS_BETWEEN_IMAGES = 15  # Don't generate faster than 1 per 15 seconds
    _last_image_time: float = 0

    async def process_transcription(self, text: str) -> None:
        import time
        now = time.time()
        if now - self._last_image_time < self._MIN_SECONDS_BETWEEN_IMAGES:
            return  # Rate limit
        if not self.should_generate_image(text):
            return

        self._last_image_time = now
        self._image_count += 1
        # ... proceed with generation
```

---

## Story Scene "Gallery" Mode (Stretch Feature)

After the story ends, the child can:
- See all scenes displayed as a storybook spread
- Tap a scene to see it full-screen
- A "Download my story!" button stitches all scenes into a printable PDF

```jsx
// Post-story gallery (shown when sessionState === "ended")
{sessionState === "ended" && scenes.length > 0 && (
  <StoryGallery scenes={scenes} characterName={character.name} />
)}
```

---

## Definition of Done

- [ ] Image generation API call works with character-specific art styles
- [ ] Loading shimmer appears immediately when image is triggered
- [ ] Image pops in with animation when ready (within 5 seconds)
- [ ] Multiple scenes accumulate in a grid as story progresses
- [ ] Latest scene auto-scrolls into view
- [ ] Image generation does NOT pause or interrupt audio
- [ ] Rate limiting prevents image flooding (max 1 per 15 seconds)
- [ ] Failed image generation silently removes the loading card
- [ ] Scene trigger works for at least 3 different story types tested
- [ ] All images are child-safe (safety settings validated)
- [ ] Grid is responsive: 2 columns on desktop, horizontal scroll on mobile
