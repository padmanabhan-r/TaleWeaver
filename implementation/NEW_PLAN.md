# TaleWeaver — ADK Migration Plan
### Created 3 Mar 2026 | Updated 3 Mar 2026

## Current Status

| Phase | Status | Notes |
|---|---|---|
| **Phase B — Story Planner Agent** | ✅ **Done** | `backend/story_planner.py`, `POST /api/story-plan`, `google.adk LlmAgent` |
| **Phase C — Story Recap (Interleaved)** | ✅ **Done** | `POST /api/story-recap` in `image_gen.py`, `StoryRecapModal.tsx` |
| **Phase A — Story Director Agent** | ⏳ Not started | Full ADK `run_live()` proxy replacement; risky, deferred post-hackathon |

The **Option C** approach was chosen: add ADK features additively without touching `proxy.py`, `useLiveAPI.ts`, or `useStoryImages.ts`. Phases B+C complete the hackathon requirements. Phase A remains a future stretch goal.

---

---

## Executive Summary

**Yes, we can use ADK — and doing so makes TaleWeaver explicitly "agentic."**
The migration is significant but achievable and gives us the strongest possible hackathon position.
We keep the frontend largely unchanged; the backend gets a proper multi-agent architecture.

---

## Current Architecture vs ADK Architecture

### Current (proxy.py approach)
```
Browser WS ──→ FastAPI ──→ raw websockets ──→ Gemini Live API
                │                (transparent proxy)
                └──→ POST /api/image  (browser calls this directly when tool fires)
```

Tools (`generate_illustration`, `showChoice`, `award_badge`) fire from Gemini → forwarded as JSON to browser → browser handles them.

### Target (ADK approach)
```
Browser WS ──→ FastAPI ──→ ADK Runner.run_live() ──→ Gemini Live API
                                │
                                ├── generate_illustration() → backend image gen → push image to browser WS
                                ├── show_choice() → push choice overlay msg to browser WS
                                └── award_badge()  → push badge msg to browser WS
```

Tools fire from Gemini → ADK executes the Python function → backend pushes result to browser.
The browser never makes `POST /api/image` calls — images flow as WebSocket messages from backend.

---

## The Multi-Agent Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    TALEWEAVER AGENT SYSTEM (ADK)                     │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  STORY DIRECTOR AGENT  (google.adk.agents.Agent)               │ │
│  │  model: gemini-live-2.5-flash-native-audio                     │ │
│  │                                                                │ │
│  │  Tools (Python functions):                                     │ │
│  │    generate_illustration(scene_description)                   │ │
│  │      → calls Imagen/Gemini image gen                          │ │
│  │      → pushes { type:"newImage", data, mimeType } to browser  │ │
│  │    show_choice(options)                                        │ │
│  │      → pushes { type:"showChoice", options } to browser       │ │
│  │    award_badge(emoji, name, reason)                            │ │
│  │      → pushes { type:"award_badge", ... } to browser           │ │
│  │                                                                │ │
│  │  RunConfig:                                                    │ │
│  │    speech_config: character voice name (Aoede, Charon, etc.)  │ │
│  │    enable_affective_dialog: True                               │ │
│  │    proactivity: ProactivityConfig (proactive_audio)           │ │
│  │    realtime_input_config: VAD settings                        │ │
│  │    input/output_audio_transcription: enabled                  │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  STORY PLANNER AGENT  (google.adk.agents.LlmAgent)             │ │
│  │  model: gemini-2.0-flash-lite                                  │ │
│  │  Runs BEFORE session starts                                    │ │
│  │  → generates 5-beat story arc                                 │ │
│  │  → arc injected into Story Director's context                 │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  STORY RECAP AGENT  (google.genai, interleaved TEXT+IMAGE)     │ │
│  │  model: gemini-2.0-flash-preview-image-generation              │ │
│  │  response_modalities: ["TEXT", "IMAGE"]                        │ │
│  │  Runs AFTER session ends (on demand)                           │ │
│  │  → generates illustrated storybook from session scenes        │ │
│  │  → returns pages: [{ text, image_data }]                      │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│                    All running on Google Cloud Run                   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Phase A — Story Director Agent (ADK streaming) — THE MAIN MIGRATION

This replaces `proxy.py`. It's the biggest change but makes TaleWeaver genuinely agentic.

### New file: `backend/agent.py`

