# TaleWeaver — Hard-Won Lessons & Challenges

A living document of real problems hit during development and how they were resolved.
Add to this whenever something takes more than one attempt to fix.

---

## 1. Audio Garbling After ~7–10 Seconds

**Symptom:** Story plays fine for the first 7–10 seconds, then audio becomes garbled and sounds like fast-forward.

**Root cause:** Gemini Live API streams audio **much faster than real-time** (a 30-second monologue may arrive in 5 seconds). The playback AudioWorklet drained at exactly real-time speed (24 kHz), so the internal queue grew continuously until it hit the buffer cap, then chunks were silently dropped, producing garbled/skipping audio.

A secondary bug: `BUFFER_MAX_SAMPLES = 48000 * 10` was wrong — the AudioContext runs at 24 kHz, so this was actually a 20-second cap, not 10. Chunks piled up silently for twice as long before being dropped.

**Fix:** Replaced the AudioWorklet queue entirely with `AudioBufferSourceNode` scheduling. Each incoming chunk is scheduled to start exactly when the previous one ends using `audioContext.currentTime`. No queue, no overflow cap. Gemini can stream 30 seconds ahead and it just gets scheduled into the future. Barge-in clears all scheduled sources instantly via `.stop()`.

**File:** `frontend/src/hooks/useLiveAPI.ts` — `useAudioPlayback()`

---

## 2. WebSocket Connection Dropping at ~30 Seconds

**Symptom:** Session consistently dies around 30 seconds. Backend logs: `keepalive ping timeout; no close frame received` (code 1006).

**Root cause:** The `websockets` library was configured with `ping_interval=20, ping_timeout=10`. It sends a standard WebSocket ping frame to Gemini every 20 seconds. Gemini Live API does not respond to WebSocket-level ping frames — it uses its own keepalive mechanism. After 10 seconds without a pong, the library killed the connection.

**Fix:** Set `ping_interval=None` on the `websockets.connect()` call to disable automatic pings entirely.

**File:** `backend/proxy.py`

---

## 3. Model Not Starting the Story on Its Own

**Symptom:** Session connects, mic starts, but the model says nothing. User has to make a sound to trigger the first response.

**Root cause:** The "Begin!" kick-off message had been moved from the backend to the frontend. The frontend sent it after mic capture started, but this was racing with Gemini's VAD — the arriving mic audio was being interpreted as user speech and interrupting Gemini's response before it could start. Additionally, `proactive_audio: True` alone is not reliable enough to guarantee the model starts unprompted.

**Fix:** Moved "Begin!" back to the backend proxy. It is sent **directly to Gemini** (via `gemini_ws.send`) after setup confirmation but **before** the bidirectional proxy tasks start. This guarantees Gemini gets the kick-off before any mic audio can reach it.

**File:** `backend/proxy.py` — `run_proxy_session()`

---

## 4. proactive_audio Breaks All "Wait for Child" Mechanics

**Symptom:** Model asks a question or issues a challenge, then immediately answers/continues itself without waiting for the child.

**Root cause:** `proactive_audio: True` instructs Gemini to speak proactively after silence. After 2–3 seconds of the child not responding, Gemini treats that as an opportunity to continue. System prompt instructions like "wait 25 seconds" are not reliably followed by the native audio model.

**What doesn't work:**
- Telling the model to "PAUSE and wait" — proactive_audio overrides this
- Increasing `silence_duration_ms` — controls end-of-speech detection, not proactive turn timing
- Telling the model to "wait for the child to say I did it" — still ignored

**What works:** Design the experience to work *with* proactive_audio, not against it:
- The model should never fully stop and wait for a response
- End each story beat with an anticipatory phrase ("And just then...", "But suddenly...") so the generation gap between turns feels like dramatic suspense
- If the child speaks at any point, barge-in fires and the model reacts — this always works reliably
- Remove any mechanic that requires the model to hold silence

**Files:** `backend/characters.py` — system prompt

---

## 5. Story Feels Discontinuous / "Starts Over" Mid-Session

**Symptom:** After a pause or challenge, the model resumes with what sounds like a fresh story opening rather than continuing where it left off.

**Root cause (audio):** `clearBuffer()` was being called on `awardBadge` tool calls. This stopped all scheduled audio mid-sentence, resetting the playback schedule. When the model continued, the abrupt audio gap made the continuation feel like a new start.

**Root cause (model):** The native audio model with proactive_audio can generate fresh-sounding narrative openers when resuming after silence, especially if context was broken by an interrupt or tool call.

**Fix:**
- Removed `clearBuffer()` from the `awardBadge` handler — badge is visual only, no need to cut audio
- Added explicit system prompt instruction: "NEVER restart the story mid-session. Every sentence must follow naturally from what came before — same characters, same world, same journey."

**Files:** `frontend/src/hooks/useLiveAPI.ts`, `backend/characters.py`

---

## 6. AudioContext Starts Suspended, First Chunks Not Playing

**Symptom:** Story audio doesn't play for the first 1–2 seconds after the model starts speaking.

**Root cause:** `new AudioContext()` can start in `suspended` state. The `playChunk` function called `audioContext.resume()` without awaiting it, then immediately scheduled audio on the still-suspended context. With `AudioBufferSourceNode`, sources scheduled while the context is suspended may be skipped or pile up.

**Fix:** Added `await audioContext.resume()` inside `initPlayback()` before connecting any nodes, ensuring the context is running before any audio arrives.

