# TaleWeaver

**TaleWeaver turns everyday objects into magical stories.**

A voice-first interactive storytelling app for kids aged **4–10**, powered by **Google Gemini Live API**.

Children simply pick a storyteller, hold up a toy or draw an idea, and begin a **real-time conversation** where the AI and child co-create a story together.

Using **Gemini Live**, the storyteller speaks, listens, adapts to interruptions, and generates illustrations as the adventure unfolds.

Kids don't just listen to a story — **they shape it.**

---

## Live Demo

**https://taleweaver.online**

No account required.
Just allow microphone access and start your adventure.

---

# The Experience

Children start a story in **three magical ways**:

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

---

### 3. Sketch a Theme

Kids can **draw anything** on a canvas.

The AI turns the drawing into a **storybook illustration** and starts a story around it.

Draw a robot, a dragon, a castle, a flying whale — and watch it come to life.

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

The AI instantly adapts the story.

---

# AI-Generated Illustrations

As the story unfolds, **illustrations appear automatically**.

Images are generated when a new location appears, a character is introduced, or a dramatic moment happens.

Each new image receives the **previous image as context**, ensuring:

- Consistent characters
- Stable art style
- Visual continuity across scenes

---

# Story Recap

When the adventure ends, the app generates a **storybook recap**.

Children get:

- A story title
- Illustrated scenes
- Narration captions
- Creativity badges

All stories are saved in the **Past Adventures gallery**.

---

# Key Features

- **Voice-first storytelling** using Gemini Live API
- **Real-time interruption (barge-in)** — kids can change the story anytime
- **AI-generated illustrations** throughout the story
- **Magic Camera** — turn toys into story characters
- **Sketch-to-story** drawing canvas (19 colours)
- **10 storyteller characters**
- **Multilingual storytellers** — Hindi, Tamil, Mandarin, Spanish, French
- **Creative achievement badges**
- **Pause / resume stories**
- **Story recap storybook**
- **Past Adventures gallery**
- **Kid-safe content moderation**
- **Life skills storytelling themes**

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

---

# Screenshots

### Landing Page

<p align="center">
  <img src="images/0. TaleWeaver - Landing Page.png" width="800"/>
</p>

---

### Choose Your Storyteller

<p align="center">
  <img src="images/1. Choose Storyteller.png" width="800"/>
</p>

---

### Choose How to Start

<p align="center">
  <img src="images/2. Pick mode.png" width="800"/>
</p>

---

### Pick a Theme

<p align="center">
  <img src="images/3. Pick a theme.png" width="800"/>
</p>

---

### Magic Camera

<p align="center">
  <img src="images/4. Magic camera - photo.png" width="400"/>
  <img src="images/5. Magic camera - image.png" width="400"/>
</p>

---

### Sketch a Theme

<p align="center">
  <img src="images/6. Sketch - drawing.png" width="400"/>
  <img src="images/7. Sketch - image.png" width="400"/>
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

---

# Tech Stack

| Layer | Technology |
|---|---|
| Conversation | `gemini-live-2.5-flash-native-audio` |
| Moderation | `gemini-2.5-flash-lite` |
| Character TTS | `gemini-2.5-flash-preview-tts` |
| Image generation | `gemini-3.1-flash-image-preview` |
| Story recap | `gemini-2.5-flash-lite` |
| Backend | Python 3.13 + FastAPI + WebSocket |
| Frontend | React 19 + Vite + TypeScript + TailwindCSS + Framer Motion |
| Audio I/O | Web Audio API + AudioWorklet |
| Hosting | Google Cloud Run |
| CI/CD | Google Cloud Build |
| Domain | taleweaver.online |

---

# Architecture Overview

```
Browser (React)
│
├── WebSocket → Backend
│     └── Gemini Live API (voice conversation)
│
├── POST /api/image
│     └── Gemini image generation
│
├── POST /api/tts
│     └── Gemini TTS
│
├── POST /api/check-theme
│     └── Gemini moderation
│
└── POST /api/story-recap
      └── Gemini generates storybook captions
```

The backend is a **WebSocket proxy** — it authenticates with GCP and forwards bidirectional audio/text between the browser and Gemini Live API. It never stores audio; everything streams through.

---

# Audio Pipeline

**Capture**

```
Mic → 16kHz PCM → WebSocket → Gemini Live
```

**Playback**

```
Gemini → 24kHz PCM → AudioBufferSourceNode → Speakers
```

This allows **real-time streaming voice conversations**.

---

# Deployment

Deployed on **Google Cloud Run**.

Multi-stage Docker build:

1. Node 22 builds React frontend
2. Python 3.13 serves API + static files

CI/CD pipeline:

```
GitHub push → Cloud Build → Artifact Registry → Cloud Run
```

Secrets managed via **GCP Secret Manager**.

---

# Running Locally

### Backend

```bash
cd backend
pip install -r requirements.txt

export GOOGLE_CLOUD_PROJECT=your-project
export GOOGLE_CLOUD_LOCATION=us-central1
export GOOGLE_GENAI_USE_VERTEXAI=true
export IMAGE_MODEL=gemini-3.1-flash-image-preview
export IMAGE_LOCATION=global
export GEMINI_API_KEY=your_key_here

gcloud auth application-default login
uvicorn main:app --reload --port 8000
```

### Frontend

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

Then open http://localhost:5173

---

# Reproducible Testing

Open **https://taleweaver.online** — no account, no setup required.

### Quick start

1. Click **Begin Your Adventure**
2. Choose a storyteller
3. Select a theme
4. Allow microphone access
5. The story begins instantly

### Feature checklist

| Feature | How to test |
|---|---|
| **Voice narration** | Character speaks within 2–3 s with no prompting |
| **Barge-in** | Speak while the character is talking — narration stops, your words are woven in |
| **AI illustrations** | Images appear as the story progresses; each matches the current scene |
| **Visual continuity** | Characters look consistent across multiple images in the same session |
| **Magic Camera** | Choose "Magic Camera", hold up any toy, tap the shutter; see it become the story's hero |
| **Sketch a Theme** | Draw anything, see it recreated as a storybook illustration |
| **Achievement badge** | Suggest a creative idea ("add a flying whale!") — a badge may appear on screen |
| **Pause / Resume** | Tap the pause button mid-story; tap again to resume |
| **Story Recap** | Tap "End Story" → open "📖 See our story!" for the illustrated storybook |
| **Past Adventures** | Return to home → tap "Past Adventures" to re-read all saved stories |
| **Multilingual** | Pick Dadi Maa (Hindi), Raja Vikram (Tamil), Yé Ye (Mandarin), Abuelo Miguel (Spanish), or Mamie Claire (French) |
| **Content moderation** | On "Pick a Theme → Custom theme", type something inappropriate — it will be blocked |
| **Life skills** | Pick any character → "Pick a Theme" → select a life skill tile (Courage, Kindness, etc.) |
