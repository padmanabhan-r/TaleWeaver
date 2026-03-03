# backend/image_gen.py
"""Story scene image generation — model controlled via IMAGE_MODEL env var."""

import asyncio
import base64
import os
from google import genai
from google.genai import types
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

PROJECT_ID = os.environ["GOOGLE_CLOUD_PROJECT"]
IMAGE_MODEL = os.environ["IMAGE_MODEL"]
IMAGE_LOCATION = os.environ["IMAGE_LOCATION"]
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
EXTRACT_MODEL = "gemini-2.0-flash-lite"

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


async def _extract_english_scene(transcript: str, story_context: str) -> str:
    """Extract a concise English visual scene description from story narration in any language."""
    context_section = (
        f"Story so far (use this to identify the exact characters, species, names, and setting):\n"
        f"{story_context[:1500]}\n\n"
    ) if story_context else ""

    prompt = (
        f"{context_section}"
        "The storyteller just spoke the narration below. "
        "Identify the single most visually interesting moment in this narration and describe it "
        "as a concise English image description (2-3 sentences). "
        "Be SPECIFIC — name the exact character (their species, appearance, clothing), "
        "the exact setting (forest, village, ocean, cave, etc.), and the precise action happening. "
        "Use the story context above to get character details exactly right. "
        "Do NOT be generic. Do NOT write 'a character in a setting'. "
        "Write what a painter would actually paint: specific subject, specific place, specific moment. "
        "No dialogue, no abstract concepts — purely visual.\n\n"
        f"Narration: {transcript[:1500]}"
    )
    response = await _extract_client.aio.models.generate_content(
        model=EXTRACT_MODEL,
        contents=prompt,
    )
    return response.text.strip()


async def _generate_imagen(prompt: str) -> tuple[str, str]:
    """Generate image using Imagen models (generate_images API)."""
    response = await _client.aio.models.generate_images(
        model=IMAGE_MODEL,
        prompt=prompt,
        config=types.GenerateImagesConfig(
            aspect_ratio="4:3",
            number_of_images=1,
            safety_filter_level="BLOCK_LOW_AND_ABOVE",
            person_generation="ALLOW_ALL",
        ),
    )
    if response.generated_images:
        image_bytes = response.generated_images[0].image.image_bytes
        return base64.b64encode(image_bytes).decode("utf-8"), "image/png"
    raise HTTPException(status_code=500, detail="No image in response")


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


async def _generate_gemini_api_key(prompt: str, previous_image_data: str = "", previous_image_mime_type: str = "image/png", previous_scene_description: str = "") -> tuple[str, str]:
    """Generate image using Gemini API key (AI Studio — shorter rate limit intervals than Vertex AI)."""
    if not _api_key_client:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")
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


async def _is_safe_for_children(content: str) -> bool:
    """Return True if the content is appropriate for children aged 4-10."""
    prompt = (
        f"Is this content appropriate for a children's story app for ages 4-10?\n"
        f"Content: \"{content}\"\n\n"
        "Reply with exactly one word: SAFE or UNSAFE.\n"
        "Mark UNSAFE for: violence, weapons, blood, death, horror, adult/sexual themes, "
        "drugs, hate speech, self-harm, war, terrorism, or anything frightening or dangerous.\n"
        "Mark SAFE for: animals, magic, adventure, friendship, food, space, nature, fantasy, everyday life."
    )
    try:
        response = await asyncio.wait_for(
            _extract_client.aio.models.generate_content(model=EXTRACT_MODEL, contents=prompt),
            timeout=6.0,
        )
        return "UNSAFE" not in response.text.strip().upper()
    except Exception:
        return True  # fail open — don't block on classifier error


async def _generate_opening(character_name: str, character_language: str, theme: str, prop_description: str) -> tuple[str, str]:
    """
    Generate a creative story opening + visual scene description in one Flash Lite call.
    Returns (opening_text, scene_description).
    opening_text is in the character's language; scene_description is always English (for image gen).
    """
    prop_ctx = f"\nThe story subject/prop: {prop_description}" if prop_description else ""
    theme_ctx = f"\nTheme: {theme}" if theme and theme not in ("camera_prop", "sketch") else ""
    lang_note = f" Write the STORY section in {character_language}." if character_language != "English" else ""

    prompt = (
        f"You are {character_name}, a beloved storyteller for children aged 4-10.\n"
        f"Write the opening 3-4 sentences of a brand-new, creative children's story.{theme_ctx}{prop_ctx}\n\n"
        "Requirements:\n"
        "- Start mid-scene immediately — no 'Once upon a time' or preamble\n"
        "- Be vivid, exciting, and completely different from any previous story\n"
        "- End mid-action so the story feels alive and ongoing\n"
        f"- STORY section:{lang_note}\n"
        "- SCENE section: always in English, describe the single most visual moment as a painter would paint it\n\n"
        "Respond in EXACTLY this format (two lines, nothing else):\n"
        "STORY: [3-4 sentence story opening]\n"
        "SCENE: [1-2 sentence vivid English painter's description]"
    )

    response = await _extract_client.aio.models.generate_content(
        model=EXTRACT_MODEL,
        contents=prompt,
    )
    text = response.text.strip()

    story_idx = text.find("STORY:")
    scene_idx = text.find("SCENE:")

    if story_idx >= 0 and scene_idx > story_idx:
        opening_text = text[story_idx + len("STORY:"):scene_idx].strip()
        scene_description = text[scene_idx + len("SCENE:"):].strip()
    elif story_idx >= 0:
        opening_text = text[story_idx + len("STORY:"):].strip()
        scene_description = opening_text[:300]
    else:
        opening_text = text
        scene_description = text[:300]

    return opening_text, scene_description


