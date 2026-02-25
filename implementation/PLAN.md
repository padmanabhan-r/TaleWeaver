# Taleweaver — Interactive Kid's Comic Creator
### Build Plan

---

## Overview

A voice-driven, kid-friendly web app where a child speaks a story idea and watches
a comic strip generate in real time — panel by panel, each with a Gemini-generated
illustration and a narrated caption read aloud by the browser.

**Challenge category:** Creative Storyteller
**Key differentiator:** Gemini's native interleaved TEXT + IMAGE output streams panels
progressively — text and illustration appear together before the next panel starts.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Model | `gemini-2.5-flash-preview-05-20` with `response_modalities=["TEXT","IMAGE"]` on Vertex AI |
| Backend | Python 3.12 + FastAPI + google-genai SDK |
| Transport | WebSocket (Cloud Run native support) |
| Frontend | React 19 + Vite + TailwindCSS v4 |
| Voice In | Web Speech API (`SpeechRecognition`) |
| Voice Out | Web Speech API (`speechSynthesis`) |
| Hosting | Cloud Run (backend) + Firebase Hosting (frontend) |
| IaC | `cloudbuild.yaml` (bonus points) |

---

## Repository Structure (after rewrite)

```
/
├── backend/
│   ├── main.py            # FastAPI app — WebSocket /story endpoint
│   ├── session.py         # StorySession — conversation history + panel counter
│   ├── comic.py           # generate_comic() — Gemini interleaved streaming
│   ├── Dockerfile         # Clean Python image, no Playwright
│   ├── requirements.txt   # fastapi, uvicorn, google-genai, python-dotenv
│   └── .env.example       # GOOGLE_CLOUD_PROJECT, GOOGLE_CLOUD_LOCATION
├── frontend/
│   ├── index.html         # Loads Google Fonts (Bangers, Comic Neue)
│   ├── src/
│   │   ├── App.jsx                    # Root layout
│   │   ├── index.css                  # Kid theme + keyframe animations
│   │   ├── hooks/
│   │   │   └── useStory.js            # WebSocket + SpeechRecognition + TTS
│   │   └── components/
│   │       ├── MicButton.jsx          # Big animated mic button
│   │       ├── ComicStrip.jsx         # Panel grid container
│   │       └── ComicPanel.jsx         # Single panel (caption + image)
│   ├── .env               # VITE_WS_URL
│   └── package.json
├── cloudbuild.yaml         # Build → push → Cloud Run deploy
├── .gitignore
└── PLAN.md                 # This file
```

**Delete (Kestrel leftovers):**
- `backend/agent/` (loop.py, browser.py, gemini.py, actions.py)
- `frontend/src/hooks/useAgent.js`
- `frontend/src/components/BrowserView.jsx`
- `frontend/src/components/ActionLog.jsx`
- `frontend/src/components/InstructionBar.jsx`
- `frontend/src/components/StatusBadge.jsx`
- `frontend/src/components/ModeSelector.jsx`

---

## Phase 1 — Backend

### 1.1 `session.py` — StorySession

Holds multi-turn conversation history so follow-up commands like
"make the dragon purple" have full context.

```python
class StorySession:
    def __init__(self):
        self.history = []      # list of {role, parts} dicts
        self.panel_count = 0

    def add_user_turn(self, text: str):
        self.history.append({"role": "user", "parts": [{"text": text}]})

    def add_model_turn(self, parts: list):
        self.history.append({"role": "model", "parts": parts})

    def to_gemini_history(self) -> list:
        return self.history
```

### 1.2 `comic.py` — Gemini Interleaved Generator

Core of the app. Calls Vertex AI with `response_modalities=["TEXT","IMAGE"]`
and yields structured chunks the WebSocket layer forwards directly to the frontend.

**System prompt (key points):**
- You are a comic storyteller for kids aged 5–10
- Generate 4–5 panels per story
- For each panel: output narration text FIRST, then the illustration
- Keep images colorful, cartoonish, child-safe
- Simple vocabulary, short sentences

**Streaming logic:**
```python
async def generate_comic(session: StorySession):
    client = genai.Client(vertexai=True, project=PROJECT, location=LOCATION)
    panel_num = 0
    collected_parts = []

    async for chunk in await client.aio.models.generate_content_stream(
        model="gemini-2.5-flash-preview-05-20",
        contents=session.to_gemini_history(),
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            response_modalities=["TEXT", "IMAGE"],
        ),
    ):
        for part in chunk.candidates[0].content.parts:
            collected_parts.append(part)
            if part.text:
                panel_num += 1
                yield {"type": "text", "panel": panel_num, "content": part.text}
            elif part.inline_data:
                b64 = base64.b64encode(part.inline_data.data).decode()
                yield {"type": "image", "panel": panel_num,
                       "data": b64, "mime": part.inline_data.mime_type}

    session.add_model_turn(collected_parts)   # save for multi-turn continuity
    yield {"type": "done"}
```

