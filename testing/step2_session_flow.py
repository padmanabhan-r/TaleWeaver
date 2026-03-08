"""
TaleWeaver — Step 2: Session Flow Explorer
==========================================
Streamlit app showing the full data flow from Step 1 outputs into the
live session and during-story image generation, without needing real audio.

Run with:
    cd /Users/paddy/Documents/Github/TaleWeaver
    uv run streamlit run notebooks/step2_session_flow.py
"""

import sys, os, base64, asyncio
from pathlib import Path

# ── Backend on path ──────────────────────────────────────────────────────────
BACKEND = str(Path(__file__).parent.parent / "backend")
if BACKEND not in sys.path:
    sys.path.insert(0, BACKEND)

from dotenv import load_dotenv
load_dotenv(str(Path(__file__).parent.parent / "backend" / ".env"))

import opik
opik.configure()

import streamlit as st
from characters import CHARACTERS, build_gemini_setup_message
from proxy import _begin_turns

# ── Page config ──────────────────────────────────────────────────────────────
st.set_page_config(
    page_title="TaleWeaver — Session Flow",
    layout="wide",
    initial_sidebar_state="expanded",
)

st.title("TaleWeaver — Step 2: Session Flow")
st.caption(
    "Inspect every message that flows between the app, backend, and Gemini. "
    "Test image generation for both trigger paths without needing real audio."
)


# ── Helpers ───────────────────────────────────────────────────────────────────
def run(coro):
    """Run an async coroutine from synchronous Streamlit context."""
    return asyncio.run(coro)


def _trunc_b64(b64: str, label: str = "base64") -> str:
    return f"<{label}: {len(b64):,} chars>"


# ── Sidebar: Session Config ───────────────────────────────────────────────────
with st.sidebar:
    st.header("Session Config")
    st.caption("Mirror of what step 1A / 1B / 1C produces")

    char_id = st.selectbox(
        "Character",
        options=list(CHARACTERS.keys()),
        format_func=lambda x: f"{CHARACTERS[x].name} ({CHARACTERS[x].language})",
    )
    char = CHARACTERS[char_id]

    st.markdown(f"**Voice:** `{char.voice_name}`  \n**Art style:** {char.image_style[:70]}...")

    st.divider()

    mode = st.radio("Story mode", ["Theme", "Camera Prop", "Sketch"], horizontal=True)

    if mode == "Theme":
        theme = st.text_input("Theme", value="Space")
        prop_image_b64: str | None = None
        prop_image_bytes: bytes | None = None
    else:
        theme = "camera_prop" if mode == "Camera Prop" else "sketch"
        uploaded = st.file_uploader(
            "Upload image (JPEG)",
            type=["jpg", "jpeg", "png"],
            help="Camera photo for Prop mode, drawing for Sketch mode",
        )
        if uploaded:
            prop_image_bytes = uploaded.read()
            prop_image_b64 = base64.b64encode(prop_image_bytes).decode()
            st.image(prop_image_bytes, caption="Uploaded prop/sketch", width=200)
        else:
            prop_image_b64 = None
            prop_image_bytes = None

    st.divider()
    opening_text = st.text_area(
        "Opening text (from /api/story-opening)",
        placeholder="Paste result.opening_text from step 1 notebook here…",
        height=120,
    )

    if opening_text:
        st.success("Opening text set — will be injected as a fake model turn.")
    else:
        st.info("No opening text — Gemini starts the story from scratch.")


# ── Tabs ──────────────────────────────────────────────────────────────────────
tab1, tab2, tab3 = st.tabs([
    "📡  Session Init & Gemini Setup",
    "🛠️  Image: Tool Call Path",
    "⏱️  Image: Fallback Timer Path",
])


