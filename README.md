# TaleWeaver

A voice-first interactive storytelling app for kids aged 4–10, powered by Google Gemini Live API. Children pick a beloved storyteller character, then bring anything to life and start weaving a story from a theme of their choice.

**Pick a theme** from a curated set of adventures and life skills, or type anything that sparks your child's imagination. **Bring any toy or object from around your home** to life using the Magic Camera — hold it up, snap a photo, and watch Gemini reimagine it as a storybook character. **Sketch anything in your mind** — a robot, a fairy, a dragon — and see your drawing transformed into a story-starting illustration.

Turn your child's screen time into something genuinely fun and creative — a real-time voice conversation that co-creates a magical, personalised tale with AI-generated illustrations appearing as the story unfolds.

**Live:** https://taleweaver.online

---

## Features

- **10 storyteller characters** — 5 English storytellers (Wizard Wally, Fairy Flora, Captain Coco, Robo Ricky, Rajkumari Meera) and 5 world language storytellers (Dadi Maa/Hindi, Raja Vikram/Tamil, Yé Ye/Mandarin, Abuelo Miguel/Spanish, Mamie Claire/French)
- **Three ways to start a story** — Pick a theme tile, use the Magic Camera to hold up a real-world prop, or Sketch a Theme on a drawing canvas
- **Real-time bidirectional voice** via WebSocket + Gemini Live API — the child can interrupt, redirect, or add ideas at any moment
- **Native audio** — no TTS/STT round-trips; Gemini handles voice directly at 24kHz
- **Instant session start** — confirming a theme goes straight into the live session; no loading screen or pre-warm step
- **Smart illustration timing** — Gemini calls a `generate_illustration` tool at visually rich moments (new location, character reveal, dramatic transformation); images match what Gemini just described
- **Visual continuity** — each image generation passes the previous image + scene description as context; characters and art style stay consistent across all scenes
- **Unlimited scene illustrations** — images generate continuously throughout the session with no cap
- **Story Recap** — after the session ends, a Gemini call produces an interleaved storybook: narration captions for each illustration, rendered from the session's actual images; title, captions, and badges all saved to the gallery
- **Past Adventures** — completed stories are saved locally (localStorage) with title, images, narration captions, and badges; accessible from a "Past Adventures" button on the landing page
- **Achievement badges** — Gemini awards a badge when the child makes a genuinely creative contribution (a wild idea, a new character name, an unexpected story twist); badge appears on screen instantly, auto-dismisses after 3s
- **Pause / Resume** — child (or parent) can pause and resume the story at any time without losing the session
- **Home button** — every screen (CharacterSelect, ThemeSelect, StoryScreen) has a 🏠 home button that saves state and returns to the landing page
- **Life skills themes** — Sharing, Courage, Gratitude, Creativity, Kindness alongside adventure themes
- **Content moderation** — typed themes, sketches, and camera props are safety-checked before the story starts
- **Sketch a Theme** — drawing canvas with 19 colours; sketch is recreated as a storybook illustration and becomes the story's starting image
- **Kid-safe** — all characters are warm, age-appropriate, and tuned for children aged 4–10; story never ends unless the child presses End Story
- **Multilingual** — world language storytellers tell stories in Hindi, Tamil, Mandarin, Spanish, and French; language-locked (characters never switch to English even if asked)
- **15-minute session timeout** — idle sessions close automatically
- **Graceful shutdown** — Cloud Run SIGTERM handled cleanly; active sessions receive a proper WebSocket close frame within the 30 s grace window

---

## Tech Stack

| Layer | Technology |
|---|---|
| Conversation | `gemini-live-2.5-flash-native-audio` via Vertex AI |
| Content moderation | `gemini-2.5-flash-lite` — safety-checks themes, sketches, and camera props |
| Character TTS | `gemini-2.5-flash-preview-tts` — speaks prop/sketch label in character's voice on ThemeSelect |
| Image generation | `gemini-3.1-flash-image-preview` — raw narration passed directly, no extraction step |
| Story recap | `gemini-2.5-flash-lite` — generates storybook title + per-scene narrations from scene images (all in parallel) |
| Backend | Python 3.13 + FastAPI + WebSocket |
| Frontend | React 19 + Vite + TailwindCSS v3 + TypeScript + Framer Motion |
| Audio I/O | Web Audio API + AudioWorklet (16kHz capture); `AudioBufferSourceNode` scheduling (24kHz playback) |
| Auth | GCP Application Default Credentials for Vertex AI; Gemini API key for image gen |
| Hosting | Cloud Run — single service serves frontend + backend |
| Domain | taleweaver.online (custom domain mapped to Cloud Run) |
| CI/CD | Google Cloud Build — auto-deploys on every push to `main` |

