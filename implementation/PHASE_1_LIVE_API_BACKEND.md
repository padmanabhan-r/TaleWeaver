# Phase 1 — Live API Backend

## Goal
Build the Python FastAPI backend that:
1. Acts as a **WebSocket proxy** between the browser and Gemini Live API
2. Injects the **character system prompt** and **voice config** into each session
3. Exposes an **image generation endpoint** for story scenes
4. Handles **authentication** transparently using GCP service account credentials

---

## Why a Proxy Backend?

The Gemini Live API is accessed via a raw WebSocket to Vertex AI. The browser cannot
call this directly because:
- Auth tokens (Bearer) cannot be safely exposed to the browser
- CORS and SSL requirements need server-side handling
- We need to intercept the setup message to inject character configuration

The backend is a **thin, transparent proxy** — it adds auth and character config,
then gets out of the way. All real-time audio flows through it at full speed.

---

## Architecture

```
Browser WS ──────────────────────────────────────────────────────────────────► Backend
                                                                              │
                                                                              │  1. Wait for first message
                                                                              │     { character_id, session_id }
                                                                              │
                                                                              │  2. Load character config
                                                                              │     (system prompt, voice)
                                                                              │
                                                                              │  3. Open WS to Gemini Live API
                                                                              │     with Bearer token
                                                                              │
                                                                              │  4. Send Gemini setup message
                                                                              │     (with character injected)
                                                                              │
                                                                              │  5. Start bidirectional proxy
                                                                              │     (transparent forwarding)
                                                                              ▼
                                                        ◄────────────────── Gemini Live API
                                                        (audio ↔ audio, text ↔ text)
```

---

## File Structure

```
backend/
├── main.py              # FastAPI app, route registration
├── proxy.py             # WebSocket proxy + Gemini session setup
├── image_gen.py         # Image generation endpoint
├── characters.py        # Character configs + system prompts
├── scene_detector.py    # Transcription → image trigger logic
├── Dockerfile
└── requirements.txt
```

---

## `characters.py` — Character Definitions