class StoryOpeningRequest(BaseModel):
    character_id: str
    character_name: str
    character_language: str
    image_style: str
    theme: str = ""
    prop_description: str = ""


class StoryOpeningResponse(BaseModel):
    opening_text: str
    image_data: str
    mime_type: str
    scene_description: str


@router.post("/api/story-opening", response_model=StoryOpeningResponse)
async def generate_story_opening(request: StoryOpeningRequest):
    """
    Pre-generate a story opening + first illustration before the live session begins.
    Called by the frontend when the user lands on StoryScreen, so the canvas isn't blank
    and Gemini Live can continue from an established opening.
    """
    try:
        opening_text, scene_description = await asyncio.wait_for(
            _generate_opening(
                request.character_name,
                request.character_language,
                request.theme,
                request.prop_description,
            ),
            timeout=15.0,
        )
        print(f"[story-opening] Opening: {opening_text[:80]}...")
        print(f"[story-opening] Scene: {scene_description}")

        prompt = f"{SAFETY_PREFIX}{request.image_style}, {scene_description}"

        if IMAGE_MODEL.startswith("imagen-"):
            image_b64, mime_type = await asyncio.wait_for(_generate_imagen(prompt), timeout=30.0)
        elif _api_key_client:
            image_b64, mime_type = await asyncio.wait_for(_generate_gemini_api_key(prompt), timeout=45.0)
        else:
            image_b64, mime_type = await asyncio.wait_for(_generate_gemini(prompt), timeout=45.0)

        return StoryOpeningResponse(
            opening_text=opening_text,
            image_data=image_b64,
            mime_type=mime_type,
            scene_description=scene_description,
        )

    except asyncio.TimeoutError:
        raise HTTPException(status_code=504, detail="Story opening timed out")
    except HTTPException:
        raise
    except Exception as e:
        print(f"[story-opening] Error: {e}")
        raise HTTPException(status_code=500, detail="Story opening generation failed")


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
            f"{image_style}, "
            f"{subject_hint}"
            "recreate this child's drawing as a colorful storybook illustration. "
            "Keep the exact same subject and composition as the sketch. "
            "Warm, friendly, simple clean background, no text, no words."
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

        if IMAGE_MODEL.startswith("imagen-"):
            # Imagen is text-only — use label as prompt
            print("[sketch-preview] Using Imagen — generating from label")
            prompt = (
                f"{SAFETY_PREFIX}{request.image_style}, "
                f"a charming storybook illustration of {label}, "
                "colorful, warm, friendly, simple clean background"
            )
            image_b64, mime_type = await asyncio.wait_for(_generate_imagen(prompt), timeout=30.0)
        else:
            # Gemini image models — pass label + sketch so image matches the label exactly
            print("[sketch-preview] Using Gemini — generating image-from-sketch with label hint")
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
        if request.skip_extraction:
            english_scene = request.scene_description
            print(f"[image_gen] Scene (from tool): {english_scene}")
        else:
            english_scene = await _extract_english_scene(request.scene_description, request.story_context)
            print(f"[image_gen] Scene extracted: {english_scene}")

        prompt = f"{SAFETY_PREFIX}{request.image_style}, {english_scene}"

        prev_data = request.previous_image_data
        prev_mime = request.previous_image_mime_type
        prev_scene = request.previous_scene_description

        if IMAGE_MODEL.startswith("imagen-"):
            # Imagen — text prompt only, no reference image support
            image_b64, mime_type = await _generate_imagen(prompt)
        elif _api_key_client:
            # Gemini API key (AI Studio) — preferred: shorter rate limit intervals
            image_b64, mime_type = await _generate_gemini_api_key(prompt, prev_data, prev_mime, prev_scene)
        else:
            # Fallback: Gemini via Vertex AI
            image_b64, mime_type = await _generate_gemini(prompt, prev_data, prev_mime, prev_scene)

        return ImageResponse(
            image_data=image_b64,
            mime_type=mime_type,
            scene_description=english_scene,
        )

    except HTTPException:
        raise
    except Exception as e:
        error_str = str(e)
        print(f"[image_gen] Error: {e}")
        if "429" in error_str or "RESOURCE_EXHAUSTED" in error_str:
            raise HTTPException(status_code=429, detail="Rate limited — try again later")
        raise HTTPException(status_code=500, detail="Image generation failed")