```python
"""ADK Story Director Agent — replaces proxy.py."""

import asyncio
import os
from dataclasses import dataclass
from typing import Callable, Awaitable

from google.adk.agents import Agent
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.adk.agents.live_request_queue import LiveRequestQueue
from google.adk.agents.run_config import RunConfig, StreamingMode
from google.genai import types

from characters import get_character, Character
from image_gen import generate_image_for_scene  # extracted from image_gen.py

# Shared session service across all active story sessions
_session_service = InMemorySessionService()
APP_NAME = "taleweaver"


def _build_run_config(character: Character) -> RunConfig:
    """Build the ADK RunConfig for a character — voice, VAD, affective dialog, etc."""
    return RunConfig(
        streaming_mode=StreamingMode.BIDI,
        response_modalities=["AUDIO"],
        speech_config=types.SpeechConfig(
            voice_config=types.VoiceConfig(
                prebuilt_voice_config=types.PrebuiltVoiceConfig(
                    voice_name=character.voice_name
                )
            )
        ),
        input_audio_transcription=types.AudioTranscriptionConfig(),
        output_audio_transcription=types.AudioTranscriptionConfig(),
        enable_affective_dialog=True,
        proactivity=types.ProactivityConfig(proactive_audio=True),
        realtime_input_config=types.RealtimeInputConfig(
            automatic_activity_detection=types.AutomaticActivityDetection(
                disabled=False,
                silence_duration_ms=2000,
                prefix_padding_ms=300,
                end_of_speech_sensitivity="END_SENSITIVITY_LOW",
                start_of_speech_sensitivity="START_SENSITIVITY_LOW",
            )
        ),
    )


def _build_agent(character: Character, push_to_browser: Callable) -> Agent:
    """Build the ADK Agent for a character, with all tool functions bound to push_to_browser."""

    async def generate_illustration(scene_description: str) -> dict:
        """Generate a storybook illustration at a key visual moment."""
        image_b64, mime_type = await generate_image_for_scene(
            scene_description=scene_description,
            image_style=character.image_style,
        )
        await push_to_browser({
            "type": "newImage",
            "imageData": image_b64,
            "mimeType": mime_type,
            "sceneDescription": scene_description,
        })
        return {"status": "ok", "message": "Illustration generated."}

    async def show_choice(options: list[str]) -> dict:
        """Show story branching choices to the child."""
        await push_to_browser({"type": "showChoice", "options": options})
        return {"status": "ok"}

    async def award_badge(emoji: str, name: str, reason: str) -> dict:
        """Award an achievement badge to the child."""
        await push_to_browser({"type": "award_badge", "emoji": emoji, "name": name, "reason": reason})
        return {"status": "ok"}

    return Agent(
        name=f"story_director_{character.id}",
        model="gemini-live-2.5-flash-native-audio",
        description=f"Story Director: {character.name}",
        instruction=character.system_prompt,
        tools=[generate_illustration, show_choice, award_badge],
    )


async def run_adk_session(
    browser_ws,
    character_id: str,
    session_id: str,
    theme: str | None = None,
    prop_image: str | None = None,
    opening_text: str | None = None,
) -> None:
    """Run an ADK-based story session, replacing run_proxy_session."""
    import json

    character = get_character(character_id)
    if not character:
        await browser_ws.send_text(json.dumps({"error": f"Unknown character: {character_id}"}))
        await browser_ws.close(code=1008)
        return

    # Async helper to push messages to the browser
    async def push_to_browser(msg: dict) -> None:
        try:
            await browser_ws.send_text(json.dumps(msg))
        except Exception as e:
            print(f"[agent] push_to_browser error: {e}")

    agent = _build_agent(character, push_to_browser)
    runner = Runner(
        app_name=APP_NAME,
        agent=agent,
        session_service=_session_service,
    )

    await _session_service.create_session(
        app_name=APP_NAME,
        user_id="child",
        session_id=session_id,
        state={"character_id": character_id},
    )

    run_config = _build_run_config(character)
    live_request_queue = LiveRequestQueue()

    # Tell the browser session is ready
    await push_to_browser({
        "setupComplete": True,
        "characterName": character.name,
        "characterId": character.id,
    })

    # Build the "Begin!" first turn (with theme / prop_image / opening_text)
    first_turn_parts = _build_first_turn(theme, prop_image, opening_text)
    live_request_queue.send_content(
        types.Content(role="user", parts=first_turn_parts)
    )

    async def upstream():
        """Browser → ADK: translate browser WS messages to LiveRequestQueue items."""
        from fastapi import WebSocketDisconnect
        try:
            while True:
                raw = await browser_ws.receive_text()
                msg = json.loads(raw)

                # Audio chunk
                if "realtimeInput" in msg:
                    ri = msg["realtimeInput"]
                    for chunk in ri.get("mediaChunks", []):
                        live_request_queue.send_realtime(
                            types.Blob(mime_type=chunk["mimeType"], data=chunk["data"])
                        )
                    if "video" in ri:
                        v = ri["video"]
                        live_request_queue.send_realtime(
                            types.Blob(mime_type=v.get("mimeType", "image/jpeg"), data=v["data"])
                        )
                # Tool response — ADK handles this automatically, but forward anyway
                elif "toolResponse" in msg:
                    pass  # ADK auto-sends tool responses; tools return values directly

        except WebSocketDisconnect:
            pass
        except Exception as e:
            print(f"[agent] upstream error: {e}")
        finally:
            live_request_queue.close()

    async def downstream():
        """ADK → Browser: translate ADK events to browser WS messages."""
        try:
            async for event in runner.run_live(
                user_id="child",
                session_id=session_id,
                live_request_queue=live_request_queue,
                run_config=run_config,
            ):
                # Pass through all events the frontend needs
                event_dict = event.model_dump(exclude_none=True, by_alias=True)
                await push_to_browser(event_dict)
        except Exception as e:
            print(f"[agent] downstream error: {e}")

    await asyncio.gather(upstream(), downstream(), return_exceptions=True)
```