```python
# backend/characters.py
"""Character definitions: system prompts, voice configs, image styles."""

from dataclasses import dataclass
from typing import Optional

GEMINI_LIVE_MODEL = "gemini-live-2.5-flash-native-audio"
GEMINI_IMAGE_MODEL = "gemini-2.0-flash-preview-image-generation"

GEMINI_SERVICE_URL = (
    "wss://us-central1-aiplatform.googleapis.com/ws/"
    "google.cloud.aiplatform.v1beta1.LlmBidiService/BidiGenerateContent"
)

@dataclass
class Character:
    id: str
    name: str
    voice_name: str
    image_style: str
    system_prompt: str


SYSTEM_PROMPT_BASE = """
You are {name}, a beloved storyteller for children aged 4 to 10 years old.

CORE BEHAVIOR:
- You are telling an interactive story to a child. You are the storyteller and narrator.
- Speak warmly, with genuine joy and love for storytelling.
- Use simple words that young children understand.
- Keep sentences short and clear.
- Use sound effects and onomatopoeia ("CRASH!", "whoooosh", "tip-tap-tip-tap").
- Vary your speaking pace — slow down for dramatic moments, speed up for excitement.
- Pause naturally to let the story breathe.

STORY STRUCTURE:
- Begin every story with a captivating opening that immediately draws the child in.
- Build to exciting moments and gentle surprises.
- Always include a warm, satisfying resolution.
- After 3-4 minutes of storytelling, naturally invite the child to participate:
  "What do you think happens next?" or "Should we make the dragon bigger or smaller?"

RESPONDING TO THE CHILD:
- If the child interrupts or speaks, ALWAYS acknowledge what they said warmly before continuing.
- If the child asks to change something ("make it funnier", "I want a princess"),
  weave their request naturally into the story as if it was always meant to be.
- If the child says "again" or "more", continue the story enthusiastically.
- If the child says "stop" or "bye", give a warm goodbye and tell them you'll save
  the story for next time.

CONTENT RULES (CRITICAL):
- NO violence, scary monsters, death, or frightening content.
- NO adult themes of any kind.
- NO real-world politics, religion, or controversial topics.
- Keep ALL content joyful, safe, and appropriate for children aged 4-10.
- If a child requests inappropriate content, gently redirect:
  "Oh, let's think of something even more fun! How about..."

SCENE MARKERS (IMPORTANT):
- When you describe a new scene or location in the story, naturally say something
  like "picture this..." or "imagine you can see..." before the description.
- This helps paint a vivid mental image for the child.

LANGUAGE:
- Use English unless the child speaks to you in another language,
  in which case gently switch to match them.
"""

CHARACTERS: dict[str, Character] = {
    "grandma-rose": Character(
        id="grandma-rose",
        name="Grandma Rose",
        voice_name="Aoede",
        image_style=(
            "warm watercolor illustration, storybook style, soft pastel colors, "
            "cozy and gentle, children's picture book art, golden hour lighting, "
            "heartwarming, detailed backgrounds"
        ),
        system_prompt=SYSTEM_PROMPT_BASE.format(name="Grandma Rose") + """
GRANDMA ROSE SPECIFIC:
- You are a warm, loving grandmother figure. You've told a thousand stories.
- Your voice is soft, unhurried, full of love. You savor every word.
- Specialty: fairy tales, bedtime stories, classic tales with gentle twists.
- You occasionally say things like "Oh, my dear..." and "Isn't that wonderful?"
- You know all the old fairy tales but love putting fresh, fun spins on them.
- You make the child feel completely safe and loved.
- Favorite phrases: "Once upon a time, in a land far away...", "And do you know what happened next?"
        """,
    ),

    "captain-leo": Character(
        id="captain-leo",
        name="Captain Leo",
        voice_name="Charon",
        image_style=(
            "bold comic book illustration style, vibrant saturated colors, "
            "adventure and nautical themes, dynamic action poses, bright sky and ocean, "
            "children's adventure book art"
        ),
        system_prompt=SYSTEM_PROMPT_BASE.format(name="Captain Leo") + """
CAPTAIN LEO SPECIFIC:
- You are a bold, brave, exciting sea captain storyteller!
- Your voice is warm and enthusiastic, full of energy.
- Specialty: adventure stories, treasure hunts, brave heroes, sea voyages.
- You use nautical phrases sometimes: "Ahoy!", "Land ho!", "Full sail ahead!"
- You make the child feel like a brave hero themselves.
- Stories have exciting action, near-misses, clever thinking, teamwork.
- Favorite phrases: "And THEN — you won't BELIEVE what happened!", "Are you ready? Here we GO!"
        """,
    ),

    "fairy-sparkle": Character(
        id="fairy-sparkle",
        name="Fairy Sparkle",
        voice_name="Kore",
        image_style=(
            "sparkly magical fantasy illustration, pastel rainbow colors, "
            "glitter and stars, enchanted forest, fairy tale art style, "
            "soft glowing light, magical creatures, flowers and butterflies"
        ),
        system_prompt=SYSTEM_PROMPT_BASE.format(name="Fairy Sparkle") + """
FAIRY SPARKLE SPECIFIC:
- You are a magical, whimsical fairy who LOVES stories more than anything!
- Your voice is light, musical, full of wonder and delight.
- Specialty: magical stories, talking animals, enchanted places, wishes and spells.
- You use magical words: "Poof!", "A sprinkle of fairy dust!", "By the stars!"
- Everything is a little bit magical and a little bit surprising.
- You get genuinely excited about the story, like you're discovering it too.
- Favorite phrases: "Oh! OH! And here's the most magical part!", "With just a tiny bit of magic..."
        """,
    ),

    "professor-whiz": Character(
        id="professor-whiz",
        name="Professor Whiz",
        voice_name="Puck",
        image_style=(
            "colorful cartoon science illustration, bright cheerful laboratory, "
            "inventor workshop style, children's STEM art, gadgets and gizmos, "
            "colorful experiments, friendly robots, clean bright backgrounds"
        ),
        system_prompt=SYSTEM_PROMPT_BASE.format(name="Professor Whiz") + """
PROFESSOR WHIZ SPECIFIC:
- You are a brilliant, curious, endearingly absent-minded professor!
- Your voice is warm and enthusiastic, full of "Eureka!" energy.
- Specialty: science adventures, inventor tales, discovery stories, nature wonders.
- You explain things simply but make science feel like pure magic.
- Stories involve clever problem-solving, curiosity, and "what if" thinking.
- Favorite phrases: "Fascinating! Absolutely FASCINATING!", "Science is just magic with explanations!"
- Occasionally forget what you were saying mid-sentence, then remember with delight.
        """,
    ),

    "dragon-blaze": Character(
        id="dragon-blaze",
        name="Dragon Blaze",
        voice_name="Fenrir",
        image_style=(
            "bold vibrant cartoon style, fiery bright orange and red colors, "
            "funny expressive dragon characters, action-comedy illustration, "
            "big eyes and expressions, energetic and dynamic, children's cartoon style"
        ),
        system_prompt=SYSTEM_PROMPT_BASE.format(name="Dragon Blaze") + """
DRAGON BLAZE SPECIFIC:
- You are a BIG, ENTHUSIASTIC dragon who absolutely LOVES telling stories!
- Your voice is warm, big, playful, and VERY enthusiastic.
- Specialty: dragon stories (obviously!), silly adventures, comedy, slapstick fun.
- You get SO excited you sometimes roar accidentally in the middle of a sentence.
- Everything is the MOST EPIC, MOST AMAZING, MOST EXCITING thing EVER.
- Stories are funny, physical, full of mishaps, and always end with big hearts.
- Favorite phrases: "ROOOAAR! Oh sorry... I meant... WOW!",
  "THIS IS THE BEST PART — are you READY?!"
        """,
    ),
}


def get_character(character_id: str) -> Optional[Character]:
    return CHARACTERS.get(character_id)


def build_gemini_setup_message(character: Character, project_id: str, location: str) -> dict:
    """Builds the Gemini Live API session setup message with character config injected."""
    model_path = (
        f"projects/{project_id}/locations/{location}/"
        f"publishers/google/models/{GEMINI_LIVE_MODEL}"
    )
    return {
        "setup": {
            "model": model_path,
            "system_instruction": {
                "parts": [{"text": character.system_prompt}]
            },
            "generation_config": {
                "response_modalities": ["audio"],
                "speech_config": {
                    "voice_config": {
                        "prebuilt_voice_config": {
                            "voice_name": character.voice_name
                        }
                    }
                },
                "enable_affective_dialog": True,
            },
            "input_audio_transcription": {},
            "output_audio_transcription": {},
            "realtime_input_config": {
                "automatic_activity_detection": {
                    "disabled": False,
                    "silence_duration_ms": 1500,
                    "prefix_padding_ms": 300,
                    "end_of_speech_sensitivity": "END_SENSITIVITY_HIGH",
                    "start_of_speech_sensitivity": "START_SENSITIVITY_HIGH",
                }
            },
            "proactivity": {
                "proactive_audio": True,
            },
        }
    }
```

