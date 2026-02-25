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

## Optional: Video Generation with Veo 3 (Post-Story Feature)

> **This is an optional stretch feature.** Video generation takes 30–90 seconds per clip
> and is significantly more expensive than image generation. It should only trigger
> after the story session has ended — never during live audio streaming.

### Concept

Once the story ends and the scene grid is populated with still images, offer the child
a **"Bring my story to life!"** button. This animates each scene image into a short
4–8 second video clip using **Veo 3.1** on Vertex AI, then plays them back as a
mini storybook movie.

```
Story ends → "Bring to life!" button appears
  ↓
For each generated scene image:
  POST /api/video  { image_b64, motion_hint, image_style, session_id }
    ↓
  Veo 3.1 image-to-video (async long-running operation, poll every 10s)
    ↓
  Return mp4 bytes as base64 → frontend <video> element
```

---

### Why Image-to-Video (not Text-to-Video)

We already have the scene images from Phase 3. Feeding them to Veo as `starting_image`
gives visual consistency — the animated clip will look exactly like the illustration
the child just saw, but now with motion. Text-to-video would generate a completely
new scene with different visual style.

---

### Backend: `/api/video` endpoint

```python
# backend/video_gen.py
import asyncio
import base64
import os
import time
from google import genai
from google.genai import types
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

PROJECT_ID = os.environ["GOOGLE_CLOUD_PROJECT"]
LOCATION = os.environ.get("GOOGLE_CLOUD_LOCATION", "us-central1")
VIDEO_MODEL = "veo-3.1-generate-001"
VIDEO_MODEL_FAST = "veo-3.1-fast-generate-001"   # lower latency, slightly lower quality


class VideoRequest(BaseModel):
    image_data: str        # base64 PNG — the scene image from Phase 3
    motion_hint: str       # short description of what should move (from story text)
    image_style: str       # character's art style string
    session_id: str
    fast: bool = True      # use fast model by default to reduce latency


class VideoResponse(BaseModel):
    video_data: str        # base64 mp4
    mime_type: str = "video/mp4"


@router.post("/api/video", response_model=VideoResponse)
async def generate_scene_video(request: VideoRequest):
    """Animate a story scene image into a short video clip using Veo 3."""

    client = genai.Client(vertexai=True, project=PROJECT_ID, location=LOCATION)
    model = VIDEO_MODEL_FAST if request.fast else VIDEO_MODEL

    # Decode the base64 image
    image_bytes = base64.b64decode(request.image_data)

    # Build a child-safe motion prompt from the story context
    prompt = (
        f"child-safe animation, gentle motion, storybook style, "
        f"{request.image_style}, "
        f"{request.motion_hint.strip()}"
    )

    operation = client.models.generate_videos(
        model=model,
        prompt=prompt,
        image=types.Image(image_bytes=image_bytes, mime_type="image/png"),
        config=types.GenerateVideosConfig(
            aspect_ratio="4:3",
            number_of_videos=1,
            duration_seconds=6,
            resolution="720p",
            person_generation="dont_allow",   # child-safe: no generated people
            enhance_prompt=True,
            generate_audio=False,             # audio comes from Gemini Live, not Veo
        ),
    )

    # Poll until complete (Veo is a long-running operation)
    max_wait = 120  # seconds
    waited = 0
    while not operation.done:
        await asyncio.sleep(10)
        waited += 10
        operation = client.operations.get(operation)
        if waited >= max_wait:
            raise HTTPException(status_code=504, detail="Video generation timed out")

    if not operation.response:
        raise HTTPException(status_code=500, detail="Video generation failed")

    video_bytes = operation.result.generated_videos[0].video.video_bytes
    video_b64 = base64.b64encode(video_bytes).decode("utf-8")

    return VideoResponse(video_data=video_b64)
```

Register the router in `main.py`:
```python
from video_gen import router as video_router
app.include_router(video_router)
```

---

### Motion Hint Extraction

The `motion_hint` tells Veo what should move in the scene. Extract it from the story
transcription that triggered the image (already available in `SceneDetector`):

```python
def extract_motion_hint(scene_text: str) -> str:
    """
    Pull a short action phrase from the story text to use as Veo motion prompt.
    Falls back to a generic 'gentle swaying, leaves rustling' if text is too long.
    """
    # Take first sentence and trim to 80 chars — Veo doesn't need a novel
    first_sentence = scene_text.split(".")[0].strip()
    if len(first_sentence) > 80:
        return "gentle movement, soft breeze, storybook animation"
    return first_sentence
```