# ─────────────────────────────────────────────────────────────────────────────
# TAB 1 — Session Init & Gemini Setup
# ─────────────────────────────────────────────────────────────────────────────
with tab1:
    st.markdown(
        "### What gets sent when the child presses **Begin Story**\n"
        "The frontend opens `WS /ws/story` and immediately sends an init message. "
        "The backend sets up a Gemini Live session, then kicks the story off."
    )

    # ── 1a: Browser → Backend (WS init) ─────────────────────────────────────
    st.subheader("① Browser → Backend (WS init)")
    st.caption("First JSON frame sent over the WebSocket")

    init_msg = {
        "character_id": char_id,
        "theme": theme or None,
        "prop_image": _trunc_b64(prop_image_b64, "base64 JPEG") if prop_image_b64 else None,
        "opening_text": (opening_text[:100] + "…") if len(opening_text) > 100 else opening_text or None,
    }
    st.json(init_msg)

    st.divider()

    # ── 1b: Backend → Gemini (setup) ────────────────────────────────────────
    st.subheader("② Backend → Gemini Live API (setup)")
    st.caption("Sent over the Gemini WebSocket before any story content")

    PROJECT_ID = os.environ.get("GOOGLE_CLOUD_PROJECT", "your-project-id")
    LOCATION   = os.environ.get("GOOGLE_CLOUD_LOCATION", "us-central1")
    setup_msg  = build_gemini_setup_message(char, PROJECT_ID, LOCATION)

    c1, c2, c3 = st.columns(3)
    with c1:
        with st.expander("🗣️ Voice & audio config", expanded=True):
            st.json(setup_msg["setup"]["generation_config"])
    with c2:
        with st.expander("🔧 Tools declared to Gemini", expanded=True):
            for fn in setup_msg["setup"]["tools"][0]["function_declarations"]:
                st.markdown(f"**`{fn['name']}`** — {fn['description'][:120]}…")
                st.json(fn["parameters"])
    with c3:
        with st.expander("📜 System prompt", expanded=False):
            st.text(char.system_prompt)

    st.divider()

    # ── 1c: Backend → Gemini (begin turns) ──────────────────────────────────
    st.subheader("③ Backend → Gemini Live API (story kickoff)")
    st.caption(
        "Sent right after setup confirmation. "
        "Contains the theme/image to ground the story, plus the pre-generated opening injected as a fake model turn."
    )

    begin_turns = _begin_turns(
        theme=theme if theme else None,
        prop_image=prop_image_b64,
        opening_text=opening_text or None,
    )

    for i, turn in enumerate(begin_turns):
        role_icon = "👦" if turn["role"] == "user" else "🤖"
        label = (
            "User: theme/image prompt (kicks off the story)"
            if turn["role"] == "user"
            else "Model (fake): opening text injected so Gemini continues naturally"
        )
        with st.expander(f"{role_icon} Turn {i+1} — `{turn['role']}`: {label}", expanded=True):
            for part in turn["parts"]:
                if "text" in part:
                    st.markdown(f"```\n{part['text']}\n```")
                elif "inline_data" in part:
                    mime = part["inline_data"]["mime_type"]
                    n    = len(part["inline_data"]["data"])
                    st.markdown(f"**`inline_data`** · `{mime}` · {n:,} base64 chars")
                    if prop_image_bytes:
                        st.image(prop_image_bytes, width=260)

    # ── 1d: Gemini → Browser (setup complete) ────────────────────────────────
    st.divider()
    st.subheader("④ Backend → Browser (setup complete)")
    st.caption("Forwarded to the browser so the UI knows which character is live")
    st.json({"setupComplete": True, "characterName": char.name, "characterId": char.id})


# ─────────────────────────────────────────────────────────────────────────────
# TAB 2 — Tool Call Path
# ─────────────────────────────────────────────────────────────────────────────
with tab2:
    st.markdown(
        "### `generate_illustration` tool call\n"
        "Gemini decides on its own that a scene deserves an illustration and calls this tool. "
        "The frontend **responds immediately** (so Gemini keeps talking) then fires `POST /api/image` "
        "with `skip_extraction: true` — the description is already clean English, no extra LLM step."
    )

    st.markdown(
        "**When Gemini calls this:**  \n"
        "- New location / setting introduced  \n"
        "- Character appearing for the first time  \n"
        "- Magical transformation or dramatic reveal  \n"
        "- Any moment that would make a beautiful storybook picture  \n\n"
        "**Rate limit:** at most once every 2 story beats (enforced by the system prompt)"
    )

    st.divider()

    scene_desc = st.text_area(
        "scene_description (as Gemini writes it — vivid, painter-friendly English)",
        value=(
            "A tiny golden fish named Mira leaps from a sparkling moonlit river, "
            "her scales scattering silver light, while a curious amber fox watches "
            "wide-eyed from the mossy bank below."
        ),
        height=90,
    )

    if st.button("⚡ Generate illustration (tool call path)", type="primary", key="btn_tool"):
        payload = dict(
            scene_description=scene_desc,
            story_context="",
            image_style=char.image_style,
            session_id="demo-session",
            skip_extraction=True,
            previous_image_data="",
            previous_image_mime_type="image/png",
            previous_scene_description="",
        )

        col_p, col_i = st.columns([1, 1])

        with col_p:
            st.markdown("**POST /api/image — payload**")
            display_payload = {**payload, "image_style": char.image_style[:60] + "…"}
            st.json(display_payload)
            st.markdown("**What the backend does:**")
            st.code(
                "# skip_extraction=True → no LLM extraction step\n"
                "english_scene = request.scene_description\n"
                'prompt = f"{SAFETY_PREFIX}{request.image_style}, {english_scene}"\n'
                "image_b64, mime_type = await _generate_gemini_api_key(prompt)",
                language="python",
            )

        with col_i:
            with st.spinner("Generating image…"):
                from image_gen import generate_scene_image, ImageRequest
                result = run(generate_scene_image(ImageRequest(**payload)))
            st.markdown("**Result**")
            st.image(base64.b64decode(result.image_data), use_container_width=True)
            st.caption(f"`{result.mime_type}` · {len(result.image_data):,} base64 chars")
            st.markdown(f"**Scene used:** {result.scene_description}")