---

## `proxy.py` — WebSocket Proxy

```python
# backend/proxy.py
"""Bidirectional WebSocket proxy between browser and Gemini Live API."""

import asyncio
import json
import os
import ssl
import certifi
import google.auth
from google.auth.transport.requests import Request
from websockets.legacy.protocol import WebSocketCommonProtocol
from websockets.exceptions import ConnectionClosed
import websockets

from characters import build_gemini_setup_message, get_character, GEMINI_SERVICE_URL
from scene_detector import SceneDetector

PROJECT_ID = os.environ["GOOGLE_CLOUD_PROJECT"]
LOCATION = os.environ.get("GOOGLE_CLOUD_LOCATION", "us-central1")


def get_access_token() -> str:
    """Get a fresh GCP access token using application default credentials."""
    creds, _ = google.auth.default(
        scopes=["https://www.googleapis.com/auth/cloud-platform"]
    )
    if not creds.valid:
        creds.refresh(Request())
    return creds.token


async def proxy_messages(
    source: WebSocketCommonProtocol,
    destination: WebSocketCommonProtocol,
    label: str,
    scene_detector: SceneDetector = None,
) -> None:
    """Forward all messages from source to destination.

    Optionally monitors output transcriptions for image triggers.
    """
    try:
        async for message in source:
            try:
                data = json.loads(message)

                # Monitor output transcriptions from Gemini for image triggers
                if scene_detector and label == "gemini→browser":
                    server_content = data.get("serverContent", {})

                    # Check for output transcription (what the character said)
                    output_tx = server_content.get("outputTranscription", {})
                    if output_tx.get("finished") and output_tx.get("text"):
                        # Non-blocking: trigger image generation in background
                        asyncio.create_task(
                            scene_detector.process_transcription(output_tx["text"])
                        )

                await destination.send(json.dumps(data))
            except json.JSONDecodeError:
                # Some messages may be binary — forward as-is
                await destination.send(message)
            except Exception as e:
                print(f"[proxy] Error processing message ({label}): {e}")
    except ConnectionClosed as e:
        print(f"[proxy] Connection closed ({label}): {e.code} - {e.reason}")
    except Exception as e:
        print(f"[proxy] Unexpected error ({label}): {e}")
    finally:
        if not destination.closed:
            await destination.close()


async def run_proxy_session(
    browser_ws: WebSocketCommonProtocol,
    character_id: str,
    session_id: str,
) -> None:
    """
    Establishes a Gemini Live API session for a character and proxies it to the browser.

    Protocol:
    1. Load character config
    2. Connect to Gemini Live API with auth
    3. Send character setup message (system prompt + voice)
    4. Wait for setup confirmation from Gemini
    5. Forward setup confirmation to browser
    6. Start bidirectional proxy
    """
    character = get_character(character_id)
    if not character:
        await browser_ws.send(json.dumps({
            "error": f"Unknown character: {character_id}"
        }))
        await browser_ws.close(code=1008, reason="Unknown character")
        return

    # Get fresh auth token
    try:
        token = get_access_token()
    except Exception as e:
        print(f"[proxy] Auth failed: {e}")
        await browser_ws.close(code=1008, reason="Authentication failed")
        return

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}",
    }

    ssl_context = ssl.create_default_context(cafile=certifi.where())
    setup_message = build_gemini_setup_message(character, PROJECT_ID, LOCATION)

    print(f"[proxy] Connecting to Gemini for character: {character.name}")

    try:
        async with websockets.connect(
            GEMINI_SERVICE_URL,
            additional_headers=headers,
            ssl=ssl_context,
            ping_interval=20,
            ping_timeout=10,
        ) as gemini_ws:
            print(f"[proxy] Connected to Gemini Live API ✓")

            # Send character setup to Gemini
            await gemini_ws.send(json.dumps(setup_message))

            # Wait for Gemini setup confirmation
            setup_response = await asyncio.wait_for(gemini_ws.recv(), timeout=15.0)
            setup_data = json.loads(setup_response)

            if not setup_data.get("setupComplete"):
                print(f"[proxy] Unexpected setup response: {setup_data}")
                await browser_ws.close(code=1011, reason="Gemini setup failed")
                return

            # Forward setup confirmation to browser
            await browser_ws.send(json.dumps({
                "setupComplete": True,
                "characterName": character.name,
                "characterId": character.id,
            }))

            print(f"[proxy] Session ready for {character.name} (session: {session_id})")

            # Scene detector for image generation triggers
            scene_detector = SceneDetector(
                session_id=session_id,
                image_style=character.image_style,
            )

            # Start bidirectional proxy
            browser_to_gemini = asyncio.create_task(
                proxy_messages(browser_ws, gemini_ws, "browser→gemini")
            )
            gemini_to_browser = asyncio.create_task(
                proxy_messages(gemini_ws, browser_ws, "gemini→browser", scene_detector)
            )

            done, pending = await asyncio.wait(
                [browser_to_gemini, gemini_to_browser],
                return_when=asyncio.FIRST_COMPLETED,
            )

            for task in pending:
                task.cancel()
                try:
                    await task
                except asyncio.CancelledError:
                    pass

    except asyncio.TimeoutError:
        print("[proxy] Timeout waiting for Gemini setup")
        await browser_ws.close(code=1008, reason="Gemini setup timeout")
    except ConnectionClosed as e:
        print(f"[proxy] Gemini connection closed: {e.code} - {e.reason}")
        if not browser_ws.closed:
            await browser_ws.close(code=e.code, reason=e.reason)
    except Exception as e:
        print(f"[proxy] Error: {e}")
        if not browser_ws.closed:
            await browser_ws.close(code=1011, reason="Internal error")
```