---

## Characters

| ID | Name | Language | Voice |
|---|---|---|---|
| wizard | Wizard Wally | English | Puck |
| fairy | Fairy Flora | English | Aoede |
| pirate | Captain Coco | English | Charon |
| robot | Robo Ricky | English | Laomedeia |
| rajkumari | Rajkumari Meera | English (Indian tales) | Kore |
| dadi | Dadi Maa | Hindi हिंदी | Autonoe |
| rajvikram | Raja Vikram | Tamil தமிழ் | Umbriel |
| naInai | Yé Ye | Mandarin 普通话 | Alnilam |
| abuela | Abuelo Miguel | Spanish | Kore |
| mamie | Mamie Claire | French | Fenrir |

---

## Screenshots

### Landing Page
<p align="center">
  <img src="images/0. TaleWeaver - Landing Page.png" alt="TaleWeaver Landing Page" width="800"/>
</p>

### Choose Your Storyteller
<p align="center">
  <img src="images/1. Choose Storyteller.png" alt="Choose Your Storyteller" width="800"/>
</p>

### Choose How to Start
<p align="center">
  <img src="images/2. Pick mode.png" alt="Choose How to Start" width="800"/>
</p>

### Pick a Theme
<p align="center">
  <img src="images/3. Pick a theme.png" alt="Pick a Theme" width="800"/>
</p>

### Magic Camera — Capture a Prop & See It Reimagined
<p align="center">
  <img src="images/4. Magic camera - photo.png" alt="Magic Camera - Photo" width="400"/>
  <img src="images/5. Magic camera - image.png" alt="Magic Camera - Illustrated" width="400"/>
</p>

### Sketch a Theme — Draw & See It Come to Life
<p align="center">
  <img src="images/6. Sketch - drawing.png" alt="Sketch - Drawing" width="400"/>
  <img src="images/7. Sketch - image.png" alt="Sketch - Illustrated" width="400"/>
</p>

---

## How It Works

```
Child opens app → Landing page (ambient music, floating animations)
    → "Begin Your Adventure" → CharacterSelect
    → picks a character → ThemeSelect
        Option A: Pick a Theme — 12 adventure tiles + 5 life skills + free-text custom
        Option B: Magic Camera — live viewfinder → capture prop → safety check
                  → AI labels prop → character speaks the label aloud via TTS
                  → AI recreates prop as storybook illustration → confirm & start
        Option C: Sketch a Theme — draw on canvas (19 colours) → AI labels sketch
                  → character speaks the label aloud via TTS
                  → AI recreates drawing as illustration → confirm & start

    → onConfirm() → StoryScreen mounts → useLiveAPI.connect()
        → WebSocket → backend /ws/story
        → backend connects to Gemini Live API (Vertex AI)
        → sends character system prompt + voice config
        → await asyncio.sleep(0) → both proxy tasks are running
        → sends "Begin!" directly to Gemini Live
        → mic capture starts (AudioWorklet, 16kHz PCM)
        → AudioContext resumed after mic starts (Safari compatibility)

Story plays
    → Gemini speaks → 24kHz PCM → AudioBufferSourceNode scheduling → speakers
    → Gemini calls generate_illustration tool at key visual moments
        → frontend responds immediately (Gemini doesn't wait)
        → POST /api/image with Gemini's scene description
        → previous image + scene description passed for visual continuity
        → base64 image → StorySceneGrid (shimmer → fade-in)
    → turnComplete fallback fires if no tool call in last 25 s and 8 s since last image
        → POST /api/image with raw turn transcription

Achievement badges
    → Gemini calls awardBadge tool when child makes a genuine creative contribution
    → BadgePopup appears centred on screen, auto-dismisses after 3 s

Pause / Resume
    → Pause mutes playback (gain = 0) and suspends mic AudioContext
    → Resume restores both — session and WebSocket stay alive

Home button (🏠 on CharacterSelect, ThemeSelect, StoryScreen)
    → saves current gallery state to localStorage
    → returns to landing page without losing previously saved stories

Child interrupts (barge-in)
    → Gemini VAD detects speech → in-flight audio buffer cleared
    → Gemini weaves child's words into the next story beat

Session ends (child says stop or presses End Story)
    → story + badges saved to localStorage gallery automatically
    → "📖 See our story!" button appears
    → POST /api/story-recap with session images
        → Gemini narrates each image in character voice
        → title + per-image narration captions returned
    → StoryRecapModal renders scrollable storybook
    → title + narration captions patched into localStorage gallery entry

Past Adventures (landing page)
    → "Past Adventures" modal shows story card grid (thumbnail, title, date)
    → tap any story → StorybookView: same storybook style as recap
        → title, per-image narrations, badges, "The End"
```

