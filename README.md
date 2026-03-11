# TaleWeaver

**TaleWeaver turns everyday objects into magical stories.**

A voice-first interactive storytelling app for kids aged **4–10**, powered by **Google Gemini Live API**.

Children simply pick a storyteller, hold up a toy or draw an idea, and begin a **real-time conversation** where the AI and child co-create a story together.

Using **Gemini Live**, the storyteller speaks, listens, adapts to interruptions, and generates illustrations as the adventure unfolds.

Kids don't just listen to a story — **they shape it.**

<p align="center">
  <img src="images/0. TaleWeaver - Landing Page.png" alt="TaleWeaver Landing Page" width="800"/>
</p>

---

# The Experience

Children start a story in **three magical ways**:

<p align="center">
  <img src="images/2. Pick mode.png" alt="Choose How to Start" width="800"/>
</p>

---

### 1. Pick a Theme

Choose from adventure themes or life-skills topics like:

- Space Adventure
- Underwater Quest
- Jungle Journey
- Courage
- Kindness
- Creativity
- Gratitude

Or type **anything their imagination invents**.

<p align="center">
  <img src="images/3. Pick a theme.png" alt="Pick a Theme" width="800"/>
</p>

---

### 2. Magic Camera

Hold up **any toy or object**.

The AI will:

1. Recognise the object
2. Transform it into a **storybook character**
3. Turn it into the **hero of the story**

Examples:

```
Toy dinosaur   → Brave jungle guardian
Stuffed bear   → Sleepy forest explorer
LEGO rocket    → Galactic rescue pilot
```

<p align="center">
  <img src="images/4. Magic camera - photo.png" alt="Magic Camera - Photo" width="400"/>
  <img src="images/5. Magic camera - image.png" alt="Magic Camera - Illustrated" width="400"/>
</p>

---

### 3. Sketch a Theme

Kids can **draw anything** on a canvas.

The AI turns the drawing into a **storybook illustration** and starts a story around it.

Draw a robot, a dragon, a castle, a flying whale — and watch it come to life.

<p align="center">
  <img src="images/6. Sketch - drawing.png" alt="Sketch - Drawing" width="400"/>
  <img src="images/7. Sketch - image.png" alt="Sketch - Illustrated" width="400"/>
</p>

---

# Real-Time Storytelling

Unlike traditional story generators, TaleWeaver is **fully conversational**.

Children can interrupt the storyteller, change the story direction, add characters, and invent new twists at any moment.

Example interaction:

```
AI:    The pirate ship sailed into a glowing storm...

Child: Add a flying whale!

AI:    Suddenly, a giant flying whale soared above the ship,
       lifting it out of the storm!
```

Barge-in is native — Gemini detects when the child starts speaking, stops the current narration, and weaves their words into the next story beat.

---

# AI-Generated Illustrations

As the story unfolds, **illustrations appear automatically**.

Gemini decides when to generate an illustration — at a new location, character reveal, or dramatic transformation. Images are generated from Gemini's own scene description, so they always match what was just narrated.

Each new image receives the **previous image as context**, ensuring:

- Consistent characters across all scenes
- Stable art style throughout the story
- Visual continuity with no manual prompting

---

# Story Recap

When the adventure ends, the app generates a **storybook recap**.

All session images are sent to Gemini, which generates a title and per-scene narrations in parallel. Original session images are reused — no new images generated during recap.

Children get a scrollable storybook with title, illustrated scenes, narration captions, and creativity badges. All saved to the **Past Adventures gallery**.

---

# Key Features

- **Voice-first storytelling** using Gemini Live API — native audio with no added latency
- **Real-time interruption (barge-in)** — kids can change the story anytime
- **Smart illustration timing** — Gemini decides the right visual moment automatically
- **Visual continuity** — each image is generated with the previous image as context
- **Unlimited scene illustrations** — images generate continuously with no cap
- **Magic Camera** — turn toys into story characters
- **Sketch-to-story** drawing canvas (19 colours)
- **10 storyteller characters** — 5 English + 5 world-language
- **Multilingual** — Hindi, Tamil, Mandarin, Spanish, French; language-locked (never switches to English)
- **Achievement badges** — Gemini awards a badge for genuine creative contributions; auto-dismisses after 3 s
- **Pause / resume** — mutes playback and suspends mic; session and WebSocket stay alive
- **Story recap storybook** — title + per-scene narrations generated in parallel
- **Past Adventures gallery** — all stories saved locally with title, images, captions, and badges
- **Kid-safe content moderation** — themes, sketches, and camera props safety-checked before story starts
- **Life skills themes** — Sharing, Courage, Gratitude, Creativity, Kindness
- **15-minute session timeout** — idle sessions close automatically
- **Graceful shutdown** — Cloud Run SIGTERM handled cleanly within the 30 s grace window

---

# Storyteller Characters

| Character | Language | Style |
|---|---|---|
| Wizard Wally | English | Magical adventures |
| Fairy Flora | English | Enchanted fairy tales |
| Captain Coco | English | Pirate adventures |
| Robo Ricky | English | Sci-fi robot stories |
| Rajkumari Meera | English | Indian folk tales |
| Dadi Maa | Hindi | Traditional bedtime stories |
| Raja Vikram | Tamil | Legendary Tamil tales |
| Yé Ye | Mandarin | Wise storytelling |
| Abuelo Miguel | Spanish | Warm family stories |
| Mamie Claire | French | Cozy storybook adventures |

Each storyteller **always speaks in their own language**.

<p align="center">
  <img src="images/1. Choose Storyteller.png" alt="Choose Your Storyteller" width="800"/>
</p>

---

# How It Works