---

## `image_gen.py` — Image Generation Endpoint

```python
# backend/image_gen.py
"""Story scene image generation using Gemini image generation API."""

import base64
import os
from google import genai
from google.genai import types
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

PROJECT_ID = os.environ["GOOGLE_CLOUD_PROJECT"]
LOCATION = os.environ.get("GOOGLE_CLOUD_LOCATION", "us-central1")
IMAGE_MODEL = "gemini-2.0-flash-preview-image-generation"

SAFETY_PREFIX = (
    "child-safe illustration, age-appropriate for children aged 4-10, "
    "no violence, no scary content, no adult themes, cartoon style, "
)

def get_image_client():
    return genai.Client(vertexai=True, project=PROJECT_ID, location=LOCATION)


class ImageRequest(BaseModel):
    scene_description: str
    image_style: str
    session_id: str


class ImageResponse(BaseModel):
    image_data: str     # base64 PNG
    mime_type: str
    scene_description: str


@router.post("/api/image", response_model=ImageResponse)
async def generate_scene_image(request: ImageRequest):
    """Generate a story scene image from a description."""

    if len(request.scene_description) > 500:
        raise HTTPException(status_code=400, detail="Scene description too long")

    prompt = (
        f"{SAFETY_PREFIX}"
        f"{request.image_style}, "
        f"{request.scene_description}"
    )

    try:
        client = get_image_client()

        response = client.models.generate_content(
            model=IMAGE_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_modalities=["IMAGE"],
                image_config=types.ImageConfig(
                    aspect_ratio="4:3",
                ),
                safety_settings=[
                    types.SafetySetting(
                        category="HARM_CATEGORY_DANGEROUS_CONTENT",
                        threshold="BLOCK_LOW_AND_ABOVE",
                    ),
                    types.SafetySetting(
                        category="HARM_CATEGORY_SEXUALLY_EXPLICIT",
                        threshold="BLOCK_LOW_AND_ABOVE",
                    ),
                    types.SafetySetting(
                        category="HARM_CATEGORY_HARASSMENT",
                        threshold="BLOCK_LOW_AND_ABOVE",
                    ),
                    types.SafetySetting(
                        category="HARM_CATEGORY_HATE_SPEECH",
                        threshold="BLOCK_LOW_AND_ABOVE",
                    ),
                ],
            ),
        )

        for part in response.candidates[0].content.parts:
            if part.inline_data:
                image_b64 = base64.b64encode(part.inline_data.data).decode("utf-8")
                return ImageResponse(
                    image_data=image_b64,
                    mime_type=part.inline_data.mime_type or "image/png",
                    scene_description=request.scene_description,
                )

        raise HTTPException(status_code=500, detail="No image in response")

    except Exception as e:
        print(f"[image_gen] Error: {e}")
        raise HTTPException(status_code=500, detail="Image generation failed")
```

