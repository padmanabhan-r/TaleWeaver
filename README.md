# TaleWeaver

A voice-first interactive storytelling app for kids aged 4–10, powered by Google Gemini Live API. Children pick a beloved storyteller character, then bring anything to life and start weaving a story from a theme of their choice.

**Pick a theme** from a curated set of adventures and life skills, or type anything that sparks your child's imagination. **Bring any toy or object from around your home** to life using the Magic Camera — hold it up, snap a photo, and watch Gemini reimagine it as a storybook character. **Sketch anything in your mind** — a robot, a fairy, a dragon — and see your drawing transformed into a story-starting illustration.

Turn your child's screen time into something genuinely fun and creative — a real-time voice conversation that co-creates a magical, personalised tale with AI-generated illustrations appearing as the story unfolds.

**Live:** https://taleweaver.online

---

## Features

- **10 storyteller characters** — 5 English (Wizard Wally, Fairy Flora, Captain Coco, Robo Ricky, Draco the Dragon) and 5 Indian language storytellers (Dadi Maa/Hindi, Raja Vikram/Marathi, Little Hanuman/Tamil, Rajkumari Meera/Telugu, Rishi Bodhi/Bengali)
- **Three ways to start a story** — Pick a theme tile, use the Magic Camera to hold up a real-world prop, or Sketch a Theme on a drawing canvas
- **Real-time bidirectional voice** via WebSocket + Gemini Live API — the child can interrupt, redirect, or add ideas at any moment
- **Native audio** — no TTS/STT round-trips; Gemini handles voice directly at 24kHz
- **Story pre-warm** — before the session starts, a single Flash Lite call generates a coherent plan + opening line + first illustration; the opening is spoken word-for-word by Gemini Live so narration and image always align
- **Smart illustration timing** — Gemini calls a `generate_illustration` tool at visually rich moments (new location, character reveal, dramatic transformation); images match what Gemini just described
- **Visual continuity** — each image generation passes the previous image + scene description as context; characters and art style stay consistent across all scenes
- **Unlimited scene illustrations** — images generate continuously throughout the session with no cap
- **Past Adventures gallery** — every session is auto-saved to localStorage with all images and narrations; tap any story to read it as an illustrated storybook
- **Story Recap** — after the session ends, view a scrollable storybook with per-scene narrations drawn directly from the story transcript; no extra AI calls needed
- **Achievement badges** — Gemini awards a badge (max 2 per session) when the child makes a genuinely creative contribution; badge appears on screen instantly, auto-dismisses after 3 s
- **Pause / Resume** — child (or parent) can pause and resume the story at any time without losing the session
- **Life skills themes** — Sharing, Courage, Gratitude, Creativity, Kindness alongside adventure themes
- **Content moderation** — typed themes, sketches, and camera props are safety-checked before the story starts
- **Sketch a Theme** — drawing canvas with 19 colours; sketch is recreated as a storybook illustration and becomes the story's starting image
- **Kid-safe** — all characters are warm, age-appropriate, and tuned for children aged 4–10; story never ends unless the child presses End Story
- **Multilingual** — Indian storytellers tell stories in Hindi, Marathi, Tamil, Telugu, and Bengali; language-locked (characters never switch to English even if asked)
- **15-minute session timeout** — idle sessions close automatically
- **Graceful shutdown** — Cloud Run SIGTERM handled cleanly; active sessions receive a proper WebSocket close frame within the 30 s grace window

---

## Tech Stack

| Layer | Technology |
|---|---|
| Conversation | `gemini-live-2.5-flash-native-audio` via Vertex AI |
| Story pre-warm | `gemini-2.5-flash-lite` — generates plan + opening + scene in one call |
| Content moderation | `gemini-2.5-flash-lite` — safety-checks themes, sketches, and camera props |
| Image generation | `gemini-2.0-flash-preview-image-generation` — raw narration passed directly, no extraction step |
| Story recap title | `gemini-2.5-flash-lite` — generates a 4–6 word storybook title from the opening image |
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
| dragon | Draco the Dragon | English | Fenrir |
| dadi | Dadi Maa | Hindi हिंदी | Autonoe |
| maharaja | Raja Vikram | Marathi मराठी | Umbriel |
| hanuman | Little Hanuman | Tamil தமிழ் | Alnilam |
| rajkumari | Rajkumari Meera | Telugu తెలుగు | Kore |
| rishi | Rishi Bodhi | Bengali বাংলা | Puck |

---

## Screenshots

### Landing Page
![Landing Page](images/0.%20TaleWeaver%20-%20Landing%20Page.png)

### Choose Your Storyteller
![Choose Storyteller](images/1.%20Choose%20Storyteller.png)

### Choose How to Start
![Pick Mode](images/2.%20Pick%20mode.png)

### Pick a Theme
![Pick a Theme](images/3.%20Pick%20a%20theme.png)

### Magic Camera — Capture a Prop & See It Reimagined
<table>
<tr>
<td><img src="images/4.%20Magic%20camera%20-%20photo.png" alt="Magic Camera - Photo" width="480"/></td>
<td><img src="images/5.%20Magic%20camera%20-%20image.png" alt="Magic Camera - Illustrated" width="480"/></td>
</tr>
</table>