---

## Reproducible Testing

The app is live at **https://taleweaver.online** — no account, no setup required.

### Quick start (2 minutes)

1. Open https://taleweaver.online on a device with a microphone
2. Click **Begin Your Adventure**
3. Pick any storyteller character (try **Wizard Wally** for English, **Dadi Maa** for Hindi, **Mamie Claire** for French)
4. Choose **Pick a Theme** → select an adventure (e.g. "Space Adventure") or type anything custom
5. Allow microphone access when prompted — the session starts immediately
6. The character will start narrating within a few seconds — speak to redirect the story

### Feature checklist for judges

| Feature | How to test |
|---|---|
| **Voice narration starts automatically** | After clicking Begin, the character speaks within 2–3 s with no prompting |
| **Barge-in / interruption** | Speak while the character is talking — narration stops, your words are woven in |
| **AI-generated illustrations** | Images appear as the story progresses; each matches the current scene |
| **Visual continuity** | Characters look the same across multiple images in the same session |
| **Magic Camera** | On ThemeSelect, choose "Magic Camera", hold up any toy, tap the shutter; see it reimagined as a storybook character and become the story's hero |
| **Sketch a Theme** | Choose "Sketch a Theme", draw anything, see it recreated as a storybook illustration |
| **Achievement badge** | Suggest a creative story idea ("add a flying whale!") — a badge may appear on screen |
| **Pause / Resume** | Tap the pause button mid-story; tap again to resume from the same point |
| **End Story + Recap** | Tap "End Story" — the "📖 See our story!" button appears; open it for the illustrated storybook |
| **Past Adventures** | Go back to home; tap "Past Adventures" to see and re-read all saved stories |
| **Multilingual** | Pick **Dadi Maa** (Hindi), **Raja Vikram** (Tamil), **Yé Ye** (Mandarin), **Abuelo Miguel** (Spanish), or **Mamie Claire** (French) — each stays in their language even if the child speaks English |
| **Content moderation** | On "Pick a Theme → Custom theme", type something inappropriate — it will be blocked with a friendly message |
| **Life skills themes** | Pick any character → "Pick a Theme" → select a life skill tile (Sharing, Courage, etc.) |

### Running locally

**Prerequisites:** Google Cloud project with Vertex AI + Gemini API key.

**Backend** (port 8000):
```bash
cd backend
pip install -r requirements.txt

export GOOGLE_CLOUD_PROJECT=your-project-id
export GOOGLE_CLOUD_LOCATION=us-central1
export GOOGLE_GENAI_USE_VERTEXAI=true
export IMAGE_MODEL=gemini-3.1-flash-image-preview
export IMAGE_LOCATION=global
export GEMINI_API_KEY=your-gemini-api-key

gcloud auth application-default login
uvicorn main:app --reload --port 8000
```

**Frontend** (port 5173):
```bash
cd frontend
npm install

# Create frontend/.env.local
echo "VITE_WS_URL=ws://localhost:8000/ws/story" > .env.local
echo "VITE_API_URL=http://localhost:8000" >> .env.local

npm run dev
```

Open http://localhost:5173 and follow the Quick Start steps above.

