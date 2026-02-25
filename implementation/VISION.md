# TaleWeaver — Vision & Architecture
## "A Living Storyteller for Every Child"

---

## The Experience

A child opens TaleWeaver and is greeted by a cast of animated storyteller characters.
She taps **Grandma Rose** — the character wakes up, smiles, and says in a warm voice:
*"Hello sweetheart! I've been waiting for you. What kind of story shall we tell tonight?"*

The child says: *"A story about a baby dragon who can't breathe fire!"*

Grandma Rose chuckles, settles in, and begins to tell the tale — her voice natural, warm,
unhurried. As she speaks, a colorful scene appears: a tiny dragon with a worried face
standing in front of unlit candles.

The child interrupts: *"Make him wear a hat!"*

Grandma Rose laughs and says: *"Oh of course! And what a magnificent hat it was — tall,
purple, with a star on top..."* A new scene appears. The child is hooked.

This is not an app with a microphone button. It is a conversation with a character who
loves stories as much as the child does.

---

## Core Design Principles

1. **The character IS the interface** — No buttons, no menus during the story. The child
   talks to the character; the character responds.

2. **Seamless interruption** — Like a real storyteller, the character stops mid-sentence
   when the child speaks. No awkward delays, no "please wait."

3. **Visuals as punctuation** — Story scene images appear naturally as the tale unfolds,
   reinforcing the narrative without distracting from it.

4. **Warm and alive** — Native AI audio (not robotic browser TTS). Real emotion, pacing,
   and personality.

5. **Child-safe by design** — Every layer has safety controls. Voice-only input prevents
   typed jailbreaks. The system prompt enforces age-appropriate content.

---

## Storyteller Characters

| Character | Personality | Voice | Story Style |
|---|---|---|---|
| **Grandma Rose** | Warm, cozy, loving | Aoede (soft female) | Bedtime, fairy tales, gentle adventures |
| **Captain Leo** | Bold, exciting, fun | Charon (warm male) | Sea adventures, treasure hunts, brave heroes |
| **Fairy Sparkle** | Magical, whimsical, bubbly | Kore (bright female) | Magic, enchantment, talking animals |
| **Professor Whiz** | Curious, clever, encouraging | Puck (friendly male) | Science adventures, inventor tales |
| **Dragon Blaze** | Energetic, funny, enthusiastic | Fenrir (big warm voice) | Dragon stories, silly adventures, humor |

Each character has:
- A unique animated SVG/Lottie avatar with idle/speaking/listening states
- A distinct visual art style injected into every image generation prompt
- A deeply crafted system prompt defining their personality and storytelling approach
- An assigned Gemini voice name

---

