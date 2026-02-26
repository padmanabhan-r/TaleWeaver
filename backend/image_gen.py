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
EXTRACT_MODEL = "gemini-2.0-flash-lite"

SAFETY_PREFIX = (
    "child-safe illustration, age-appropriate for children aged 4-10, "
    "no violence, no scary content, no adult themes, cartoon style, "
    "no text, no words, no letters, no captions, no speech bubbles, no labels, purely visual, "
)

_client = genai.Client(vertexai=True, project=PROJECT_ID, location=IMAGE_LOCATION)
_extract_client = genai.Client(vertexai=True, project=PROJECT_ID, location="us-central1")

print(f"[image_gen] Using model: {IMAGE_MODEL} @ {IMAGE_LOCATION}")


async def _extract_english_scene(transcript: str, story_context: str) -> str:
    """Extract a concise English visual scene description from story narration in any language."""
    context_section = (
        f"Story so far (for context only — use this to correctly identify characters, "
        f"species, and setting):\n{story_context[:600]}\n\n"
    ) if story_context else ""

    prompt = (
        f"{context_section}"
        "From the CURRENT narration below, extract a concise visual scene description "
        "in English (1-2 sentences). Use the story context to correctly name and describe "
        "characters (e.g. if they are animals, keep them as animals). "
        "Describe only what to illustrate: setting, characters, key action. "
        "No dialogue, no abstract concepts, purely visual.\n\n"
        f"Current narration: {transcript[:300]}"
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


async def _generate_gemini(prompt: str) -> tuple[str, str]:
    """Generate image using Gemini models (generate_content API)."""
    response = await _client.aio.models.generate_content(
        model=IMAGE_MODEL,
        contents=prompt,
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


class ImageRequest(BaseModel):
    scene_description: str
    story_context: str = ""
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

    try:
        english_scene = await _extract_english_scene(request.scene_description, request.story_context)
        print(f"[image_gen] Scene extracted: {english_scene}")

        prompt = f"{SAFETY_PREFIX}{request.image_style}, {english_scene}"

        if IMAGE_MODEL.startswith("imagen-"):
            image_b64, mime_type = await _generate_imagen(prompt)
        else:
            image_b64, mime_type = await _generate_gemini(prompt)

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