---

## Architecture

### Data flow

```
Browser (React)
  ├── WebSocket /ws/story ───────→ Backend → Gemini Live API (Vertex AI)
  │     bidirectional audio/text proxy; no audio stored server-side
  ├── POST /api/check-theme ─────→ Backend → Flash Lite (safety check)
  ├── POST /api/sketch-preview ──→ Backend → Flash Lite (label) + image gen (illustration)
  ├── POST /api/tts ─────────────→ Backend → gemini-2.5-flash-preview-tts (character voice)
  ├── POST /api/image ───────────→ Backend → Gemini image gen (scene illustrations)
  └── POST /api/story-recap ─────→ Backend → Flash Lite (title + per-scene narrations, parallel)
```

### Begin! timing (critical path)

The very first audio Gemini produces must not be lost. The backend:
1. Opens the Gemini Live WebSocket
2. Creates `browser_to_gemini` and `gemini_to_browser` asyncio tasks
3. `await asyncio.sleep(0)` — yields one event-loop tick so both tasks start and `gemini_to_browser` enters its `async for` loop
4. Sends "Begin!" to Gemini Live
5. Gemini's audio response is now guaranteed to be forwarded as it arrives

### Audio pipeline

- **Capture:** Mic → 16kHz PCM via `capture.worklet.js` → base64 → WebSocket → Gemini Live
- **Playback:** Gemini → base64 24kHz PCM → `AudioBufferSourceNode` scheduling → speakers
  - Each chunk is scheduled at `max(currentTime, nextStartTime)` — works correctly even when Gemini streams faster than real-time
  - AudioContext resumed after `getUserMedia()` resolves (Safari compatibility)

### Image generation

Two paths, both hitting `POST /api/image`:

1. **Tool call path** (`generate_illustration` tool): Gemini picks the right visual moment and writes a painter-friendly scene description. `skip_extraction: true` — no extra LLM step. Bypasses rate-limit delays.
2. **Fallback path** (turn-complete): fires if no tool call in ~30 s. Passes raw transcript text. Rate-limited to avoid flooding.

Each call passes the previous image as reference for visual continuity.

### Story Recap

- `POST /api/story-recap` sends all session images to `gemini-2.5-flash-lite`
- Title generation (from first image) + all per-scene narrations run in **parallel** (`asyncio.gather`)
- Each narration is 2 sentences generated from the scene image in the character's storytelling voice
- Original session images are reused — no new images generated during recap

### Deployment

- Single Cloud Run service — multi-stage Docker: Node 22 builds React, Python 3.13 serves API + static files
- uvicorn with `--loop uvloop --http h11 --workers 1` — single worker, optimised for async I/O
- CI/CD: push to `main` → Cloud Build → Artifact Registry → Cloud Run (`cloudbuild.yaml`)
- Secrets: `GEMINI_API_KEY` from Secret Manager; GCP auth via Application Default Credentials

---

## Local Development

**Backend** (runs on port 8000):
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Set credentials for local Vertex AI access:
```bash
gcloud auth application-default login
export GOOGLE_CLOUD_PROJECT=your-project-id
export GOOGLE_CLOUD_LOCATION=us-central1
export IMAGE_MODEL=gemini-3.1-flash-image-preview
export IMAGE_LOCATION=global
export GEMINI_API_KEY=your_key_here
```

**Frontend** (runs on port 5173):
```bash
cd frontend
npm install
npm run dev
```

Create `frontend/.env.local`:
```
VITE_WS_URL=ws://localhost:8000/ws/story
VITE_API_URL=http://localhost:8000
```

---

## Deployment

Deployed at **https://taleweaver.online** (custom domain mapped to Cloud Run).

The multi-stage Dockerfile builds the React frontend and embeds it in the Python container. FastAPI serves both the API and the SPA from the same origin.

**CI/CD:** Every push to `main` triggers Cloud Build (`cloudbuild.yaml`) which builds, pushes to Artifact Registry, and deploys to Cloud Run automatically.

**Secrets:** `GEMINI_API_KEY` is stored in GCP Secret Manager and injected at runtime. No secrets in the image or source code.

See `implementation/PHASE_6_DEPLOYMENT.md` for full setup instructions.
