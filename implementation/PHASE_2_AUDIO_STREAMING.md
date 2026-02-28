# Phase 2 — Audio Streaming (Bidirectional, Real-Time)

## Status: ✅ DONE

---

## What Was Built

### Capture Pipeline (`frontend/public/audio-processors/capture.worklet.js`)
- AudioWorklet processor: `audio-capture-processor`
- Runs in dedicated audio thread at 16kHz (AudioContext forced to 16000 Hz)
- Accumulates samples into 1024-sample chunks, converts Float32 → Int16 PCM
- Posts `{ type: "audio", data: Int16Array }` to main thread

### Playback Pipeline (`frontend/public/audio-processors/playback.worklet.js`)
- AudioWorklet processor: `audio-playback-processor`
- AudioContext at 24kHz (matches Gemini Live output rate)
- Maintains a FIFO queue of Int16 PCM chunks
- Converts Int16 → Float32 on each `process()` call
- Handles `{ type: "clear" }` message for barge-in: drains queue instantly, posts `{ type: "cleared" }` back

### `useLiveAPI` Hook (`frontend/src/hooks/useLiveAPI.ts`)
- Manages full session state machine: `idle → connecting → ready → active → ended/error`
- Character state: `idle | thinking | speaking | listening`

**Capture (`useAudioCapture`):**
- `getUserMedia` with `echoCancellation`, `noiseSuppression`, `autoGainControl`
- `AudioContext({ sampleRate: 16000 })` handles resampling regardless of native device rate
- Mic chunks sent over WebSocket as `realtime_input.media_chunks` base64-encoded PCM

**Playback (`useAudioPlayback`):**
- Initialized on connect (before mic starts)
- `playChunk(base64)` → decodes → posts Int16Array to worklet via transferable buffer
- `clearBuffer()` → `{ type: "clear" }` message → worklet drains queue (barge-in)
- GainNode in chain for future volume control

**Session orchestration:**
- `connect()`: init playback → open WebSocket → send `{ character_id }` → await `setupComplete` → start mic capture
- `onmessage` handler:
  - `setupComplete` → `sessionState = "ready"`, start mic capture → `sessionState = "active"`
  - `sc.interrupted` → clear playback buffer, `characterState = "listening"`, reset accumulator
  - `sc.modelTurn.parts[].inlineData.data` → `playChunk()`, `characterState = "speaking"`
  - `sc.outputTranscription.text` → accumulate in `outputTextAccRef`
  - `sc.turnComplete` → fire image trigger with full accumulated text, `characterState = "listening"`
  - `sc.inputTranscription.finished` → fire `onTranscription` callback for child's speech
- All callbacks kept in refs to avoid stale closures in the WS `onmessage` handler

**Barge-in:**
- Gemini VAD detects child speech mid-story
- Gemini sends `interrupted: true` → frontend clears audio buffer instantly
- Child's audio continues streaming in real time
- Gemini weaves child's words into the story response

---

## Key Design Decisions

**Why separate AudioContexts for capture (16kHz) and playback (24kHz)?**
Browsers only allow one sample rate per AudioContext. Gemini requires 16kHz input and outputs 24kHz. Two separate AudioContexts avoid resampling artifacts.

**Why no `sampleRate` in `getUserMedia`?**
macOS (and many browsers) ignore or mishandle the constraint, producing malformed audio. Specifying `sampleRate: 16000` in `AudioContext` lets the browser resample natively and reliably.

**Why transferable buffers for playback?**
`postMessage` with `[int16.buffer]` as the transfer list zero-copies the buffer to the worklet thread. Essential for smooth real-time audio — avoids GC pressure from copying large PCM arrays.

---

## Differences from Original Plan

| Original Plan | What Was Built |
|---|---|
| `MediaRecorder` API considered | AudioWorklet only — MediaRecorder can't produce raw PCM at 16kHz |
| ScriptProcessor fallback mentioned | AudioWorklet only — ScriptProcessor is deprecated |
| Volume slider UI | GainNode in playback chain (wired up but no UI yet) |