### Updated `backend/main.py`

```python
# Replace:   from proxy import run_proxy_session
# With:      from agent import run_adk_session

# And in the WebSocket handler:
await run_adk_session(ws, character_id, session_id, theme=theme, prop_image=prop_image, opening_text=opening_text)
```

### Key design notes

- `push_to_browser` is a closure — each session has its own. This is how image results, choices, and badges reach the browser.
- The frontend already handles `{ type: "newImage" }` messages from the server? No — currently images come from `POST /api/image`. **The frontend needs updating to listen for WS image messages instead.** See Phase A Frontend below.
- ADK automatically sends tool responses back to Gemini when the Python tool function returns.
- The `upstream()` task translates the browser's raw Gemini API messages into ADK's `LiveRequestQueue` format.
- The `downstream()` task forwards ADK events to the browser.

### Phase A Frontend Change

Currently `useStoryImages.ts` calls `POST /api/image` when Gemini fires `generate_illustration`. With ADK, the backend calls image generation and pushes the result via WebSocket.

**Change in `useLiveAPI.ts`:** instead of handling `toolCall.generate_illustration` by calling `POST /api/image`, just listen for `{ type: "newImage" }` messages from the server and pass them to the image display hook.

This is a **net simplification** of the frontend — remove ~50 lines of image fetch logic, add ~10 lines of WS message handler.

---

## Phase B — Story Planner Agent

A pre-session planning agent that creates a 5-beat story arc before the Live session begins.

### New endpoint: `POST /api/story-plan`

```python
from google.adk.agents import LlmAgent
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService

story_planner = LlmAgent(
    name="story_planner",
    model="gemini-2.0-flash-lite",
    description="Plans a 5-beat children's story arc",
    instruction="""You are a master children's story planner.
    Create a 5-beat story arc for a character named {character_name}
    telling a story with the theme: {theme}.

    Return exactly this format:
    BEAT_1: [Opening scene — drop child straight in]
    BEAT_2: [Rising complication — something unexpected]
    BEAT_3: [Midpoint — the hero tries something new]
    BEAT_4: [Climax — the most exciting moment]
    BEAT_5: [Resolution — warm, satisfying, leaves room for more]

    Each beat: 1 sentence. Keep it joyful and appropriate for ages 4-10.""",
    output_key="story_arc",
)

@router.post("/api/story-plan")
async def generate_story_plan(request: StoryPlanRequest):
    session_service = InMemorySessionService()
    runner = Runner(
        app_name="taleweaver_planner",
        agent=story_planner,
        session_service=session_service,
    )
    session_id = str(uuid.uuid4())
    await session_service.create_session(
        app_name="taleweaver_planner",
        user_id="system",
        session_id=session_id,
        state={"character_name": request.character_name, "theme": request.theme or "adventure"},
    )
    # Run the planner
    result = await runner.run(
        user_id="system",
        session_id=session_id,
        message="Plan the story.",
    )
    arc = result.state.get("story_arc", "")
    return {"story_arc": arc}
```

