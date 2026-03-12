# backend/image_gen.py
"""Story scene image generation — model controlled via IMAGE_MODEL env var."""

import asyncio
import base64
import os
from google import genai
from google.genai import types
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from characters import get_character

router = APIRouter()

PROJECT_ID = os.environ["GOOGLE_CLOUD_PROJECT"]
IMAGE_MODEL = os.environ["IMAGE_MODEL"]
IMAGE_LOCATION = os.environ["IMAGE_LOCATION"]
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
EXTRACT_MODEL = "gemini-2.5-flash-lite"

SAFETY_PREFIX = (
    "child-safe illustration, age-appropriate for children aged 4-10, "
    "no violence, no scary content, no adult themes, cartoon style, "
    "no text, no words, no letters, no captions, no speech bubbles, no labels, purely visual, "
)

_client = genai.Client(vertexai=True, project=PROJECT_ID, location=IMAGE_LOCATION)
_extract_client = genai.Client(vertexai=True, project=PROJECT_ID, location="us-central1")
# API-key client for models not on Vertex AI (e.g. gemini-3.x).
# vertexai=False is explicit to override GOOGLE_GENAI_USE_VERTEXAI=true env var.
_api_key_client = genai.Client(api_key=GEMINI_API_KEY, vertexai=False) if GEMINI_API_KEY else None

print(f"[image_gen] Using model: {IMAGE_MODEL} @ {IMAGE_LOCATION}")


def _build_scene_prompt(scene_description: str, story_context: str) -> str:
    """Build the image prompt directly from story transcription — no extraction step."""
    context_line = (
        f"Story context (characters and setting established so far): {story_context[:600]}\n\n"
    ) if story_context else ""
    return (
        f"{context_line}"
        f"Story narration to illustrate: {scene_description[:1500]}"
    )



def _build_contents(
    prompt: str,
    previous_image_data: str,
    previous_image_mime_type: str,
    previous_scene_description: str = "",
):
    """Build multi-part contents with context-aware visual continuity instructions."""
    if not previous_image_data:
        return prompt

    prev_note = (
        f'The previous scene showed: "{previous_scene_description[:300]}"\n'
        if previous_scene_description else ""
    )

    instruction = (
        f"{prev_note}"
        "You are given the previous story illustration as a reference.\n\n"
        "CONTINUITY RULES — read carefully before generating:\n"
        "1. SAME CONTEXT (same characters, same setting, story is continuing): "
        "Maintain full visual continuity — identical character designs, same color palette, "
        "same art style, consistent lighting and mood.\n"
        "2. SHIFTED CONTEXT (story has moved to a new location, new theme, or entirely new "
        "characters — e.g. forest → space, animals → robots, daytime village → nighttime ocean): "
        "Use the reference image ONLY to preserve the appearance of any characters that carry "
        "over into the new scene. Build a completely fresh background and environment that matches "
        "the new scene. Do NOT blend the old setting into the new one.\n"
        "3. COMPLETELY NEW CAST (no characters from the previous scene appear): "
        "Treat this as a fresh illustration. Use the reference only to maintain the overall "
        "art style and color warmth.\n\n"
        "ALWAYS prioritize the new scene description below over the reference image.\n"
    )

    return [
        types.Part(text=instruction),
        types.Part(inline_data=types.Blob(
            mime_type=previous_image_mime_type,
            data=base64.b64decode(previous_image_data),
        )),
        types.Part(text=f"New scene to illustrate: {prompt}"),
    ]