**Why collect parts and save after?**
Gemini history requires the full model turn at once. We collect while streaming
and commit it only when the stream ends — this keeps history correct for follow-ups.

### 1.3 `main.py` — FastAPI WebSocket Server

```
POST /story  (WebSocket upgrade)
  ← { type: "user_input", text: "..." }
  → { type: "text",  panel: N, content: "..." }
  → { type: "image", panel: N, data: "<b64>", mime: "image/png" }
  → { type: "done" }
  → { type: "error", content: "..." }
```

One `StorySession` per WebSocket connection — multi-turn within a session,
fresh session on reconnect.

Safety: Gemini safety settings set to `BLOCK_LOW_AND_ABOVE` for all harm categories.

### 1.4 `Dockerfile`

Clean image — no Playwright, no system deps.

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
ENV PORT=8080
EXPOSE 8080
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
```

### 1.5 `requirements.txt`

```
fastapi>=0.133.0
uvicorn[standard]>=0.41.0
google-genai>=1.64.0
google-cloud-aiplatform>=1.139.0
python-dotenv>=1.2.1
```

---

## Phase 2 — Frontend

### 2.1 Visual Design

**Theme:** Bright, playful, child-friendly
- Background: warm gradient (sky blue → soft purple)
- Font: "Bangers" for headings, "Comic Neue" for panel captions
- Comic panels: white cards, thick black border (4px), slight drop shadow, rounded corners
- Panels animate in with a "pop" scale effect when they first appear

**Layout:**
```
┌─────────────────────────────────┐
│   ✨ Taleweaver ✨               │  ← Header (Bangers font)
│   "What story shall we tell?"   │  ← Status line
├─────────────────────────────────┤
│                                 │
│  [Panel 1]  [Panel 2]           │  ← Comic strip (horizontal scroll
│  [Panel 3]  [Panel 4]           │    or 2×2 grid on desktop)
│                                 │
├─────────────────────────────────┤
│         🎙  [ BIG MIC ]         │  ← MicButton
└─────────────────────────────────┘
```

### 2.2 `useStory.js` — Core Hook

**State:**
```javascript
panels      // [{id, caption, imageData, imageMime}]
status      // 'idle' | 'listening' | 'thinking' | 'streaming' | 'done' | 'error'
isListening // boolean
```

**WebSocket messages handled:**
| type | action |
|---|---|
| `text` | Create or update panel caption; call `speak(content)` |
| `image` | Find panel by id; attach imageData |
| `done` | Set status → 'done' |
| `error` | Set status → 'error'; show message |

**Speech Recognition:**
```javascript
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)()
recognition.lang = 'en-US'
recognition.continuous = false
recognition.interimResults = false
recognition.onresult = (e) => sendToBackend(e.results[0][0].transcript)
```

**TTS (narration):**
```javascript
const speak = (text) => {
  const utter = new SpeechSynthesisUtterance(text)
  utter.pitch = 1.2   // slightly high — child-friendly
  utter.rate  = 0.85  // slightly slow — easier to follow
  window.speechSynthesis.speak(utter)
}
```

### 2.3 `MicButton.jsx`

- Large round button (96×96px minimum, touch-friendly)
- Default: blue/purple gradient, mic icon
- `isListening=true`: red with CSS pulse ring animation
- `isStreaming=true`: disabled, animated spinner ring
- Shows status label below ("Tap to tell a story", "I'm listening...", "Drawing!")

### 2.4 `ComicPanel.jsx`

```jsx
// Props: id, caption, imageData, imageMime, isNew
// isNew=true plays the pop-in animation

<div className="comic-panel">
  {imageData
    ? <img src={`data:${imageMime};base64,${imageData}`} />
    : <div className="placeholder-shimmer" />   // loading shimmer while image streams
  }
  <p className="caption">{caption}</p>
</div>
```

**Shimmer placeholder:** Shows while waiting for the image part to arrive after
the text part. Gives the kid instant feedback that a panel is being drawn.

### 2.5 `index.css` additions

```css
@keyframes pop-in {
  0%   { transform: scale(0.5); opacity: 0; }
  80%  { transform: scale(1.05); }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes mic-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.5); }
  50%       { box-shadow: 0 0 0 20px rgba(239,68,68,0); }
}

.comic-panel { animation: pop-in 0.4s ease forwards; }
.mic-pulse   { animation: mic-pulse 1.2s ease infinite; }
```

### 2.6 `index.html`

Add Google Fonts link:
```html
<link href="https://fonts.googleapis.com/css2?family=Bangers&family=Comic+Neue:wght@700&display=swap" rel="stylesheet">
<title>Taleweaver</title>
```

---

## Phase 3 — Infrastructure

### 3.1 `cloudbuild.yaml`

```yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/kidcomic-backend', './backend']

  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/kidcomic-backend']

  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - run
      - deploy
      - kidcomic-backend
      - '--image=gcr.io/$PROJECT_ID/kidcomic-backend'
      - '--region=us-central1'
      - '--platform=managed'
      - '--allow-unauthenticated'
      - '--timeout=3600'
      - '--memory=512Mi'
      - '--cpu=1'
      - '--set-env-vars=GOOGLE_CLOUD_PROJECT=$PROJECT_ID,GOOGLE_CLOUD_LOCATION=us-central1,GOOGLE_GENAI_USE_VERTEXAI=true'
