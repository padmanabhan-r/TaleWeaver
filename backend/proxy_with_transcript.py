# backend/proxy.py
"""Bidirectional WebSocket proxy between browser and Gemini Live API."""

import asyncio
import json
import os
import ssl
import certifi
from datetime import datetime, timezone
from pathlib import Path
import google.auth
from google.auth.transport.requests import Request
from fastapi import WebSocket, WebSocketDisconnect
from websockets.exceptions import ConnectionClosed
import websockets

from characters import build_gemini_setup_message, get_character, gemini_service_url

PROJECT_ID = os.environ["GOOGLE_CLOUD_PROJECT"]
LOCATION = os.environ.get("GOOGLE_CLOUD_LOCATION", "us-central1")

TRANSCRIPTS_DIR = Path(__file__).parent / "transcripts"


def get_access_token() -> str:
    """Get a fresh GCP access token using application default credentials."""
    creds, _ = google.auth.default(
        scopes=["https://www.googleapis.com/auth/cloud-platform"]
    )
    if not creds.valid:
        creds.refresh(Request())
    return creds.token


def _ts() -> str:
    return datetime.now(timezone.utc).strftime("%H:%M:%S.%f")[:-3]


def _append(events: list, entry: dict, t: str | None = None) -> None:
    entry["t"] = t or _ts()
    events.append(entry)


def _tap_gemini_message(data: dict, state: dict) -> None:
    """Extract loggable events from a Gemini→browser message.

    state = {"events": list, "char_buf": str, "char_buf_t": str | None}
    Character speech chunks are accumulated in char_buf and flushed as a
    single 'character' entry at turn_complete or interrupted.
    """
    events: list = state["events"]

    # Tool calls (generate_illustration, award_badge, …)
    for call in (data.get("toolCall") or {}).get("functionCalls") or []:
        _append(events, {
            "type": "tool_call",
            "name": call.get("name"),
            "args": call.get("args"),
        })

    sc = data.get("serverContent") or {}

    # Accumulate character speech chunks
    ot = sc.get("outputTranscription") or {}
    if ot.get("text"):
        if not state["char_buf_t"]:
            state["char_buf_t"] = _ts()
        state["char_buf"] += ot["text"]

    def _flush_char_buf() -> None:
        if state["char_buf"].strip():
            _append(events, {"type": "character", "text": state["char_buf"].strip()}, state["char_buf_t"])
        state["char_buf"] = ""
        state["char_buf_t"] = None

    # Barge-in: flush whatever was buffered, then log interruption
    if sc.get("interrupted"):
        _flush_char_buf()
        _append(events, {"type": "interrupted"})

    # Child speech (only log finished transcriptions to avoid partial duplicates)
    it = sc.get("inputTranscription") or {}
    if it.get("finished") and it.get("text"):
        _append(events, {"type": "child", "text": it["text"]})

    # Turn complete: flush character speech, then log boundary
    if sc.get("turnComplete"):
        _flush_char_buf()
        _append(events, {"type": "turn_complete"})


def _save_transcript(
    session_id: str,
    character_name: str,
    character_id: str,
    theme: str | None,
    transcript: list,
) -> None:
    try:
        TRANSCRIPTS_DIR.mkdir(exist_ok=True)
        ts = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        filename = TRANSCRIPTS_DIR / f"{ts}_{session_id}_{character_id}.json"
        payload = {
            "session_id": session_id,
            "character": character_name,
            "character_id": character_id,
            "theme": theme,
            "recorded_at": datetime.now(timezone.utc).isoformat(),
            "events": transcript,
        }
        filename.write_text(json.dumps(payload, ensure_ascii=False, indent=2))
        print(f"[transcript] Saved → {filename.name} ({len(transcript)} events)")
    except Exception as e:
        print(f"[transcript] Save failed: {e}")


async def proxy_browser_to_gemini(browser_ws: WebSocket, gemini_ws) -> None:
    """Forward all text messages from the browser to Gemini."""
    try:
        while True:
            data = await browser_ws.receive_text()
            await gemini_ws.send(data)
    except WebSocketDisconnect:
        print("[proxy] Browser disconnected (browser→gemini)")
    except Exception as e:
        print(f"[proxy] browser→gemini error: {e}")
    finally:
        try:
            await gemini_ws.close()
        except Exception:
            pass


async def proxy_gemini_to_browser(
    gemini_ws,
    browser_ws: WebSocket,
    state: dict,
) -> None:
    """Forward all messages from Gemini to the browser, tapping the transcript."""
    try:
        async for message in gemini_ws:
            try:
                data = json.loads(message)
                _tap_gemini_message(data, state)
                await browser_ws.send_text(json.dumps(data))

            except json.JSONDecodeError:
                # Binary frame — forward as bytes (rare with Gemini JSON protocol)
                if isinstance(message, bytes):
                    await browser_ws.send_bytes(message)
                else:
                    await browser_ws.send_text(message)
            except RuntimeError:
                # Browser WebSocket already closed — normal during teardown
                break
            except Exception as e:
                print(f"[proxy] gemini→browser send error: {e}")
                break

    except ConnectionClosed as e:
        print(f"[proxy] Gemini connection closed (gemini→browser): {e.code} - {e.reason}")
    except Exception as e:
        print(f"[proxy] gemini→browser loop error: {e}")