---

## `scene_detector.py` — Scene Trigger Logic

```python
# backend/scene_detector.py
"""Detects scene-worthy moments in story transcriptions and triggers image generation."""

import asyncio
import aiohttp
import re
from dataclasses import dataclass


# Keywords that suggest a visually rich scene is being described
SCENE_TRIGGER_PHRASES = [
    r"\bpicture this\b",
    r"\bimagine you can see\b",
    r"\bonce upon a time\b",
    r"\bin a (land|place|kingdom|forest|cave|castle|ocean|mountain|village)\b",
    r"\b(suddenly|all of a sudden)\b",
    r"\bthere (stood|lived|was|appeared)\b",
    r"\band (there|before them|ahead) (was|stood|appeared)\b",
    r"\bthe (dragon|princess|wizard|knight|robot|fairy|ship|castle)\b",
]

COMPILED_TRIGGERS = [re.compile(p, re.IGNORECASE) for p in SCENE_TRIGGER_PHRASES]
MIN_DESCRIPTION_WORDS = 15  # Minimum words for a scene description


@dataclass
class SceneDetector:
    session_id: str
    image_style: str
    _last_image_text: str = ""
    _image_count: int = 0
    _max_images: int = 8

    def should_generate_image(self, text: str) -> bool:
        """Determine if this transcription warrants an image."""
        if self._image_count >= self._max_images:
            return False
        if len(text.split()) < MIN_DESCRIPTION_WORDS:
            return False
        # Check for trigger phrases
        for pattern in COMPILED_TRIGGERS:
            if pattern.search(text):
                return True
        return False

    def extract_scene_description(self, text: str) -> str:
        """Extract the most descriptive sentence(s) for image generation."""
        sentences = text.split(". ")
        # Take up to 3 sentences that contain the most visual detail
        rich_sentences = []
        visual_words = {"saw", "looked", "appeared", "stood", "soared", "glowed",
                       "shone", "sparkled", "towered", "stretched", "gleamed"}
        for s in sentences:
            words = set(s.lower().split())
            if words & visual_words or any(p.search(s) for p in COMPILED_TRIGGERS):
                rich_sentences.append(s)

        if rich_sentences:
            return ". ".join(rich_sentences[:3])
        return ". ".join(sentences[:2])  # Fallback: first 2 sentences

    async def process_transcription(self, text: str) -> None:
        """Called after each completed Gemini turn with output transcription."""
        if not self.should_generate_image(text):
            return
        if text == self._last_image_text:
            return  # Avoid duplicates

        self._last_image_text = text
        self._image_count += 1
        scene_desc = self.extract_scene_description(text)

        print(f"[scene] Triggering image {self._image_count}: {scene_desc[:80]}...")

        # Call the image generation API (local HTTP call to self)
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    "http://localhost:8000/api/image",
                    json={
                        "scene_description": scene_desc,
                        "image_style": self.image_style,
                        "session_id": self.session_id,
                    },
                    timeout=aiohttp.ClientTimeout(total=30),
                ) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        print(f"[scene] Image {self._image_count} generated ✓")
                        # The frontend polls or receives this via SSE
                        # (handled by image queue mechanism)
                    else:
                        print(f"[scene] Image generation failed: {resp.status}")
        except Exception as e:
            print(f"[scene] Image generation error: {e}")
```