```

**Auth:** Cloud Run service uses the default compute service account.
Grant it `roles/aiplatform.user` in IAM before deploying.

**No API key in env vars** — Vertex AI auth is handled by the attached service account.

### 3.2 Frontend `.env`

```
VITE_WS_URL=wss://<cloud-run-url>/story
```

Built into the static bundle at Firebase deploy time.

### 3.3 Firebase Hosting

```bash
cd frontend && npm run build
firebase deploy --only hosting
```

---

## Phase 4 — Multi-turn & Edit Handling

After the initial story streams, the mic stays active for follow-ups.

**Follow-up flow:**
1. Kid says "make the dragon purple" or "what happens next?"
2. `useStory.js` sends `{ type: "user_input", text: "..." }` over the existing WebSocket
3. Backend appends to `session.history` and calls `generate_comic()` again
4. If the message is a continuation ("what happens next?"), new panels append
5. If it's an edit ("change panel 2"), the backend re-streams that panel with
   `{ type: "replace", panel: 2 }` and the frontend swaps just that card

Edit detection (backend, simple keyword rules):
```python
EDIT_KEYWORDS = ["change", "make", "turn", "redraw", "redo", "different"]
is_edit = any(k in user_text.lower() for k in EDIT_KEYWORDS)
```

---

## Phase 5 — Safety & Child-Friendliness

| Layer | Measure |
|---|---|
| Gemini safety | `BLOCK_LOW_AND_ABOVE` on all harm categories |
| System prompt | Explicit instruction: no violence, horror, adult content, or frightening imagery |
| Frontend only | No text input box — voice only, no way to type arbitrary prompts |
| Input guard | Server strips text > 200 chars (can't paste long jailbreak prompts via voice) |

---

## Stretch Features (post-MVP)

- **Download comic** — "Download my comic!" button → backend stitches panels into a
  single PNG strip using Pillow and returns it as a file download
- **Character lock** — "Save my dragon" → stores character description in session,
  injects into every subsequent panel prompt for visual consistency
- **Background music** — Soft looping royalty-free audio via `<audio>` tag, switches
  genre based on detected mood keywords in the narration
- **Language switch** — Change `SpeechRecognition.lang` and `SpeechSynthesisUtterance.lang`
  for Hindi, Tamil, Spanish etc. — same Gemini backend handles it natively

---

## End-to-End Message Flow

```
Kid speaks
    → SpeechRecognition (browser)
    → { type: "user_input", text: "a story about a brave little robot" }
    → WebSocket → Cloud Run /story
    → StorySession.add_user_turn()
    → generate_comic(session)
    → Vertex AI: gemini-2.5-flash-preview-05-20
      responseModalities = [TEXT, IMAGE]
      streams:
        TextPart  "One day, Bolt the robot woke up..."  → panel 1 caption
        ImagePart <robot waking up, cartoon style>      → panel 1 image
        TextPart  "He found a mysterious locked door."  → panel 2 caption
        ImagePart <robot staring at door, colorful>     → panel 2 image
        ...
    → Backend yields chunks over WebSocket
    → Frontend: panel card pops in, caption renders, image loads
    → speechSynthesis.speak(caption) → kid hears the story
```

---

## What Makes This Win

1. **Hits the category requirement literally** — Gemini outputs text and images
   interleaved in a single stream. Not two separate calls, one stream.

2. **Demo is 30 seconds and magical** — Kid speaks, panels appear and are narrated.
   Judges can see and hear it working immediately.

3. **Genuinely kid-first** — Voice only, no text box, safe content, fun visuals.
   Clear problem, clear user.

4. **Bonus boxes checked** — IaC via `cloudbuild.yaml`, Cloud Run + Firebase
   (two GCP services), Vertex AI auth via service account (no key exposure).

---

## Build Order

1. `backend/session.py` + `backend/comic.py` (core logic, testable in isolation)
2. `backend/main.py` (wire WebSocket → comic generator)
3. `backend/Dockerfile` + `requirements.txt` (containerize)
4. `frontend/src/hooks/useStory.js` (state machine + WebSocket + speech)
5. `frontend/src/components/` (MicButton, ComicPanel, ComicStrip)
6. `frontend/src/App.jsx` + `index.css` + `index.html` (final assembly)
7. `cloudbuild.yaml` (deploy pipeline)
8. Local end-to-end test
9. Deploy to Cloud Run + Firebase
