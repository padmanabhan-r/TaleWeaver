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

    except HTTPException:
        raise
    except Exception as e:
        print(f"[image_gen] Error: {e}")
        raise HTTPException(status_code=500, detail="Image generation failed")