### Sketch a Theme — Draw & See It Come to Life
<table>
<tr>
<td><img src="images/6.%20Sketch%20-%20drawing.png" alt="Sketch - Drawing" width="480"/></td>
<td><img src="images/7.%20Sketch%20-%20image.png" alt="Sketch - Illustrated" width="480"/></td>
</tr>
</table>

---

## How It Works

```
Child opens app → Landing page (ambient music, floating animations)
    → "Begin Your Adventure" → CharacterSelect
    → picks a character → ThemeSelect
        Option A: Pick a Theme — adventure tiles + 5 life skills + free-text custom
        Option B: Magic Camera — live viewfinder → capture prop → safety check
                  → AI recreates prop as storybook illustration → confirm & start
        Option C: Sketch a Theme — draw on canvas (19 colours) → AI recreates drawing
                  → confirm illustrated version → start story

    → POST /api/story-opening → Flash Lite (single call)
        → generates story plan + opening line + visual scene description
        → image model generates first illustration from scene
        → all three are coherent (same characters, setting, plot)
        → Begin button activates (~5–8 s)

    → StoryScreen mounts → useLiveAPI.connect()
        → WebSocket → backend /ws/story
        → backend connects to Gemini Live API (Vertex AI)
        → sends character system prompt + voice config
        → await asyncio.sleep(0) → both proxy tasks are running
        → sends "Begin!" directly to Gemini Live
        → mic capture starts (AudioWorklet, 16kHz PCM)
        → AudioContext resumed after mic starts (Safari compatibility)
        → first illustration seeds the canvas immediately

Story plays
    → Gemini speaks → 24kHz PCM → AudioBufferSourceNode scheduling → speakers
    → Gemini calls generate_illustration tool at key visual moments
        → frontend responds immediately (Gemini doesn't wait)
        → POST /api/image with Gemini's scene description
        → previous image + scene description passed for visual continuity
        → base64 image → StorySceneGrid (shimmer → fade-in)
    → turnComplete fallback fires if no tool call in ~30 s
        → POST /api/image with raw turn transcription

Achievement badges
    → Gemini calls awardBadge tool when child makes a genuine creative contribution
    → BadgePopup appears centred on screen, auto-dismisses after 3 s

Pause / Resume
    → Pause mutes playback (gain = 0) and suspends mic AudioContext
    → Resume restores both — session and WebSocket stay alive

Child interrupts (barge-in)
    → Gemini VAD detects speech → in-flight audio buffer cleared
    → Gemini weaves child's words into the next story beat

Session ends (child says stop or presses End Story)
    → Story auto-saved to localStorage with all images + narrations from transcript
    → "📖 See our story!" button appears
    → POST /api/story-recap with session images + transcript narrations
        → single Flash Lite call generates storybook title from opening image
        → narrations come directly from transcript (no extra LLM calls)
    → StoryRecapModal renders scrollable storybook

Past Adventures
    → "Past Adventures" button on landing page shows all saved sessions
    → each session opens as a full illustrated storybook
    → title generated on first open if not already cached
```

---

## Reproducible Testing

The app is live at **https://taleweaver.online** — no account, no setup required.

### Quick start (2 minutes)

1. Open https://taleweaver.online on a device with a microphone
2. Click **Begin Your Adventure**
3. Pick any storyteller character (try **Wizard Wally** for English, **Dadi Maa** for Hindi)
4. Choose **Pick a Theme** → select an adventure (e.g. "Space Adventure") or type anything custom
5. Wait ~5–8 s for the first illustration to appear, then click **Begin**
6. Allow microphone access when prompted
7. The character will start narrating immediately — speak to redirect the story

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
| **Multilingual** | Pick **Dadi Maa** — the entire story is narrated in Hindi; try asking in English — she stays in Hindi |
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
export IMAGE_MODEL=gemini-2.0-flash-preview-image-generation
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
  ├── POST /api/story-opening ──→ Backend → Flash Lite (plan + opening + scene → image)
  ├── WebSocket /ws/story ───────→ Backend → Gemini Live API (Vertex AI)
  │     bidirectional audio/text proxy; no audio stored server-side
  ├── POST /api/image ───────────→ Backend → Gemini image gen
  └── POST /api/story-recap ─────→ Backend → Flash Lite (title only; narrations from transcript)
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

- Narrations come from the **story transcript** stored with each scene at session-save time — zero LLM calls for narration
- Only the **storybook title** requires a Flash Lite call (1 LLM call total, regardless of scene count)
- Eliminates the 429 RESOURCE_EXHAUSTED errors from 11-parallel narration calls

### Deployment

- Single Cloud Run service — multi-stage Docker: Node 22 builds React, Python 3.13 serves API + static files
- uvicorn with `--timeout-graceful-shutdown 25` — cleanly closes WebSocket sessions on SIGTERM before Cloud Run's 30 s SIGKILL
- CI/CD: push to `main` → Cloud Build → Artifact Registry → Cloud Run
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
export IMAGE_MODEL=gemini-2.0-flash-preview-image-generation
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