The arc gets injected as a suffix to the system prompt when the Story Director session starts, giving Gemini a creative roadmap.

---

## Phase C — Story Recap Agent (INTERLEAVED OUTPUT — Category Requirement)

This is the feature that directly satisfies the Creative Storyteller mandatory technical requirement: **Gemini's native interleaved text+image output**.

### New endpoint: `POST /api/story-recap`

```python
@router.post("/api/story-recap")
async def generate_story_recap(request: StoryRecapRequest):
    """
    Generate an illustrated storybook from session scenes using native interleaved output.
    One Gemini call → alternating text paragraphs + images in a single response.
    """
    scenes_text = "\n".join(f"- {s}" for s in request.scene_descriptions[:5])

    prompt = f"""You are {request.character_name}, a beloved children's storyteller.

    Create a beautiful illustrated storybook recap of our story together.
    The story had these key moments:
    {scenes_text}

    Write exactly 4 illustrated pages. For each page:
    1. Write 2-3 warm sentences of narration (in the storyteller's voice)
    2. Generate a matching illustration in this style: {request.image_style}

    This should feel like a real children's picture book — words and pictures woven together.
    Child-safe, joyful, colorful, no text in the images."""

    response = await _client.aio.models.generate_content(
        model="gemini-2.0-flash-preview-image-generation",
        contents=prompt,
        config=types.GenerateContentConfig(
            response_modalities=["TEXT", "IMAGE"],
            safety_settings=[
                types.SafetySetting(category=cat, threshold="BLOCK_LOW_AND_ABOVE")
                for cat in ["HARM_CATEGORY_DANGEROUS_CONTENT", "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                           "HARM_CATEGORY_HARASSMENT", "HARM_CATEGORY_HATE_SPEECH"]
            ],
        ),
    )

    # Parse the interleaved response
    pages = []
    for part in response.candidates[0].content.parts:
        if part.text and part.text.strip():
            pages.append({"type": "text", "content": part.text.strip()})
        elif part.inline_data and part.inline_data.data:
            pages.append({
                "type": "image",
                "imageData": base64.b64encode(part.inline_data.data).decode(),
                "mimeType": part.inline_data.mime_type or "image/png",
            })

    return {"pages": pages, "title": request.story_title or "Our Story"}
```

### Frontend: Story Gallery Screen

A new screen shown when the child (or parent) clicks "See our story!" at session end:
- Calls `POST /api/story-recap` with collected scene descriptions
- Shows a page-by-page illustrated storybook
- Each page: narration text + storybook illustration
- Horizontal swipe/scroll navigation
- "Download" button (or share)

This is the **demo climax**: the child's improvised voice story becomes a beautiful illustrated book, generated in one native interleaved Gemini call.

---

## What Changes — File by File

| File | Change |
|---|---|
| `backend/agent.py` | **NEW** — ADK Story Director Agent (replaces proxy.py) |
| `backend/proxy.py` | Keep for reference; no longer used |
| `backend/main.py` | Import `run_adk_session` instead of `run_proxy_session` |
| `backend/characters.py` | Remove `build_gemini_setup_message()` and `gemini_service_url()` (no longer needed) |
| `backend/image_gen.py` | Extract `generate_image_for_scene()` as a standalone async function (called by the tool) |
| `backend/image_gen.py` | Add `POST /api/story-recap` endpoint |
| `backend/requirements.txt` | Add `google-adk` |
| `frontend/src/hooks/useLiveAPI.ts` | Remove `toolCall.generate_illustration` handler + `POST /api/image` call; add `type: "newImage"` WS handler |
| `frontend/src/hooks/useStoryImages.ts` | Remove HTTP fetch logic; receive images via WS |
| `frontend/src/screens/StoryScreen.tsx` | Add "See our story!" button; add Story Gallery screen or modal |

---

## ADK Requirements Checklist

| Requirement | TaleWeaver |
|---|---|
| Built with Google GenAI SDK or ADK | ✅ ADK (Story Director, Story Planner) + GenAI SDK (Story Recap) |
| Agent that "sees, hears, speaks" | ✅ Live audio + camera vision + audio output |
| Real-time interaction with interruption | ✅ ADK + Gemini Live barge-in |
| Interleaved/mixed output | ✅ Story Recap: `response_modalities=["TEXT","IMAGE"]` |
| Google Cloud deployment | ✅ Cloud Run + Vertex AI |
| Multi-agent architecture | ✅ Story Planner → Story Director → Story Recap |