**File:** `frontend/src/hooks/useLiveAPI.ts` — `initPlayback()`

---

## 7. Camera Feature Breaks Story Flow

**Symptom:** Turning on the camera caused the model to stop telling the story and acknowledge the camera ("I see you!"), breaking narrative continuity.

**Root cause:** The camera toggle sent a `client_content` message to Gemini notifying it of the camera. This triggered a response, interrupting the story mid-flow. `proactive_audio` then made it difficult to resume naturally.

**Decision:** Removed the camera feature entirely from the storytelling screen. It was over-engineering for the core use case (children aged 4–10 listening to a story). May revisit with a more seamless integration approach in future.

**Files:** `frontend/src/hooks/useLiveAPI.ts` (removed `useCameraStream`), `frontend/src/screens/StoryScreen.tsx`

---

## 8. Participation Challenges Don't Work with Native Audio Model

**Symptom:** Model asks child to clap/roar/freeze, child does the action, model ignores it and continues anyway.

**Root cause:** With `start_of_speech_sensitivity: START_SENSITIVITY_LOW`, quiet or non-verbal child actions (clapping, movements) don't cross the VAD threshold and aren't detected as speech. The model can't hear them. Combined with `proactive_audio: True`, the model continues after silence regardless.

**Decision:** Removed the challenge mechanic entirely. Badges are now only awarded for spontaneous creative contributions from the child (verbal ideas, imaginative suggestions). The interaction model is simpler: model tells the story, child can redirect by speaking at any time.

**Files:** `backend/characters.py` — system prompt

---

## 9. Inconsistent Pauses — Sometimes Waits, Sometimes Continues

**Symptom:** The model pauses unpredictably between story beats. Sometimes it waits as if expecting a child response, sometimes it continues immediately. The pauses feel unintelligent and break immersion.

**Root cause:** This is a fundamental limitation of how Gemini Live API's `proactive_audio` works. The model decides when to speak proactively based on VAD + its own internal timing — both are non-deterministic. Two things compound the problem:
1. The model generates short turns (1–2 sentences), creating frequent gaps between turns
2. Ambient mic noise can trigger VAD unpredictably — if noise is detected quickly, the gap is short; if not, the model waits the full `silence_duration_ms` (2000ms max) before the next proactive turn

**Attempted workarounds that don't work:**
- System prompt "PAUSE and wait" instructions — `proactive_audio` overrides them
- Increasing `silence_duration_ms` beyond 2000ms — Gemini rejects it (hard cap of 2000ms)
- Ending beats with anticipatory phrases ("And just then...") — model recaps context at the start of the next turn, making repetition worse
- Asking steering questions — model answers its own questions immediately without waiting

**Best mitigation found:** Tell the model to speak in long, sustained flows (5–7 sentences per turn). Fewer turn breaks = fewer gaps = less perceived inconsistency. System prompt: "Speak like an audiobook narrator — keep the momentum going."

**Deeper truth:** Gemini Live is a **conversation API**, not a narration API. Its turn-taking model is designed for back-and-forth dialogue. Using it for one-sided continuous storytelling means working against its grain. The inconsistent pauses are a product of that architectural mismatch and cannot be fully eliminated without a different approach (e.g. pre-generating story audio with a TTS model and using Gemini Live only for interruption/redirection handling).

**Files:** `backend/characters.py` — system prompt

---

## 10. Story Repeats Itself Mid-Session

**Symptom:** The model retells the same plot beats in different words — 10–20 seconds of story followed by the same beats paraphrased. Also happens at the very start of the session (same opening told twice).

**Root cause (beginning):** A frontend "safety re-send" was added to fix characters not starting: after `startCapture()` resolved, if `receivedAudioRef.current` was `false`, the frontend would send another `"Begin!"`. The check was racy — Gemini's audio was already in-flight but hadn't been processed by `ws.onmessage` yet, so the flag was still `false`. Gemini received a second `"Begin!"` mid-opening and retold it in different words.

**Root cause (mid-session):** Gemini Live native audio has limited within-session narrative tracking across many turns, especially after tool-call pauses (`generate_illustration` interrupts narration; when Gemini resumes it can recycle earlier story territory). The system prompt's single "NEVER repeat" sentence was not strong enough.

**Fix:**
- Removed the frontend begin-turn re-send entirely. The backend already sends `"Begin!"` before the proxy starts — that is the reliable path. The AudioContext resume (challenge 6) is the fix for characters not starting.
- Strengthened anti-repetition in the system prompt: per-sentence self-check ("Have I already described this moment?"), explicit ban on rephrasing in different words, rule to resume *exactly* where narration left off after any pause or tool-call, prohibition on resumption phrases ("As I was saying…", "Remember how…").

**Files:** `frontend/src/hooks/useLiveAPI.ts`, `backend/characters.py`

---

## 11. Inappropriate Child Input Not Called Out Immediately

**Symptom:** When the child says something violent, rude, or otherwise inappropriate, the model silently ignores it (continues the story as if nothing happened) or addresses it only after narrating a few more sentences.

**Root cause:** The content-rules section told the model to "gently redirect" but gave no timing instruction. The native audio model treated it as background guidance, not an interruption trigger.

**Fix:** Added explicit timing instruction: if the child says anything inappropriate, the model must stop immediately and call it out as its *very first response* — before any story continuation. Added example phrasing ("Oh! I can't tell stories about that — that's not for little ears!") and an explicit rule against silently skipping past bad input.

**Files:** `backend/characters.py` — system prompt