---

### Frontend: `useStoryVideos` hook

```typescript
// frontend/src/hooks/useStoryVideos.ts
import { useState, useCallback } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

interface VideoScene {
  sceneId: string;
  status: "idle" | "loading" | "ready" | "error";
  videoData: string | null;  // base64 mp4
}

export function useStoryVideos() {
  const [videos, setVideos] = useState<Record<string, VideoScene>>({});

  const animateScene = useCallback(async (
    sceneId: string,
    imageData: string,
    motionHint: string,
    imageStyle: string,
    sessionId: string,
  ) => {
    setVideos(prev => ({
      ...prev,
      [sceneId]: { sceneId, status: "loading", videoData: null },
    }));

    try {
      const res = await fetch(`${API_BASE}/api/video`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_data: imageData,
          motion_hint: motionHint,
          image_style: imageStyle,
          session_id: sessionId,
          fast: true,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      setVideos(prev => ({
        ...prev,
        [sceneId]: { sceneId, status: "ready", videoData: data.video_data },
      }));
    } catch (err) {
      console.error("[story-videos] Failed:", err);
      setVideos(prev => ({
        ...prev,
        [sceneId]: { sceneId, status: "error", videoData: null },
      }));
    }
  }, []);

  return { videos, animateScene };
}
```

---

### Frontend: Animated Scene Card (post-story)

After story ends, scene cards swap from `<img>` to `<video>` if a video is ready:

```tsx
// In StorySceneCard — post-story video overlay
{sessionEnded && videoScene?.status === "ready" && videoScene.videoData ? (
  <video
    src={`data:video/mp4;base64,${videoScene.videoData}`}
    autoPlay
    loop
    muted
    playsInline
    className="w-full h-full object-cover"
  />
) : (
  <img
    src={`data:${scene.mimeType};base64,${scene.imageData}`}
    alt="Story scene"
    className="w-full h-full object-cover"
  />
)}
```

---

### "Bring to life!" Button

Shown in the post-story gallery when at least one scene image exists:

```tsx
{sessionState === "ended" && scenes.length > 0 && !hasAnimated && (
  <button
    onClick={() => {
      setHasAnimated(true);
      scenes.forEach(scene => {
        if (scene.status === "loaded" && scene.imageData) {
          animateScene(
            scene.id,
            scene.imageData,
            scene.description,   // used as motion_hint
            character.imageStyle,
            sessionId,
          );
        }
      });
    }}
    className="font-bangers text-2xl px-8 py-3 rounded-full
               bg-gradient-to-r from-yellow-400 to-orange-400
               text-white shadow-lg hover:scale-105 transition-transform"
  >
    ✨ Bring my story to life!
  </button>
)}
```

---

### Latency & Cost Considerations

| Model | Typical latency | Relative cost |
|---|---|---|
| `veo-3.1-generate-001` | 60–90s per clip | Higher |
| `veo-3.1-fast-generate-001` | 30–45s per clip | Lower |

- **Max 8 scenes** from Phase 3 image cap → max 8 video requests per story
- **Generate in parallel** (`Promise.all` on the frontend) to reduce total wall time
- **Don't block** the gallery — show the still image immediately, swap to video when ready
- Consider adding a **per-session video cap** (e.g. 3 clips max) to control costs
- All Veo videos include **SynthID** watermarking by default

---

### Alternative: Story Recap with Frame Interpolation (Advanced)

Veo 3.1 supports **frame interpolation** — specify a first and last frame and it
generates the transition between them. For TaleWeaver this could create a
continuous cinematic sweep through all the scenes:

```python
# Interpolate from scene N to scene N+1 for a flowing story recap
operation = client.models.generate_videos(
    model=VIDEO_MODEL,
    prompt="gentle scene transition, storybook style, soft camera pan",
    image=types.Image(image_bytes=scene_1_bytes, mime_type="image/png"),
    config=types.GenerateVideosConfig(
        last_frame=types.Image(image_bytes=scene_2_bytes, mime_type="image/png"),
        aspect_ratio="16:9",
        number_of_videos=1,
        duration_seconds=6,
        resolution="720p",
        person_generation="dont_allow",
        generate_audio=False,
    ),
)
```

This produces one fluid clip per scene pair, which could then be stitched into a
full story movie on the frontend using the Web Codecs API or served as separate
sequential `<video>` elements.

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