---

## `main.py` — FastAPI Application

```python
# backend/main.py
"""FastAPI application — WebSocket proxy and image generation."""

import asyncio
import os
import uuid
import json

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import websockets

from proxy import run_proxy_session
from image_gen import router as image_router

app = FastAPI(title="TaleWeaver Backend")

# Allow frontend origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # Tighten to Firebase URL in production
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(image_router)


@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.websocket("/ws/story")
async def story_websocket(ws: WebSocket):
    """
    WebSocket endpoint for story sessions.

    Protocol:
    Browser sends first:
        { "character_id": "grandma-rose" }

    Backend responds:
        { "setupComplete": true, "characterName": "Grandma Rose", "characterId": "grandma-rose" }

    From here, all messages are proxied bidirectionally to/from Gemini Live API.
    """
    await ws.accept()
    session_id = str(uuid.uuid4())[:8]

    print(f"[ws] New session: {session_id}")

    try:
        # Wait for character selection from browser
        init_message = await asyncio.wait_for(ws.receive_text(), timeout=10.0)
        init_data = json.loads(init_message)
        character_id = init_data.get("character_id", "grandma-rose")

        print(f"[ws] Session {session_id}: character={character_id}")

        # Run the proxy session (blocking until session ends)
        await run_proxy_session(ws.client, character_id, session_id)

    except asyncio.TimeoutError:
        print(f"[ws] Session {session_id}: timeout waiting for character selection")
        await ws.close(code=1008, reason="Timeout")
    except WebSocketDisconnect:
        print(f"[ws] Session {session_id}: client disconnected")
    except Exception as e:
        print(f"[ws] Session {session_id}: error: {e}")
        try:
            await ws.close(code=1011, reason="Internal error")
        except:
            pass
```