async def run_proxy_session(
    browser_ws: WebSocket,
    character_id: str,
    session_id: str,
    theme: str | None = None,
    prop_image: str | None = None,
    prop_description: str | None = None,
) -> None:
    """
    Establishes a Gemini Live API session for a character and proxies it to the browser.

    Protocol:
    1. Load character config
    2. Connect to Gemini Live API with auth
    3. Send character setup message (system prompt + voice)
    4. Wait for setup confirmation from Gemini
    5. Forward setup confirmation to browser
    6. Start bidirectional proxy
    """
    character = get_character(character_id)
    if not character:
        await browser_ws.send_text(json.dumps({
            "error": f"Unknown character: {character_id}"
        }))
        await browser_ws.close(code=1008, reason="Unknown character")
        return

    try:
        token = get_access_token()
    except Exception as e:
        print(f"[proxy] Auth failed: {e}")
        await browser_ws.close(code=1008, reason="Authentication failed")
        return

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}",
    }

    ssl_context = ssl.create_default_context(cafile=certifi.where())
    setup_message = build_gemini_setup_message(character, PROJECT_ID, LOCATION)
    state: dict = {"events": [], "char_buf": "", "char_buf_t": None}

    print(f"[proxy] Connecting to Gemini for character: {character.name}")

    try:
        async with websockets.connect(
            gemini_service_url(LOCATION),
            additional_headers=headers,
            ssl=ssl_context,
            ping_interval=None,  # Gemini Live manages its own keepalive; standard WS pings cause it to drop
        ) as gemini_ws:
            print("[proxy] Connected to Gemini Live API ✓")

            # Send character setup to Gemini
            await gemini_ws.send(json.dumps(setup_message))

            # Wait for Gemini setup confirmation
            setup_response = await asyncio.wait_for(gemini_ws.recv(), timeout=15.0)
            setup_data = json.loads(setup_response)

            if not setup_data.get("setupComplete"):
                print(f"[proxy] Unexpected setup response: {setup_data}")
                await browser_ws.close(code=1011, reason="Gemini setup failed")
                return

            # Forward setup confirmation to browser
            await browser_ws.send_text(json.dumps({
                "setupComplete": True,
                "characterName": character.name,
                "characterId": character.id,
            }))

            print(f"[proxy] Session ready for {character.name} (session: {session_id})")

            # Start bidirectional proxy
            browser_to_gemini = asyncio.create_task(
                proxy_browser_to_gemini(browser_ws, gemini_ws)
            )
            gemini_to_browser = asyncio.create_task(
                proxy_gemini_to_browser(gemini_ws, browser_ws, state)
            )

            # Yield one event-loop tick so both proxy tasks start and
            # gemini_to_browser is already awaiting messages before we
            # send Begin! — this ensures Gemini's audio response is
            # forwarded to the browser immediately as it arrives.
            await asyncio.sleep(0)

            begin_parts: list = []
            if theme in ("camera_prop", "sketch") and prop_image:
                char_intro = f"This is {prop_description}. " if prop_description else ""
                if theme == "camera_prop":
                    image_text = (
                        f"Begin! {char_intro}This is the hero of our story — the character the child brought. "
                        f"Start the story RIGHT NOW. Your very first sentence must name and introduce "
                        f"{'them' if not prop_description else prop_description} as the main character. "
                        "IMPORTANT: When you call generate_illustration, describe the character in their "
                        "story world — NEVER describe a child or a hand holding the object."
                    )
                else:
                    image_text = (
                        f"Begin! {char_intro}This is the hero of our story — the character the child drew. "
                        f"Start the story RIGHT NOW. Your very first sentence must name and introduce "
                        f"{'them' if not prop_description else prop_description} as the main character."
                    )
                begin_parts = [
                    {"inline_data": {"mime_type": "image/jpeg", "data": prop_image}},
                    {"text": image_text},
                ]
            elif theme:
                begin_parts = [{"text": (
                    f"Begin! Start your story RIGHT NOW. The theme is: {theme}. "
                    f"Your very first sentence must immediately introduce something about {theme}. "
                    f"Keep {theme} as the central focus throughout the whole story."
                )}]
            else:
                begin_parts = [{"text": "Begin!"}]

            _append(state["events"], {"type": "session_start", "character": character.name, "theme": theme})
            await gemini_ws.send(json.dumps({
                "client_content": {
                    "turns": [{"role": "user", "parts": begin_parts}],
                    "turn_complete": True,
                }
            }))
            print(f"[proxy] Sent Begin! to Gemini for session {session_id}")

            SESSION_TIMEOUT = 900  # 15 minutes
            done, pending = await asyncio.wait(
                [browser_to_gemini, gemini_to_browser],
                return_when=asyncio.FIRST_COMPLETED,
                timeout=SESSION_TIMEOUT,
            )

            if not done:
                print(f"[proxy] Session {session_id} timed out after 15 minutes")
                try:
                    await browser_ws.close(code=1001, reason="Session timeout")
                except Exception:
                    pass

            for task in pending:
                task.cancel()
                try:
                    await task
                except asyncio.CancelledError:
                    pass

    except asyncio.TimeoutError:
        print("[proxy] Timeout waiting for Gemini setup")
        await browser_ws.close(code=1008, reason="Gemini setup timeout")
    except ConnectionClosed as e:
        print(f"[proxy] Gemini connection closed: {e.code} - {e.reason}")
        try:
            await browser_ws.close(code=e.code, reason=e.reason)
        except Exception:
            pass
    except Exception as e:
        print(f"[proxy] Error: {e}")
        try:
            await browser_ws.close(code=1011, reason="Internal error")
        except Exception:
            pass
    finally:
        if state["events"]:
            _save_transcript(session_id, character.name, character.id, theme, state["events"])