---

## Risks and Mitigation

| Risk | Mitigation |
|---|---|
| ADK `RunConfig` doesn't support all our config (affective dialog, proactive audio, VAD) | From ADK docs: RunConfig has `enable_affective_dialog`, `proactivity`, `realtime_input_config` — all supported |
| `run_live()` event format differs from raw Gemini Live format → frontend breaks | Audit event fields during development; update frontend handlers to match |
| Tool return values: ADK needs specific format | Return `dict` from tool functions — ADK converts to toolResponse |
| Camera video frames (base64 JPEG) — how to send to ADK | `live_request_queue.send_realtime(types.Blob(mime_type="image/jpeg", data=frame_b64))` |
| Session timeout / reconnection | ADK `session_resumption` config handles this |
| `POST /api/image` calls from frontend no longer needed | Remove from frontend; images arrive via WS `type:"newImage"` |

---

## Implementation Order

```
Sprint 1 (ADK core) — FUTURE (Phase A):
  [ ] pip install google-adk (✅ added to requirements.txt)
  [ ] Write backend/agent.py (Story Director Agent — run_live() replacing proxy.py)
  [ ] Refactor image_gen.py: extract generate_image_for_scene() as reusable function
  [ ] Update main.py: use run_adk_session
  [ ] Test basic session: audio works, character speaks
  [ ] Test tools: generate_illustration fires, image arrives via WS

Sprint 2 (Frontend alignment) — FUTURE (Phase A):
  [ ] Update useLiveAPI.ts: handle type:"newImage" WS messages
  [ ] Update useStoryImages.ts: receive images from WS (remove HTTP fetch)
  [ ] Test full flow: theme selection → session → illustrations → choices → badges
  [ ] Verify camera/video frames reach ADK correctly

Sprint 3 (Story Planner) — ✅ DONE:
  [x] Add POST /api/story-plan (LlmAgent) — backend/story_planner.py
  [x] google.adk LlmAgent + Runner + InMemorySessionService wired up
  [x] requirements.txt: google-adk>=1.0.0, google-genai>=1.56.0

Sprint 4 (Story Recap — interleaved output) — ✅ DONE:
  [x] Add POST /api/story-recap (interleaved TEXT+IMAGE) — image_gen.py
  [x] Frontend: StoryRecapModal.tsx created
  [x] "📖 See our story!" button added to sessionState==="ended" in StoryScreen.tsx
  [x] Track scene descriptions via useStoryImages (descriptions passed to modal)

Sprint 5 (Polish):
  [ ] Architecture diagram
  [ ] README with deployment instructions
  [ ] Demo video
  [ ] Submission text
```

---

## Submission Narrative

> "TaleWeaver is a multi-agent AI storytelling system built with Google ADK. The **Story Planner Agent** creates a narrative arc before each session. The **Story Director Agent** — powered by Gemini Live 2.5 with native audio — narrates the story in real-time, calling tools to generate illustrations, present story choices, and award achievement badges, all while watching the child through the camera. Sessions conclude with the **Story Recap Agent**, which uses Gemini's native interleaved text+image output to produce a beautiful illustrated children's storybook from the session's scenes — one model call, text and pictures woven together. TaleWeaver speaks 6 languages, runs entirely on Google Cloud Run with Vertex AI, and is live at taleweaver.online."

---

## What This Wins

**Creative Storyteller category criteria:**
- "Multimodal storytelling with interleaved output" → Story Recap is exactly this ✅
- "Gemini's native interleaved/mixed output capabilities" → `response_modalities=["TEXT","IMAGE"]` ✅
- "Seamlessly weaving text, images, audio" → Live narration + inline illustrations + storybook ✅

**Technical Implementation & Agent Architecture (30%):**
- ADK multi-agent pipeline explicitly visible in code ✅
- Sound agent logic: tools + tool responses + session state ✅
- Error handling: image gen failures, session timeouts ✅
- Hosted on Google Cloud ✅

**Innovation (40%):**
- Voice-first for children — nobody else will have this domain ✅
- 6 languages (10 characters) ✅
- Camera vision + movement challenges ✅
- Storybook generation at session end ✅