---

## `requirements.txt`

```
fastapi>=0.115.0
uvicorn[standard]>=0.30.0
websockets>=12.0
google-genai>=1.10.0
google-auth>=2.32.0
google-cloud-aiplatform>=1.60.0
aiohttp>=3.9.0
certifi>=2024.0.0
python-dotenv>=1.0.0
pydantic>=2.7.0
```

---

## `Dockerfile`

```dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PORT=8080
EXPOSE 8080

# Single uvicorn process — Cloud Run handles scaling
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080", \
     "--workers", "1", "--loop", "uvloop", "--http", "h11"]
```

---

## Environment Variables

```bash
# .env (local dev)
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_GENAI_USE_VERTEXAI=true
```

For Cloud Run, these are set via `--set-env-vars` in the deploy command.
Auth is handled by the attached service account (no API key needed).

---

## WebSocket Protocol Reference

### Browser → Backend (first message)
```json
{ "character_id": "grandma-rose" }
```

### Backend → Browser (setup confirmation)
```json
{
  "setupComplete": true,
  "characterName": "Grandma Rose",
  "characterId": "grandma-rose"
}
```

### Browser → Backend (realtime audio)
```json
{
  "realtime_input": {
    "media_chunks": [{
      "mime_type": "audio/pcm;rate=16000",
      "data": "<base64 PCM chunk>"
    }]
  }
}
```

### Backend → Browser (audio response from Gemini)
```json
{
  "serverContent": {
    "modelTurn": {
      "parts": [{
        "inlineData": {
          "data": "<base64 PCM at 24kHz>"
        }
      }]
    },
    "outputTranscription": {
      "text": "Once upon a time...",
      "finished": true
    },
    "turnComplete": true,
    "interrupted": false
  }
}
```

### Backend → Browser (interruption signal)
```json
{
  "serverContent": {
    "interrupted": true
  }
}
```

---

## Token Refresh Strategy

GCP access tokens expire after ~1 hour. For long story sessions:

```python
# In run_proxy_session, refresh token before connecting
# For sessions > 50 minutes, proactively reconnect Gemini WS with fresh token
# The proxy handles this transparently — the browser WS stays connected

TOKEN_REFRESH_INTERVAL = 50 * 60  # 50 minutes in seconds
```

---

## Definition of Done

- [ ] `GET /api/health` returns 200
- [ ] `POST /api/image` returns a base64 PNG for a given scene description
- [ ] `WebSocket /ws/story` accepts connection and sends `setupComplete`
- [ ] Audio flows bidirectionally (verified with test client)
- [ ] Character system prompt and voice correctly injected per character_id
- [ ] Interruption messages (`interrupted: true`) forwarded correctly
- [ ] Output transcriptions logged (and scene detector called)
- [ ] Server handles disconnects and errors gracefully without crashing
- [ ] Docker image builds and runs locally
