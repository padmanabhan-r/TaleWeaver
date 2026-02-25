# backend/scene_detector.py
"""Detects scene-worthy moments in story transcriptions and triggers image generation."""

import asyncio
import aiohttp
import re
from dataclasses import dataclass, field


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
    last_image_text: str = field(default="", init=False, repr=False)
    image_count: int = field(default=0, init=False, repr=False)
    max_images: int = field(default=8, init=False, repr=False)

    def should_generate_image(self, text: str) -> bool:
        """Determine if this transcription warrants an image."""
        if self.image_count >= self.max_images:
            return False
        if len(text.split()) < MIN_DESCRIPTION_WORDS:
            return False
        for pattern in COMPILED_TRIGGERS:
            if pattern.search(text):
                return True
        return False

    def extract_scene_description(self, text: str) -> str:
        """Extract the most descriptive sentence(s) for image generation."""
        sentences = text.split(". ")
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
        if text == self.last_image_text:
            return  # Avoid duplicates

        self.last_image_text = text
        self.image_count += 1
        scene_desc = self.extract_scene_description(text)

        print(f"[scene] Triggering image {self.image_count}: {scene_desc[:80]}...")

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
                        print(f"[scene] Image {self.image_count} generated ✓")
                    else:
                        print(f"[scene] Image generation failed: {resp.status}")
        except Exception as e:
            print(f"[scene] Image generation error: {e}")