async def _generate_gemini(prompt: str, previous_image_data: str = "", previous_image_mime_type: str = "image/png", previous_scene_description: str = "") -> tuple[str, str]:
    """Generate image using Gemini models via Vertex AI (generate_content API)."""
    last_exc: Exception | None = None
    for attempt in range(2):
        try:
            response = await _client.aio.models.generate_content(
                model=IMAGE_MODEL,
                contents=_build_contents(prompt, previous_image_data, previous_image_mime_type, previous_scene_description),
                config=types.GenerateContentConfig(
                    response_modalities=["IMAGE"],
                    image_config=types.ImageConfig(aspect_ratio="4:3"),
                    safety_settings=[
                        types.SafetySetting(category="HARM_CATEGORY_DANGEROUS_CONTENT", threshold="BLOCK_LOW_AND_ABOVE"),
                        types.SafetySetting(category="HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold="BLOCK_LOW_AND_ABOVE"),
                        types.SafetySetting(category="HARM_CATEGORY_HARASSMENT", threshold="BLOCK_LOW_AND_ABOVE"),
                        types.SafetySetting(category="HARM_CATEGORY_HATE_SPEECH", threshold="BLOCK_LOW_AND_ABOVE"),
                    ],
                ),
            )
            for part in response.candidates[0].content.parts:
                if part.inline_data:
                    return base64.b64encode(part.inline_data.data).decode("utf-8"), part.inline_data.mime_type or "image/png"
            raise HTTPException(status_code=500, detail="No image in response")
        except HTTPException:
            raise
        except Exception as e:
            last_exc = e
            if attempt == 0:
                print(f"[image_gen] Gemini attempt 1 failed ({e}), retrying…")
                await asyncio.sleep(2)
    raise last_exc  # type: ignore[misc]


async def _generate_gemini_api_key(prompt: str, previous_image_data: str = "", previous_image_mime_type: str = "image/png", previous_scene_description: str = "") -> tuple[str, str]:
    """Generate image using Gemini API key (AI Studio — shorter rate limit intervals than Vertex AI)."""
    if not _api_key_client:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")
    last_exc: Exception | None = None
    for attempt in range(2):
        try:
            response = await _api_key_client.aio.models.generate_content(
                model=IMAGE_MODEL,
                contents=_build_contents(prompt, previous_image_data, previous_image_mime_type, previous_scene_description),
                config=types.GenerateContentConfig(
                    response_modalities=["IMAGE", "TEXT"],
                ),
            )
            for part in response.candidates[0].content.parts:
                if part.inline_data and part.inline_data.data:
                    return base64.b64encode(part.inline_data.data).decode("utf-8"), part.inline_data.mime_type or "image/png"
            raise HTTPException(status_code=500, detail="No image in response")
        except HTTPException:
            raise
        except Exception as e:
            last_exc = e
            if attempt == 0:
                print(f"[image_gen] Gemini API-key attempt 1 failed ({e}), retrying…")
                await asyncio.sleep(2)
    raise last_exc  # type: ignore[misc]


async def _is_safe_for_children(content: str) -> bool:
    """Return True if the content is appropriate for children aged 4-10."""
    prompt = (
        f"Is this content appropriate for a children's story app for ages 4-10?\n"
        f"Content: \"{content}\"\n\n"
        "Reply with exactly one word: SAFE or UNSAFE.\n"
        "Mark UNSAFE for: graphic violence, weapons, blood, death, horror, adult/sexual themes, "
        "drugs, hate speech, self-harm, war, terrorism, or genuinely disturbing content. "
        "Also mark UNSAFE for any real-world sharp or dangerous objects that could injure a child, "
        "such as scissors, knives, screwdrivers, hammers, saws, drills, needles, syringes, "
        "lighters, matches, or other tools/items a parent would keep away from young children.\n"
        "Mark SAFE for: animals, magic, adventure, friendship, food, space, nature, fantasy, "
        "everyday life, spooky/Halloween themes (ghosts, witches, pumpkins, haunted houses), "
        "playful scary content, mysteries, mild suspense, and anything a child would enjoy."
    )
    try:
        response = await asyncio.wait_for(
            _extract_client.aio.models.generate_content(model=EXTRACT_MODEL, contents=prompt),
            timeout=6.0,
        )
        return "UNSAFE" not in response.text.strip().upper()
    except Exception:
        return True  # fail open — don't block on classifier error


class ThemeCheckRequest(BaseModel):
    theme: str


class ThemeCheckResponse(BaseModel):
    safe: bool


@router.post("/api/check-theme", response_model=ThemeCheckResponse)
async def check_theme(request: ThemeCheckRequest):
    """Check whether a custom story theme is appropriate for children."""
    if not request.theme.strip():
        return ThemeCheckResponse(safe=True)
    safe = await _is_safe_for_children(request.theme.strip())
    print(f"[check-theme] '{request.theme}' → {'SAFE' if safe else 'UNSAFE'}")
    return ThemeCheckResponse(safe=safe)


class SketchPreviewRequest(BaseModel):
    sketch_data: str   # raw base64 JPEG — no data: prefix
    image_style: str


class SketchPreviewResponse(BaseModel):
    label: str         # "a friendly blue dragon"
    image_data: str    # base64 illustration
    mime_type: str


async def _generate_from_sketch(sketch_bytes: bytes, image_style: str, label: str = "") -> tuple[str, str]:
    """Recreate a child's sketch as a storybook illustration using the sketch as direct input."""
    subject_hint = f"The subject is: {label}. " if label else ""
    contents = [
        types.Part(text=(
            f"{SAFETY_PREFIX}"
            f"{subject_hint}"
            "Recreate this as a warm, colorful children's storybook illustration. "
            "Keep the exact same subject and composition as the original. "
            "Friendly, charming, simple clean background, no text, no words."
        )),
        types.Part(inline_data=types.Blob(mime_type="image/jpeg", data=sketch_bytes)),
    ]
    if _api_key_client:
        response = await _api_key_client.aio.models.generate_content(
            model=IMAGE_MODEL,
            contents=contents,
            config=types.GenerateContentConfig(response_modalities=["IMAGE", "TEXT"]),
        )
    else:
        response = await _client.aio.models.generate_content(
            model=IMAGE_MODEL,
            contents=contents,
            config=types.GenerateContentConfig(
                response_modalities=["IMAGE"],
                image_config=types.ImageConfig(aspect_ratio="4:3"),
            ),
        )
    for part in response.candidates[0].content.parts:
        if part.inline_data and part.inline_data.data:
            return base64.b64encode(part.inline_data.data).decode("utf-8"), part.inline_data.mime_type or "image/png"
    raise HTTPException(status_code=500, detail="No image in sketch response")


@router.post("/api/sketch-preview", response_model=SketchPreviewResponse)
async def sketch_preview(request: SketchPreviewRequest):
    """Recreate a child's sketch/photo as a storybook illustration."""
    try:
        sketch_bytes = base64.b64decode(request.sketch_data)
        print(f"[sketch-preview] Starting — image size: {len(sketch_bytes)} bytes, model: {IMAGE_MODEL}")

        label_coro = _extract_client.aio.models.generate_content(
            model=EXTRACT_MODEL,
            contents=[
                types.Part(inline_data=types.Blob(mime_type="image/jpeg", data=sketch_bytes)),
                types.Part(text=(
                    "A young child drew or photographed this. In 3–6 simple, friendly words describe "
                    "the main subject — e.g. 'a friendly blue dragon', 'a big rainbow castle', "
                    "'a red toy car'. No punctuation at the end. Keep it imaginative and warm."
                )),
            ],
        )

        # Always get label first so image generation is guided by the same description
        print("[sketch-preview] Step 1 — extracting label")
        label_result = await asyncio.wait_for(label_coro, timeout=15.0)
        label = label_result.text.strip().rstrip(".")
        print(f"[sketch-preview] Label: {label!r}")

        # Safety check — reject inappropriate content before generating an image
        if not await _is_safe_for_children(label):
            print(f"[sketch-preview] Blocked unsafe content: {label!r}")
            raise HTTPException(status_code=400, detail="unsafe_content")

        print("[sketch-preview] Generating image-from-sketch with label hint")
        image_b64, mime_type = await asyncio.wait_for(
            _generate_from_sketch(sketch_bytes, request.image_style, label),
            timeout=45.0,
        )

        print(f"[sketch-preview] Done — label: {label!r}, image: {len(image_b64)} chars")
        return SketchPreviewResponse(label=label, image_data=image_b64, mime_type=mime_type)

    except asyncio.TimeoutError:
        print("[sketch-preview] Timed out after 45s")
        raise HTTPException(status_code=504, detail="Preview timed out — please try again")
    except HTTPException:
        raise
    except Exception as e:
        print(f"[sketch-preview] Error: {type(e).__name__}: {e}")
        raise HTTPException(status_code=500, detail="Sketch preview failed")


class ImageRequest(BaseModel):
    scene_description: str
    story_context: str = ""
    image_style: str
    session_id: str
    previous_image_data: str = ""
    previous_image_mime_type: str = "image/png"
    previous_scene_description: str = ""
    skip_extraction: bool = False  # True when Gemini wrote the scene description directly via tool call


class ImageResponse(BaseModel):
    image_data: str     # base64 PNG
    mime_type: str
    scene_description: str


@router.post("/api/image", response_model=ImageResponse)
async def generate_scene_image(request: ImageRequest):
    """Generate a story scene image from a description."""

    if len(request.scene_description) > 2000:
        raise HTTPException(status_code=400, detail="Scene description too long")

    try:
        scene_text = _build_scene_prompt(request.scene_description, request.story_context)
        print(f"[image_gen] Scene: {request.scene_description[:80]}...")

        prompt = f"{SAFETY_PREFIX}{request.image_style}. {scene_text}"

        prev_data = request.previous_image_data
        prev_mime = request.previous_image_mime_type
        prev_scene = request.previous_scene_description

        if _api_key_client:
            # Gemini API key (AI Studio) — preferred: shorter rate limit intervals
            image_b64, mime_type = await _generate_gemini_api_key(prompt, prev_data, prev_mime, prev_scene)
        else:
            # Fallback: Gemini via Vertex AI
            image_b64, mime_type = await _generate_gemini(prompt, prev_data, prev_mime, prev_scene)

        return ImageResponse(
            image_data=image_b64,
            mime_type=mime_type,
            scene_description=request.scene_description,
        )

    except HTTPException:
        raise
    except Exception as e:
        error_str = str(e)
        print(f"[image_gen] Error: {e}")
        if "429" in error_str or "RESOURCE_EXHAUSTED" in error_str:
            raise HTTPException(status_code=429, detail="Rate limited — try again later")
        raise HTTPException(status_code=500, detail="Image generation failed")


# ── Story Recap ────────────────────────────────────────────────────────────────

class RecapScene(BaseModel):
    """One actual scene from the session — image data + short description."""
    image_data: str          # base64 PNG/JPEG from the session
    mime_type: str = "image/png"
    description: str = ""   # short hint (100 chars), used only if image unavailable


class StoryRecapRequest(BaseModel):
    character_name: str
    image_style: str
    scenes: list[RecapScene] = []        # preferred: actual session images
    scene_descriptions: list[str] = []  # legacy fallback (ignored when scenes provided)
    narrations: list[str] = []          # pre-built narrations from transcript — skip LLM narration when provided


class StoryRecapResponse(BaseModel):
    title: str              # 4-6 word storybook title generated from the session
    narrations: list[str]   # one narration string per scene, in order


_RECAP_SAFETY = [
    types.SafetySetting(category="HARM_CATEGORY_DANGEROUS_CONTENT", threshold="BLOCK_LOW_AND_ABOVE"),
    types.SafetySetting(category="HARM_CATEGORY_SEXUALLY_EXPLICIT",  threshold="BLOCK_LOW_AND_ABOVE"),
    types.SafetySetting(category="HARM_CATEGORY_HARASSMENT",         threshold="BLOCK_LOW_AND_ABOVE"),
    types.SafetySetting(category="HARM_CATEGORY_HATE_SPEECH",        threshold="BLOCK_LOW_AND_ABOVE"),
]


async def _generate_title(scenes: list[RecapScene], character_name: str) -> str:
    """Generate a 4-6 word storybook title from the first scene image."""
    try:
        first = scenes[0]
        contents = [types.Content(role="user", parts=[
            types.Part(inline_data=types.Blob(
                data=base64.b64decode(first.image_data),
                mime_type=first.mime_type,
            )),
            types.Part(text=(
                f"A children's story was told by {character_name}. "
                "Looking at this opening illustration, generate a magical 4-6 word storybook title. "
                "Examples: 'The Dragon Who Found a Friend', 'A Very Brave Little Star', "
                "'The Day the Ocean Sang'. "
                "Return ONLY the title — no quotes, no punctuation at the end."
            )),
        ])]
        response = await asyncio.wait_for(
            _extract_client.aio.models.generate_content(
                model=EXTRACT_MODEL,
                contents=contents,
                config=types.GenerateContentConfig(safety_settings=_RECAP_SAFETY),
            ),
            timeout=15.0,
        )
        return response.candidates[0].content.parts[0].text.strip().strip('"').strip("'")
    except Exception as e:
        print(f"[story-recap] Title generation error: {e}")
        return f"A Story with {character_name}"


async def _narrate_scene(scene: RecapScene, character_name: str) -> str:
    """Ask Gemini to narrate a single scene image in the character's storytelling voice."""
    try:
        contents = [types.Content(role="user", parts=[
            types.Part(inline_data=types.Blob(
                data=base64.b64decode(scene.image_data),
                mime_type=scene.mime_type,
            )),
            types.Part(text=(
                f"You are {character_name}, a beloved children's storyteller. "
                f"This illustration is from the story you just told a child. "
                f"Write exactly 2 warm, vivid sentences narrating THIS specific moment — "
                f"describe what is actually happening in this image, in your storytelling voice. "
                f"Be faithful to what you see. No preamble, just the narration."
            )),
        ])]

        response = await asyncio.wait_for(
            _extract_client.aio.models.generate_content(
                model=EXTRACT_MODEL,
                contents=contents,
                config=types.GenerateContentConfig(
                    safety_settings=_RECAP_SAFETY,
                ),
            ),
            timeout=20.0,
        )
        text = response.candidates[0].content.parts[0].text.strip()
        return text
    except Exception as e:
        print(f"[story-recap] Narration error for scene: {e}")
        return scene.description or "And the adventure continued…"


@router.post("/api/story-recap", response_model=StoryRecapResponse)
async def generate_story_recap(request: StoryRecapRequest):
    """
    Generate a storybook recap of the session.

    When actual scene images are provided (request.scenes), Gemini narrates each
    image in the character's voice — a faithful recap of what actually happened.
    The original session images are reused; no new images are generated.
    """
    scenes = [s for s in request.scenes if s.image_data]

    if not scenes:
        raise HTTPException(status_code=400, detail="No scene images provided.")

    if request.narrations:
        # Narrations already built from transcript — just generate a title
        print(f"[story-recap] Title-only for {request.character_name} ({len(scenes)} scenes, narrations pre-built)")
        title = await _generate_title(scenes, request.character_name)
        narrations = request.narrations
    else:
        # Legacy path: no pre-built narrations — generate them via LLM (serialized to avoid 429)
        print(f"[story-recap] Narrating {len(scenes)} actual scene images for {request.character_name}")
        title = await _generate_title(scenes, request.character_name)
        narrations = []
        for s in scenes:
            narrations.append(await _narrate_scene(s, request.character_name))

    print(f"[story-recap] Done — title: {title!r}, {len(narrations)} narrations for {request.character_name}")
    return StoryRecapResponse(title=title, narrations=narrations)


# ── Character TTS ───────────────────────────────────────────────────────────────

class TTSRequest(BaseModel):
    text: str
    character_id: str


class TTSResponse(BaseModel):
    audio_data: str   # base64 PCM16 at 24kHz
    mime_type: str    # e.g. "audio/pcm;rate=24000"


@router.post("/api/tts", response_model=TTSResponse)
async def character_tts(request: TTSRequest):
    """
    Generate a short character voice line using Gemini's audio generation.
    Uses the same voice name as the character's Gemini Live narrator.
    """
    if not _api_key_client:
        raise HTTPException(status_code=503, detail="TTS not available — GEMINI_API_KEY not set")

    character = get_character(request.character_id)
    voice_name = character.voice_name if character else "Kore"

    print(f"[tts] Generating for character={request.character_id}, voice={voice_name}")

    try:
        response = await asyncio.wait_for(
            _api_key_client.aio.models.generate_content(
                model="gemini-2.5-flash-preview-tts",
                contents=request.text,
                config=types.GenerateContentConfig(
                    response_modalities=["AUDIO"],
                    speech_config=types.SpeechConfig(
                        voice_config=types.VoiceConfig(
                            prebuilt_voice_config=types.PrebuiltVoiceConfig(
                                voice_name=voice_name,
                            )
                        )
                    ),
                ),
            ),
            timeout=15.0,
        )
        for part in response.candidates[0].content.parts:
            if part.inline_data and part.inline_data.data:
                audio_b64 = base64.b64encode(part.inline_data.data).decode()
                mime = part.inline_data.mime_type or "audio/pcm;rate=24000"
                print(f"[tts] Done — {len(audio_b64)} chars, mime={mime}")
                return TTSResponse(audio_data=audio_b64, mime_type=mime)
        raise HTTPException(status_code=500, detail="No audio in TTS response")
    except asyncio.TimeoutError:
        raise HTTPException(status_code=504, detail="TTS timed out")
    except HTTPException:
        raise
    except Exception as e:
        print(f"[tts] Error: {e}")
        raise HTTPException(status_code=500, detail="TTS generation failed")
