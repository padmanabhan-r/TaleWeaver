# backend/proxy.py
"""Bidirectional WebSocket proxy between browser and Gemini Live API."""

import asyncio
import json
import os
import ssl
import certifi
import google.auth
from google.auth.transport.requests import Request
from fastapi import WebSocket, WebSocketDisconnect
from websockets.exceptions import ConnectionClosed
import websockets

from characters import build_gemini_setup_message, get_character, gemini_service_url

PROJECT_ID = os.environ["GOOGLE_CLOUD_PROJECT"]
LOCATION = os.environ.get("GOOGLE_CLOUD_LOCATION", "us-central1")


def get_access_token() -> str:
    """Get a fresh GCP access token using application default credentials."""
    creds, _ = google.auth.default(
        scopes=["https://www.googleapis.com/auth/cloud-platform"]
    )
    if not creds.valid:
        creds.refresh(Request())
    return creds.token


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
) -> None:
    """Forward all messages from Gemini to the browser."""
    try:
        async for message in gemini_ws:
            try:
                data = json.loads(message)
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
                proxy_gemini_to_browser(gemini_ws, browser_ws)
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
