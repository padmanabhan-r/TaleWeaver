# backend/story_planner.py
"""Story Planner — ADK LlmAgent that generates a story outline before a session starts.

This is the ADK layer of TaleWeaver. A google.adk LlmAgent takes a character + theme
and returns a short story plan (setting, hero situation, plot beats, resolution).
The plan is passed as opening_text to the WebSocket init message so the character
has a richer story structure from the very first word.
"""

import json
import os

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from google.adk.agents import LlmAgent
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types as genai_types
from opik.integrations.adk import OpikTracer, track_adk_agent_recursive

from characters import get_character

router = APIRouter()

# ── ADK agent ─────────────────────────────────────────────────────────────────

_PLANNER_MODEL = os.getenv("STORY_PLANNER_MODEL", "gemini-2.5-flash")

_session_service = InMemorySessionService()

_planner_agent = LlmAgent(
    name="story_planner",
    model=_PLANNER_MODEL,
    description="Generates a warm, age-appropriate story plan for a children's storytelling session.",
    instruction=(
        "You are a creative children's story editor. "
        "Given a storyteller character and a story theme, produce a brief story plan as JSON. "
        "The plan guides a live storytelling session with a child aged 4–10. "
        "Return ONLY a JSON object with exactly these keys:\n"
        "  setting: one sentence describing where the story takes place\n"
        "  hero: the child protagonist's situation at the start (one sentence)\n"
        "  beats: a list of 3–4 short plot beat strings (each 10 words or fewer)\n"
        "  ending: one sentence describing the warm, satisfying resolution\n\n"
        "The content must be child-safe, warm, and imaginative. "
        "No extra text, no markdown, no code fences — just the raw JSON object."
    ),
)

_opik_tracer = OpikTracer(
    tags=["taleweaver", "story-planner", "adk"],
    metadata={"model": _PLANNER_MODEL},
)
track_adk_agent_recursive(_planner_agent, _opik_tracer)

_runner = Runner(
    agent=_planner_agent,
    app_name="taleweaver_planner",
    session_service=_session_service,
)


# ── Request / response models ──────────────────────────────────────────────────

class StoryPlanRequest(BaseModel):
    character_id: str
    theme: str = ""


class StoryPlan(BaseModel):
    setting: str
    hero: str
    beats: list[str]
    ending: str


class StoryPlanResponse(BaseModel):
    plan: StoryPlan
    opening_text: str   # ready-to-use hint for the WebSocket init message


# ── Endpoint ───────────────────────────────────────────────────────────────────

@router.post("/api/story-plan", response_model=StoryPlanResponse)
async def generate_story_plan(request: StoryPlanRequest):
    """Use an ADK LlmAgent to generate a story plan for the upcoming session."""
    character = get_character(request.character_id)
    if not character:
        raise HTTPException(status_code=400, detail=f"Unknown character: {request.character_id}")

    theme_clause = f"Theme / setting requested: {request.theme}" if request.theme else "Theme: any imaginative adventure the character loves"

    prompt = (
        f"Storyteller character: {character.name}\n"
        f"Character style: {character.image_style}\n"
        f"{theme_clause}\n\n"
        "Generate the story plan now."
    )

    session_id = f"plan-{request.character_id}-{os.urandom(4).hex()}"

    try:
        session = _session_service.create_session(
            app_name="taleweaver_planner",
            user_id="anon",
            session_id=session_id,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not create planner session: {e}")

    message = genai_types.Content(
        role="user",
        parts=[genai_types.Part(text=prompt)],
    )

    plan_text = ""
    try:
        async for event in _runner.run_async(
            user_id="anon",
            session_id=session.id,
            new_message=message,
        ):
            if event.is_final_response() and event.content and event.content.parts:
                plan_text = event.content.parts[0].text or ""
                break
    except Exception as e:
        print(f"[story-planner] ADK error: {e}")
        raise HTTPException(status_code=500, detail="Story planner failed.")

    if not plan_text:
        raise HTTPException(status_code=500, detail="Story planner returned no output.")

    # Strip markdown code fences if the model adds them despite instructions
    plan_text = plan_text.strip()
    if plan_text.startswith("```"):
        plan_text = plan_text.split("\n", 1)[-1].rsplit("```", 1)[0].strip()

    try:
        plan_dict = json.loads(plan_text)
    except json.JSONDecodeError as e:
        print(f"[story-planner] JSON parse error: {e}\nRaw: {plan_text[:200]}")
        raise HTTPException(status_code=500, detail="Story planner returned invalid JSON.")

    plan = StoryPlan(
        setting=plan_dict.get("setting", ""),
        hero=plan_dict.get("hero", ""),
        beats=plan_dict.get("beats", []),
        ending=plan_dict.get("ending", ""),
    )

    # Compose a compact opening_text hint for the storyteller
    beats_preview = "; ".join(plan.beats[:3])
    opening_text = (
        f"[Story plan] Setting: {plan.setting} | "
        f"Start: {plan.hero} | "
        f"Moments: {beats_preview} | "
        f"Resolution: {plan.ending}"
    )

    print(f"[story-planner] Plan ready for {character.name} — {len(plan.beats)} beats")
    return StoryPlanResponse(plan=plan, opening_text=opening_text)
