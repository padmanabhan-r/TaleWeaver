# backend/main.py
"""FastAPI application — WebSocket proxy and image generation."""

import asyncio
import json
import os
import uuid
from pathlib import Path

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from dotenv import load_dotenv

load_dotenv()

from proxy import run_proxy_session
from image_gen import router as image_router

app = FastAPI(title="TaleWeaver Backend")

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
        await run_proxy_session(ws, character_id, session_id)

    except asyncio.TimeoutError:
        print(f"[ws] Session {session_id}: timeout waiting for character selection")
        await ws.close(code=1008, reason="Timeout")
    except WebSocketDisconnect:
        print(f"[ws] Session {session_id}: client disconnected")
    except Exception as e:
        print(f"[ws] Session {session_id}: error: {e}")
        try:
            await ws.close(code=1011, reason="Internal error")
        except Exception:
            pass


# ── Frontend SPA ──────────────────────────────────────────────────────────────

FRONTEND_DIST = Path(__file__).parent / "frontend" / "dist"


def _serve_spa(path: str = ""):
    """Serve the React SPA — real files get served directly, everything else gets index.html."""
    if not FRONTEND_DIST.exists():
        return {"error": "Frontend not built", "path": str(FRONTEND_DIST)}
    if path:
        candidate = FRONTEND_DIST / path
        if candidate.is_file():
            return FileResponse(candidate)
    return FileResponse(FRONTEND_DIST / "index.html")


@app.get("/", include_in_schema=False)
async def serve_root():
    return _serve_spa()


@app.get("/{full_path:path}", include_in_schema=False)
async def serve_frontend(full_path: str):
    return _serve_spa(full_path)