```
Child opens app
↓
Landing Page
↓
Choose Storyteller
↓
Choose how to start story
├── Pick Theme
├── Magic Camera
└── Sketch Theme
↓
Story begins instantly
↓
Real-time voice conversation
↓
AI generates illustrations
↓
Child interrupts / adds ideas
↓
Story evolves dynamically
↓
End Story
↓
Storybook Recap
↓
Saved to Past Adventures
```

```
Child opens app → Landing page (ambient music, floating animations)
    → "Begin Your Adventure" → Choose a storyteller character
    → ThemeSelect
        Option A: Pick a Theme — 12 adventure tiles + 5 life skills + free-text custom
        Option B: Magic Camera — live viewfinder → capture prop → safety check
                  → AI labels prop → character speaks the label aloud
                  → AI recreates prop as storybook illustration → confirm & start
        Option C: Sketch a Theme — draw on canvas (19 colours) → AI labels sketch
                  → character speaks the label aloud
                  → AI recreates drawing as illustration → confirm & start

    → Story starts → WebSocket connects to backend → backend proxies to Gemini Live API
        → character system prompt + voice sent to Gemini
        → Gemini begins narrating immediately
        → mic capture starts (16kHz audio streamed to Gemini in real time)

Story plays
    → Gemini speaks → audio streamed to browser → played through speakers
    → Gemini triggers illustration at key visual moments
        → POST /api/image with Gemini's scene description
        → previous image passed for visual continuity
        → image fades in alongside the story
    → Fallback: if no illustration triggered in ~25 s, one is generated from the last narration

Achievement badges
    → Gemini awards a badge when the child makes a genuine creative contribution
    → Badge appears on screen, auto-dismisses after 3 s

Pause / Resume
    → Pause mutes playback and suspends mic — session stays alive
    → Resume restores both

Child interrupts (barge-in)
    → Gemini detects speech → stops current narration
    → weaves child's words into the next story beat

Session ends (child says stop or presses End Story)
    → story + badges saved to local gallery automatically
    → "📖 See our story!" button appears
    → POST /api/story-recap with all session images
        → Gemini generates title + per-image narration captions in parallel
    → scrollable storybook rendered and saved to gallery

Past Adventures (landing page)
    → story card grid (thumbnail, title, date)
    → tap any story → full storybook with narrations, badges, "The End"
```

---

# Tech Stack

| Layer | Technology |
|---|---|
| Conversation | `gemini-live-2.5-flash-native-audio` via Vertex AI |
| Content moderation | `gemini-2.5-flash-lite` — safety-checks themes, sketches, and camera props |
| Character TTS | `gemini-2.5-flash-preview-tts` — speaks prop/sketch label in character's voice on ThemeSelect |
| Image generation | `gemini-3.1-flash-image-preview` — scene description passed directly, no extraction step |
| Story recap | `gemini-2.5-flash-lite` — generates storybook title + per-scene narrations in parallel |
| Backend | Python 3.13 + FastAPI + WebSocket |
| Frontend | React 19 + Vite + TailwindCSS v3 + TypeScript + Framer Motion |
| Audio I/O | Web Audio API + AudioWorklet (16kHz capture, 24kHz playback) |
| Auth | GCP Application Default Credentials for Vertex AI; Gemini API key for image gen |
| Hosting | Cloud Run — single service serves frontend + backend |
| Domain | taleweaver.online (custom domain mapped to Cloud Run) |
| CI/CD | Google Cloud Build — auto-deploys on every push to `main` |

---

# Architecture

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

### Session start (critical path)

The backend ensures the first audio frame Gemini produces is never dropped:

1. Opens the Gemini Live WebSocket
2. Starts both proxy tasks (browser ↔ Gemini) concurrently
3. Sends "Begin!" to Gemini only after both tasks are running and ready to forward data
4. Gemini's audio response streams through immediately as it arrives

### Audio pipeline

- **Capture:** Mic → 16kHz PCM → WebSocket → Gemini Live (streamed in real time)
- **Playback:** Gemini → 24kHz PCM → scheduled audio playback → speakers
  - Chunks are scheduled precisely to handle bursts where Gemini streams faster than real-time
  - AudioContext starts after mic permission is granted (Safari compatibility)

### Image generation

Two paths, both hitting `POST /api/image`:

1. **Primary:** Gemini decides the right visual moment and writes a scene description. Image is generated immediately with no extra processing step.
2. **Fallback:** fires if no image has been triggered in ~25 s. Uses the last narration as the scene description. Rate-limited to avoid flooding.

Each request passes the previous image as reference for visual continuity.

### Deployment

- Single Cloud Run service — multi-stage Docker: Node 22 builds React, Python 3.13 serves API + static files
- Single async worker, optimised for WebSocket-heavy I/O
- CI/CD: push to `main` → Cloud Build → Artifact Registry → Cloud Run
- Secrets: `GEMINI_API_KEY` from Secret Manager; GCP auth via Application Default Credentials

---

# Reproducible Testing

The app is live at **https://taleweaver.online** — no account, no setup required.

### Quick start (2 minutes)

1. Open https://taleweaver.online on a device with a microphone
2. Click **Begin Your Adventure**
3. Pick any storyteller (try **Wizard Wally** for English, **Dadi Maa** for Hindi, **Mamie Claire** for French)
4. Choose **Pick a Theme** → select an adventure (e.g. "Space Adventure") or type anything custom
5. Allow microphone access when prompted — the session starts immediately
6. The character will start narrating within a few seconds — speak to redirect the story

### Feature checklist

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

---

# Running Locally

**Prerequisites:** Google Cloud project with Vertex AI enabled + Gemini API key.

### Backend (port 8000)

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

### Frontend (port 5173)

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

# Live Demo

**https://taleweaver-950758825854.us-central1.run.app**

Custom domain: **https://taleweaver.online**

No account required. Just allow microphone access and start your adventure.
