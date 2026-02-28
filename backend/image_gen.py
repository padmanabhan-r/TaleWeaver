# backend/image_gen.py
"""Story scene image generation — model controlled via IMAGE_MODEL env var."""

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


def _build_contents(prompt: str, previous_image_data: str, previous_image_mime_type: str):
    """Build multi-part contents with optional previous image for visual continuity."""
    if previous_image_data:
        return [
            types.Part(text="Previous scene (maintain visual continuity — same characters, art style, color palette):"),
            types.Part(inline_data=types.Blob(
                mime_type=previous_image_mime_type,
                data=base64.b64decode(previous_image_data),
            )),
            types.Part(text=f"Next scene: {prompt}"),
        ]
    return prompt


async def _generate_gemini(prompt: str, previous_image_data: str = "", previous_image_mime_type: str = "image/png") -> tuple[str, str]:
    """Generate image using Gemini models via Vertex AI (generate_content API)."""
    response = await _client.aio.models.generate_content(
        model=IMAGE_MODEL,
        contents=_build_contents(prompt, previous_image_data, previous_image_mime_type),
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


async def _generate_gemini_api_key(prompt: str, previous_image_data: str = "", previous_image_mime_type: str = "image/png") -> tuple[str, str]:
    """Generate image using Gemini API key (for models not yet on Vertex AI)."""
    if not _api_key_client:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")
    async for chunk in await _api_key_client.aio.models.generate_content_stream(
        model=IMAGE_MODEL,
        contents=_build_contents(prompt, previous_image_data, previous_image_mime_type),
        config=types.GenerateContentConfig(
            thinking_config=types.ThinkingConfig(thinking_level="MINIMAL"),
            response_modalities=["IMAGE", "TEXT"],
            image_config=types.ImageConfig(image_size="1K"),
        ),
    ):
        if chunk.parts and chunk.parts[0].inline_data and chunk.parts[0].inline_data.data:
            data = chunk.parts[0].inline_data
            return base64.b64encode(data.data).decode("utf-8"), data.mime_type or "image/png"
    raise HTTPException(status_code=500, detail="No image in response")


class ImageRequest(BaseModel):
    scene_description: str
    story_context: str = ""
    image_style: str
    session_id: str
    previous_image_data: str = ""
    previous_image_mime_type: str = "image/png"


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
        english_scene = await _extract_english_scene(request.scene_description, request.story_context)
        print(f"[image_gen] Scene extracted: {english_scene}")

        prompt = f"{SAFETY_PREFIX}{request.image_style}, {english_scene}"

        prev_data = request.previous_image_data
        prev_mime = request.previous_image_mime_type

        if IMAGE_MODEL.startswith("imagen-"):
            # Imagen doesn't support reference images — text prompt only
            image_b64, mime_type = await _generate_imagen(prompt)
        elif IMAGE_MODEL.startswith("gemini-3."):
            image_b64, mime_type = await _generate_gemini_api_key(prompt, prev_data, prev_mime)
        else:
            image_b64, mime_type = await _generate_gemini(prompt, prev_data, prev_mime)

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