## Technology Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CHILD'S BROWSER                          │
│                                                                 │
│  ┌─────────────────┐    ┌──────────────────────────────────┐   │
│  │ Character        │    │ Story Scene Panel                 │   │
│  │ Selection Screen │    │ (AI-generated images)             │   │
│  │                  │    │                                   │   │
│  │ [Rose][Leo]      │    │  ┌────────────────────────────┐  │   │
│  │ [Spark][Whiz]    │    │  │  Scene image appears here  │  │   │
│  │ [Blaze]          │    │  │  as the story unfolds      │  │   │
│  └─────────────────┘    │  └────────────────────────────┘  │   │
│                          └──────────────────────────────────┘   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              MAIN STORY SCREEN                             │ │
│  │                                                            │ │
│  │   ┌──────────────────────────┐   ┌──────────────────────┐ │ │
│  │   │  Animated Character      │   │  Story Scene Images  │ │ │
│  │   │  Avatar                  │   │                      │ │ │
│  │   │  [idle / speaking /      │   │  Scene 1  Scene 2    │ │ │
│  │   │   listening / thinking]  │   │  Scene 3  ...        │ │ │
│  │   │                          │   │                      │ │ │
│  │   └──────────────────────────┘   └──────────────────────┘ │ │
│  │                                                            │ │
│  │   Subtitle/transcript (optional, faint)                    │ │
│  │                                                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  AudioWorklet CAPTURE (16kHz PCM) → WebSocket           │   │
│  │  AudioWorklet PLAYBACK (24kHz PCM) ← WebSocket          │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │ WebSocket (ws://)
                              │ bidirectional PCM + control messages
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (Cloud Run)                          │
│                                                                 │
│  FastAPI + Python 3.12                                          │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  /ws/story  — Gemini Live API WebSocket Proxy           │   │
│  │                                                         │   │
│  │  • Intercepts first message for session setup           │   │
│  │  • Injects character system prompt + voice config       │   │
│  │  • Adds auth token from service account                 │   │
│  │  • Bidirectional proxy: browser ↔ Gemini Live API       │   │
│  │  • Monitors output transcriptions for image triggers    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  POST /api/image  — Story Scene Generator               │   │
│  │                                                         │   │
│  │  • Receives scene description text                      │   │
│  │  • Calls Gemini image generation API                    │   │
│  │  • Returns base64 PNG                                   │   │
│  │  • Applies character-specific art style                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  GET /api/health  — Health check                        │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴──────────┐
                    │                    │
                    ▼                    ▼
        ┌───────────────────┐  ┌──────────────────────────┐
        │  Gemini Live API  │  │  Gemini Image Generation  │
        │                   │  │                           │
        │  gemini-live-2.5  │  │  gemini-2.0-flash-       │
        │  -flash-native-   │  │  preview-image-generation │
        │  audio            │  │                           │
        │                   │  │  response_modalities=     │
        │  • Native audio   │  │  ["TEXT","IMAGE"]         │
        │  • Real-time VAD  │  │                           │
        │  • Barge-in       │  │  • Colorful, cartoonish   │
        │  • Transcription  │  │  • Child-safe             │
        │  • Affective AI   │  │  • Character art style    │
        └───────────────────┘  └──────────────────────────┘
```

---

## Key Gemini Live API Capabilities Used

### 1. Native Audio (NOT browser TTS)
- Input: 16kHz raw PCM via AudioWorklet → WebSocket
- Output: 24kHz raw PCM via WebSocket → AudioWorklet
- Result: The character sounds warm, natural, human-like. Not robotic.

### 2. Bidirectional Real-Time Streaming
- The browser streams audio continuously
- Gemini streams audio back continuously
- True duplex — simultaneous send and receive

### 3. Barge-In / Interruption
```
serverContent.interrupted = true
→ Clear audio playback buffer immediately
→ Character stops mid-sentence
→ Child's input is processed
```

### 4. Voice Activity Detection (VAD)
- Automatic silence detection (no push-to-talk needed)
- `start_of_speech_sensitivity`, `end_of_speech_sensitivity` tuned for children
- `prefix_padding_ms: 500` — captures the start of the child's voice

### 5. Output Transcription
- Real-time transcript of what the character says
- Used to trigger image generation at scene boundaries
- Optionally shown as subtle subtitles

### 6. Affective Dialog
- `enable_affective_dialog: true`
- The character responds to the emotional tone of the child
- If the child sounds excited → character gets excited too
- If the child sounds confused → character slows down and explains

### 7. Proactive Audio
- `proactivity.proactive_audio: true`
- Character can break silences, ask questions, encourage the child
- Like a real storyteller who notices when the audience goes quiet

---

## Image Generation Strategy

The key challenge: **when** to generate images and **what** to generate.

### Trigger Mechanism
The backend monitors **output transcriptions** from the Live API. When a turn completes:
1. Transcription text is sent to an image trigger analyzer
2. Uses simple pattern matching + keyword detection for scene-worthy moments:
   - Location descriptions ("in a castle", "at the bottom of the ocean")
   - Character introductions ("a tiny dragon appeared")
   - Action climaxes ("and then he jumped over the moon")
3. Image generation API call is made in parallel (non-blocking)
4. When the image is ready, it's pushed to the frontend via a separate WebSocket message

### Parallel Architecture
- Live API conversation continues uninterrupted
- Image generation runs in a background task
- Images "pop in" when they're ready — no waiting

### Art Style per Character
Each character has an image prompt prefix:
- **Grandma Rose**: "warm watercolor illustration, soft colors, storybook style, gentle..."
- **Captain Leo**: "bold comic book style, saturated colors, action-packed, nautical..."
- **Fairy Sparkle**: "sparkly magical illustration, pastel rainbow colors, glitter, enchanted forest..."
- **Professor Whiz**: "clean cartoon infographic style, bright scientific, cheerful lab..."
- **Dragon Blaze**: "bold cartoon style, vibrant fiery colors, funny expressions, dragon..."

---

## Message Flow (Full End-to-End)

```
1. Child selects Grandma Rose
   → Frontend sends character config to backend
   → Backend loads Rose's system prompt + Aoede voice
   → Live API session opened

2. Live API sends intro audio
   → "Hello sweetheart! What story shall we tell?"
   → 24kHz PCM flows to browser → AudioWorklet plays it
   → Rose's avatar mouth animates

3. Child speaks: "A baby dragon who can't breathe fire"
   → AudioWorklet captures 16kHz PCM
   → Streams to backend → Gemini Live API
   → VAD detects end of speech

4. Gemini Live API responds:
   → Audio chunks stream back (24kHz PCM)
   → Output transcription arrives in parallel
   → "Once upon a time, in the warmest cave in the whole mountain..."

5. Backend monitors transcription for scene trigger
   → Detects "in the warmest cave in the whole mountain"
   → Fires POST /api/image with scene description + Rose's art style
   → Image generation runs in background

6. Frontend plays audio, animates Rose's mouth
   → Image arrives 2-4 seconds later
   → Scene panel pops into the story area

7. Child interrupts: "Make him wear a hat!"
   → AudioWorklet detects child speaking
   → Live API sends serverContent.interrupted = true
   → Frontend clears audio buffer → Rose stops speaking
   → Child's audio streams to Gemini
   → Rose responds: "Oh of course! And what a hat it was..."
```

---

## Safety Architecture

| Layer | Control |
|---|---|
| Gemini safety settings | `BLOCK_LOW_AND_ABOVE` for all harm categories |
| System prompt | Explicit age-appropriate content constraints |
| Voice-only input | No text box — no typed jailbreaks possible |
| Image generation prompt | "child-safe, age-appropriate, cartoon, no violence" prefix on every call |
| Input length guard | Backend rejects transcriptions > 300 chars |
| Content review | output transcriptions monitored; session terminated on policy violation |

---

## File Structure

```
/
├── implementation/
│   ├── VISION.md                    ← This file
│   ├── PHASE_0_CHARACTER_SELECTION.md
│   ├── PHASE_1_LIVE_API_BACKEND.md
│   ├── PHASE_2_AUDIO_STREAMING.md
│   ├── PHASE_3_STORY_VISUALIZATION.md
│   ├── PHASE_4_CHARACTER_ANIMATION.md
│   ├── PHASE_5_STORY_INTELLIGENCE.md
│   └── PHASE_6_DEPLOYMENT.md
├── backend/
│   ├── main.py                      # FastAPI app
│   ├── proxy.py                     # Gemini Live API WebSocket proxy
│   ├── image_gen.py                 # Image generation endpoint
│   ├── characters.py                # Character configs + system prompts
│   ├── scene_detector.py            # Transcription → image trigger
│   ├── Dockerfile
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── screens/
    │   │   ├── CharacterSelect.jsx   # Character picker
    │   │   └── StoryScreen.jsx       # Main story experience
    │   ├── components/
    │   │   ├── CharacterAvatar.jsx   # Animated character
    │   │   ├── StoryScene.jsx        # Scene image panel
    │   │   └── Subtitle.jsx          # Optional transcript display
    │   ├── hooks/
    │   │   ├── useLiveAPI.js         # Gemini Live API connection
    │   │   ├── useAudioCapture.js    # Mic → 16kHz PCM
    │   │   └── useAudioPlayback.js   # 24kHz PCM → speaker
    │   └── characters/
    │       ├── index.js              # Character registry
    │       ├── grandma-rose/         # Rose's assets + config
    │       ├── captain-leo/
    │       ├── fairy-sparkle/
    │       ├── professor-whiz/
    │       └── dragon-blaze/
    └── public/
        └── audio-processors/
            ├── capture.worklet.js   # AudioWorklet: mic capture
            └── playback.worklet.js  # AudioWorklet: speaker output
```

---

## Build Phases Summary

| Phase | Focus | Key Deliverable |
|---|---|---|
| Phase 0 | Character Selection UI | Beautiful picker screen, character configs |
| Phase 1 | Live API Backend | WebSocket proxy, auth, session management |
| Phase 2 | Audio Streaming | 16kHz capture, 24kHz playback, interruption |
| Phase 3 | Story Visualization | Image generation, scene trigger, display |
| Phase 4 | Character Animation | Avatar states, lip-sync, emotion responses |
| Phase 5 | Story Intelligence | System prompts, multi-turn, story memory |
| Phase 6 | Deployment | Cloud Run + Firebase, IaC, monitoring |