# ─────────────────────────────────────────────────────────────────────────────
# TAB 3 — Fallback Timer Path
# ─────────────────────────────────────────────────────────────────────────────
with tab3:
    st.markdown(
        "### Fallback timer path (`turnComplete` → `/api/image`)\n"
        "When Gemini finishes speaking a turn, the frontend accumulates the transcription text. "
        "If enough time has passed, it fires `POST /api/image` with `skip_extraction: false` — "
        "the raw story text goes in, and the backend runs `_extract_english_scene` to pull out "
        "a clean visual description before generating the image."
    )

    c_info, c_code = st.columns([1, 1])
    with c_info:
        st.markdown(
            "**Rate limiting rules (useStoryImages.ts):**\n"
            "- Wait **8 seconds** after session start before any image  \n"
            "- Minimum **10 seconds** between images (configurable)  \n"
            "- If Vertex AI returns 429 → silently discard, reset timer  \n"
            "- Rolling `storyContext` keeps last ~2000 chars of all speech  \n"
            "- Last image passed as `previous_image_data` for visual continuity  \n"
        )
    with c_code:
        st.code(
            "// On every turnComplete:\n"
            "storyContext = (storyContext + ' ' + text).slice(-2000)\n\n"
            "if (now - sessionStart < 8_000) return;   // too early\n"
            "if (now - lastTrigger < intervalMs) return; // too soon\n\n"
            "fetch('/api/image', {\n"
            "  body: JSON.stringify({\n"
            "    scene_description: text.slice(0, 2000), // raw transcription\n"
            "    story_context: storyContext,\n"
            "    skip_extraction: false,  // backend will extract\n"
            "    ...prevImage,\n"
            "  })\n"
            "})",
            language="javascript",
        )

    st.divider()

    col_l, col_r = st.columns([1, 1])
    with col_l:
        story_text = st.text_area(
            "Story transcription (raw text from the current turn)",
            value=(
                "And then Mia, the tiny red ladybug with seven sparkly spots, flew all the way to "
                "the very top of the enormous sunflower! She could see the whole meadow from up there — "
                "the silver stream winding between the tall grass, the old oak tree where the owl family "
                "lived, and far, far away, the purple mountains where the clouds were born."
            ),
            height=150,
        )
    with col_r:
        story_context = st.text_area(
            "Rolling story context (prior speech, last ~2000 chars)",
            placeholder="Paste earlier story text to show how context improves extraction…",
            height=150,
        )

    if st.button("⏱️ Trigger image generation (fallback path)", type="primary", key="btn_fallback"):
        col_ext, col_img = st.columns([1, 1])

        with col_ext:
            with st.spinner("Step 1 — extracting visual scene from story text…"):
                from image_gen import _extract_english_scene
                extracted = run(_extract_english_scene(story_text, story_context))

            st.markdown("**`_extract_english_scene` output:**")
            st.success(extracted)

            st.markdown("**POST /api/image — payload**")
            st.json({
                "scene_description": story_text[:100] + "… (full text sent)",
                "story_context": story_context[:80] + "…" if story_context else "",
                "image_style": char.image_style[:60] + "…",
                "session_id": "demo-session",
                "skip_extraction": False,
            })

            st.markdown("**What the backend does:**")
            st.code(
                "# skip_extraction=False → run extraction first\n"
                "english_scene = await _extract_english_scene(\n"
                "    request.scene_description,   # raw transcription\n"
                "    request.story_context,\n"
                ")\n"
                'prompt = f"{SAFETY_PREFIX}{request.image_style}, {english_scene}"\n'
                "image_b64, mime_type = await _generate_gemini_api_key(prompt)",
                language="python",
            )

        with col_img:
            with st.spinner("Step 2 — generating image…"):
                from image_gen import generate_scene_image, ImageRequest
                result = run(generate_scene_image(ImageRequest(
                    scene_description=story_text[:2000],
                    story_context=story_context,
                    image_style=char.image_style,
                    session_id="demo-session",
                    skip_extraction=False,
                )))

            st.markdown("**Result**")
            st.image(base64.b64decode(result.image_data), use_container_width=True)
            st.caption(f"`{result.mime_type}` · {len(result.image_data):,} base64 chars")
            st.markdown(f"**Extracted scene used:** {result.scene_description}")
