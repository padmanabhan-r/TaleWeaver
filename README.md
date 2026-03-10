# TaleWeaver

A voice-first interactive storytelling app for kids aged 4–10, powered by Google Gemini Live API. Children pick a beloved storyteller character, then bring anything to life and start weaving a story from a theme of their choice.

**Pick a theme** from a curated set of adventures and life skills, or type anything that sparks your child's imagination. **Bring any toy or object from around your home** to life using the Magic Camera — hold it up, snap a photo, and watch Gemini reimagine it as a storybook character. **Sketch anything in your mind** — a robot, a fairy, a dragon — and see your drawing transformed into a story-starting illustration.

Turn your child's screen time into something genuinely fun and creative — a real-time voice conversation that co-creates a magical, personalised tale with AI-generated illustrations appearing as the story unfolds.

**Live:** https://taleweaver.online

---

## Features

- **10 storyteller characters** — 5 English (Wizard Wally, Fairy Flora, Captain Coco, Robo Ricky, Draco the Dragon) and 5 Indian language storytellers (Dadi Maa/Hindi, Raja Vikram/Marathi, Little Hanuman/Tamil, Rajkumari Meera/Telugu, Rishi Bodhi/Bengali)
- **Three ways to start a story** — Pick a theme tile, use the Magic Camera to hold up a prop, or Sketch a Theme on a drawing canvas
- **Real-time bidirectional voice** via WebSocket + Gemini Live API — the child can interrupt, redirect, or react at any moment
- **Native audio** — no TTS/STT round-trips; Gemini handles voice directly at 24kHz
- **Story pre-warm** — before the session starts, a single Flash Lite call generates a coherent plan + opening line + first illustration; the opening is spoken word-for-word by Gemini Live so narration and the first image always align
- **Smart illustration timing** — Gemini calls a `generate_illustration` tool at visually rich moments (new location, character reveal, dramatic transformation); images match what Gemini just described rather than firing on a clock
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
- **Multilingual** — Indian storytellers tell stories in Hindi, Marathi, Tamil, Telugu, and Bengali
- **15-minute session timeout** — idle sessions close automatically

---

## Tech Stack

| Layer | Technology |
|---|---|
| Conversation | `gemini-live-2.5-flash-native-audio` via Vertex AI |
| Story pre-warm | `gemini-2.5-flash-lite` — generates plan + opening + scene in one call |
| Content moderation | `gemini-2.5-flash-lite` — safety-checks themes, sketches, and camera props |
| Image generation | `gemini-2.0-flash-preview-image-generation` via Gemini API key — raw narration passed directly, no intermediate extraction |
| Story recap | `gemini-2.0-flash-preview-image-generation` — interleaved `TEXT` + `IMAGE` output |
| Backend | Python 3.13 + FastAPI + WebSocket |
| Frontend | React 19 + Vite + TailwindCSS v4 + TypeScript + Framer Motion |
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
        Option A: Pick a Theme — adventure tiles + 5 life skills + free-text custom
        Option B: Magic Camera — live viewfinder → capture prop → safety check
                  → AI recreates prop as storybook illustration → confirm & start
        Option C: Sketch a Theme — draw on canvas (19 colours) → AI recreates drawing
                  → confirm illustrated version → start story

    → POST /api/story-opening → Flash Lite (single call)
        → generates story plan + opening line + visual scene description
        → image model generates first illustration from scene
        → all three are coherent (same characters, setting, plot)
        → Begin button activates (~5–8s)

    → StoryScreen mounts → useLiveAPI.connect()
        → WebSocket → backend /ws/story
        → backend connects to Gemini Live API (Vertex AI)
        → sends character system prompt + voice config
        → tells Gemini: "say this opening word for word, then continue"
        → mic capture starts (AudioWorklet, 16kHz PCM)
        → first illustration seeds the canvas immediately

Story plays
    → Gemini speaks → 24kHz PCM → playback worklet → speakers
    → Gemini calls generate_illustration tool at key visual moments
        → frontend responds immediately (Gemini doesn't wait)
        → POST /api/image with Gemini's scene description (raw narration, no extraction step)
        → previous image + previous scene description passed for visual continuity
        → base64 image → StorySceneGrid (shimmer → fade-in)
    → turnComplete fallback fires if no tool call in ~30s
        → POST /api/image with raw turn transcription

Achievement badges
    → Gemini calls awardBadge tool when child makes a genuine creative contribution
    → BadgePopup appears centred on screen, auto-dismisses after 3s

Pause / Resume
    → Pause mutes playback and suspends mic capture
    → Resume restores both — session and WebSocket stay alive

Child interrupts
    → Gemini VAD detects speech → playback clears
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
