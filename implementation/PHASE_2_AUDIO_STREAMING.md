# Phase 2 — Audio Streaming (Bidirectional, Real-Time)

## Goal
Build the browser-side audio pipeline:
- **Capture**: Microphone → 16kHz PCM → WebSocket (to Gemini via proxy)
- **Playback**: WebSocket → 24kHz PCM → Speaker (Gemini's voice)
- **Interruption**: Immediately clear audio buffer when Gemini says `interrupted: true`
- **State awareness**: Track whether we're capturing, playing, or both simultaneously

This is the heart of the "seamless conversation" experience.

---

## Audio Architecture

```
MICROPHONE
    │
    ▼
[MediaStream 16kHz]
    │
    ▼
[AudioContext @ 16kHz]
    │
    ▼
[AudioWorklet: capture.worklet.js]
    │  Float32 → Int16 PCM conversion
    ▼
[Base64 encode]
    │
    ▼
[WebSocket → Backend → Gemini]
    │
    │                    [Gemini Live API]
    │                         │
    ▼                         │ 24kHz PCM audio chunks
[WebSocket ← Backend ← Gemini]
    │
    ▼
[Base64 decode]
    │
    ▼
[AudioContext @ 24kHz]
    │
    ▼
[AudioWorklet: playback.worklet.js]
    │  Queue-based PCM buffering
    ▼
[Speaker]
```

---

## AudioWorklet Files (Public Assets)

These go in `frontend/public/audio-processors/` so they're served as static files
(AudioWorklet `addModule()` requires a URL, not a module import).

### `capture.worklet.js`

```javascript
// frontend/public/audio-processors/capture.worklet.js
// Runs in the AudioWorklet thread.
// Converts Float32 microphone samples to Int16 PCM and posts to main thread.

class AudioCaptureProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super(options);
    this._buffer = [];
    this._bufferSize = options.processorOptions?.bufferSize ?? 2048;
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0]) return true;

    const channelData = input[0]; // Mono channel

    // Accumulate samples
    for (let i = 0; i < channelData.length; i++) {
      this._buffer.push(channelData[i]);
    }

    // Send when buffer is full
    while (this._buffer.length >= this._bufferSize) {
      const chunk = this._buffer.splice(0, this._bufferSize);
      const pcm16 = this._float32ToInt16(new Float32Array(chunk));
      this.port.postMessage({ type: "audio", data: pcm16 }, [pcm16.buffer]);
    }

    return true; // Keep processor alive
  }

  _float32ToInt16(float32Array) {
    const int16 = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const clamped = Math.max(-1, Math.min(1, float32Array[i]));
      int16[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
    }
    return int16;
  }
}

registerProcessor("audio-capture-processor", AudioCaptureProcessor);
```

### `playback.worklet.js`

```javascript
// frontend/public/audio-processors/playback.worklet.js
// Runs in the AudioWorklet thread.
// Buffers incoming Int16 PCM chunks and plays them out as Float32.

const BUFFER_MAX_SAMPLES = 48000 * 10; // 10 seconds max buffer

class AudioPlaybackProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._queue = [];          // Array of Float32Array chunks
    this._totalSamples = 0;
    this._isPlaying = false;

    this.port.onmessage = (event) => {
      if (event.data.type === "audio") {
        this._enqueue(event.data.data);
      } else if (event.data.type === "clear") {
        this._clear();
      }
    };
  }

  _enqueue(int16Array) {
    // Convert Int16 PCM to Float32
    const float32 = new Float32Array(int16Array.length);
    for (let i = 0; i < int16Array.length; i++) {
      float32[i] = int16Array[i] / (int16Array[i] < 0 ? 0x8000 : 0x7fff);
    }

    if (this._totalSamples < BUFFER_MAX_SAMPLES) {
      this._queue.push(float32);
      this._totalSamples += float32.length;
      this._isPlaying = true;
    }
  }

  _clear() {
    this._queue = [];
    this._totalSamples = 0;
    this._isPlaying = false;
    this.port.postMessage({ type: "cleared" });
  }

  process(inputs, outputs) {
    const output = outputs[0][0]; // Mono output channel
    const outputLength = output.length;

    if (!this._isPlaying || this._queue.length === 0) {
      output.fill(0); // Silence
      return true;
    }

    let outputOffset = 0;

    while (outputOffset < outputLength && this._queue.length > 0) {
      const chunk = this._queue[0];
      const chunkRemaining = chunk.length - (this._chunkOffset || 0);
      const toCopy = Math.min(chunkRemaining, outputLength - outputOffset);

      output.set(
        chunk.subarray(this._chunkOffset || 0, (this._chunkOffset || 0) + toCopy),
        outputOffset
      );

      outputOffset += toCopy;
      this._chunkOffset = (this._chunkOffset || 0) + toCopy;

      if (this._chunkOffset >= chunk.length) {
        this._queue.shift();
        this._totalSamples -= chunk.length;
        this._chunkOffset = 0;
      }
    }

    // Fill remainder with silence if buffer ran out
    if (outputOffset < outputLength) {
      output.fill(0, outputOffset);
      this._isPlaying = this._queue.length > 0;
    }

    return true;
  }
}

registerProcessor("audio-playback-processor", AudioPlaybackProcessor);
```

---

## React Hooks

### `useAudioCapture.js`

```javascript
// frontend/src/hooks/useAudioCapture.js
import { useRef, useCallback, useState } from "react";

/**
 * Captures microphone audio at 16kHz and sends PCM chunks via WebSocket.
 *
 * Usage:
 *   const { startCapture, stopCapture, isCapturing } = useAudioCapture(wsRef);
 */
export function useAudioCapture(wsRef) {
  const [isCapturing, setIsCapturing] = useState(false);
  const audioContextRef = useRef(null);
  const workletNodeRef = useRef(null);
  const streamRef = useRef(null);

  const startCapture = useCallback(async () => {
    if (isCapturing) return;

    try {
      // Request microphone at 16kHz (Gemini Live API input requirement)
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      // Audio context at 16kHz
      const audioContext = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = audioContext;

      // Load the capture worklet
      await audioContext.audioWorklet.addModule(
        "/audio-processors/capture.worklet.js"
      );

      const workletNode = new AudioWorkletNode(
        audioContext,
        "audio-capture-processor",
        { processorOptions: { bufferSize: 1024 } }
      );
      workletNodeRef.current = workletNode;

      // Handle PCM chunks from worklet
      workletNode.port.onmessage = (event) => {
        if (event.data.type !== "audio") return;
        const ws = wsRef.current;
        if (!ws || ws.readyState !== WebSocket.OPEN) return;

        const int16Array = event.data.data;
        const base64 = arrayBufferToBase64(int16Array.buffer);

        ws.send(JSON.stringify({
          realtime_input: {
            media_chunks: [{
              mime_type: "audio/pcm;rate=16000",
              data: base64,
            }],
          },
        }));
      };

      // Connect: mic → worklet
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(workletNode);

      setIsCapturing(true);
      console.log("[audio-capture] Started ✓");
    } catch (err) {
      console.error("[audio-capture] Failed to start:", err);
      throw err;
    }
  }, [isCapturing, wsRef]);

  const stopCapture = useCallback(() => {
    if (!isCapturing) return;

    // Stop microphone tracks
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;

    // Disconnect worklet
    workletNodeRef.current?.disconnect();
    workletNodeRef.current = null;

    // Close audio context
    audioContextRef.current?.close();
    audioContextRef.current = null;

    setIsCapturing(false);
    console.log("[audio-capture] Stopped");
  }, [isCapturing]);

  return { startCapture, stopCapture, isCapturing };
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}
```

### `useAudioPlayback.js`

```javascript
// frontend/src/hooks/useAudioPlayback.js
import { useRef, useCallback, useState } from "react";

/**
 * Plays 24kHz PCM audio received from Gemini Live API.
 *
 * Usage:
 *   const { initPlayback, playChunk, clearBuffer, isPlaying } = useAudioPlayback();
 *   // Call initPlayback() after user gesture (required by browser audio policy)
 *   // Call playChunk(base64String) for each audio chunk received
 *   // Call clearBuffer() when interrupted signal received
 */
export function useAudioPlayback() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef(null);
  const workletNodeRef = useRef(null);
  const initializedRef = useRef(false);

  const initPlayback = useCallback(async () => {
    if (initializedRef.current) return;

    // 24kHz AudioContext — Gemini Live API output sample rate
    const audioContext = new AudioContext({ sampleRate: 24000 });
    audioContextRef.current = audioContext;

    await audioContext.audioWorklet.addModule(
      "/audio-processors/playback.worklet.js"
    );

    const workletNode = new AudioWorkletNode(audioContext, "audio-playback-processor");
    workletNodeRef.current = workletNode;

    // Listen for "cleared" confirmation from worklet
    workletNode.port.onmessage = (event) => {
      if (event.data.type === "cleared") {
        setIsPlaying(false);
      }
    };

    workletNode.connect(audioContext.destination);
    initializedRef.current = true;
    console.log("[audio-playback] Initialized ✓");
  }, []);

  const playChunk = useCallback((base64AudioData) => {
    const worklet = workletNodeRef.current;
    if (!worklet) return;

    const audioContext = audioContextRef.current;
    if (audioContext?.state === "suspended") {
      audioContext.resume();
    }

    // Decode base64 → Int16Array
    const binaryString = atob(base64AudioData);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const int16 = new Int16Array(bytes.buffer);

    // Send to playback worklet (transfer ownership for performance)
    worklet.port.postMessage({ type: "audio", data: int16 }, [int16.buffer]);
    setIsPlaying(true);
  }, []);

  const clearBuffer = useCallback(() => {
    const worklet = workletNodeRef.current;
    if (!worklet) return;

    // Immediately clear the playback queue (stops mid-sentence)
    worklet.port.postMessage({ type: "clear" });
    setIsPlaying(false);
    console.log("[audio-playback] Buffer cleared (interrupted)");
  }, []);

  return { initPlayback, playChunk, clearBuffer, isPlaying };
}
```

### `useLiveAPI.js` — Main Hook (Orchestrates Everything)

```javascript
// frontend/src/hooks/useLiveAPI.js
import { useRef, useState, useCallback, useEffect } from "react";
import { useAudioCapture } from "./useAudioCapture";
import { useAudioPlayback } from "./useAudioPlayback";

const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8080/ws/story";

/**
 * Central hook that manages:
 * - WebSocket connection to backend
 * - Audio capture and playback
 * - Session state machine
 * - Interruption handling
 * - Output transcription (for image generation triggers)
 *
 * States: idle → connecting → ready → active → done
 */
export function useLiveAPI({ character, onImageTrigger, onTranscription }) {
  const wsRef = useRef(null);
  const [sessionState, setSessionState] = useState("idle");
  // idle | connecting | ready | active | error | ended

  const { startCapture, stopCapture, isCapturing } = useAudioCapture(wsRef);
  const { initPlayback, playChunk, clearBuffer, isPlaying } = useAudioPlayback();

  // Track character speaking state for avatar animation
  const [characterState, setCharacterState] = useState("idle");
  // idle | speaking | listening | thinking

  const connect = useCallback(async () => {
    if (sessionState !== "idle") return;
    setSessionState("connecting");

    try {
      // Initialize audio playback (requires user gesture — call from click handler)
      await initPlayback();

      // Open WebSocket to backend proxy
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("[live-api] WebSocket connected");
        // Send character selection as first message
        ws.send(JSON.stringify({ character_id: character.id }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleServerMessage(data);
        } catch (e) {
          console.error("[live-api] Parse error:", e);
        }
      };

      ws.onerror = (err) => {
        console.error("[live-api] WebSocket error:", err);
        setSessionState("error");
        setCharacterState("idle");
      };

      ws.onclose = (event) => {
        console.log("[live-api] WebSocket closed:", event.code, event.reason);
        stopCapture();
        setSessionState("ended");
        setCharacterState("idle");
      };

    } catch (err) {
      console.error("[live-api] Connection failed:", err);
      setSessionState("error");
    }
  }, [character, sessionState, initPlayback]);

  const handleServerMessage = useCallback((data) => {
    // Setup confirmation from backend
    if (data.setupComplete) {
      console.log(`[live-api] Session ready for ${data.characterName}`);
      setSessionState("ready");
      setCharacterState("thinking");

      // Start capturing microphone audio
      startCapture().then(() => {
        setSessionState("active");
        setCharacterState("idle");
      }).catch((err) => {
        console.error("[live-api] Failed to start capture:", err);
        setSessionState("error");
      });
      return;
    }

    // Error from backend
    if (data.error) {
      console.error("[live-api] Session error:", data.error);
      setSessionState("error");
      return;
    }

    const serverContent = data.serverContent;
    if (!serverContent) return;

    // INTERRUPTION — child spoke while character was speaking
    if (serverContent.interrupted) {
      console.log("[live-api] Interrupted — clearing audio buffer");
      clearBuffer();
      setCharacterState("listening");
      return;
    }

    // INPUT TRANSCRIPTION — what the child said (shown as subtitle or logged)
    if (serverContent.inputTranscription?.text) {
      const { text, finished } = serverContent.inputTranscription;
      if (finished && onTranscription) {
        onTranscription({ type: "child", text });
      }
    }

    // OUTPUT TRANSCRIPTION — what the character said
    if (serverContent.outputTranscription?.text) {
      const { text, finished } = serverContent.outputTranscription;
      if (finished) {
        if (onTranscription) {
          onTranscription({ type: "character", text });
        }
        // Trigger image generation from the character's words
        if (onImageTrigger) {
          onImageTrigger(text);
        }
      }
    }

    // AUDIO PARTS — character speaking audio
    if (serverContent.modelTurn?.parts) {
      for (const part of serverContent.modelTurn.parts) {
        if (part.inlineData?.data) {
          playChunk(part.inlineData.data);
          setCharacterState("speaking");
        }
      }
    }

    // TURN COMPLETE — character finished speaking
    if (serverContent.turnComplete) {
      setCharacterState("listening");
    }
  }, [clearBuffer, playChunk, startCapture, onImageTrigger, onTranscription]);

  const disconnect = useCallback(() => {
    stopCapture();
    wsRef.current?.close(1000, "User ended session");
    setSessionState("idle");
    setCharacterState("idle");
  }, [stopCapture]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCapture();
      wsRef.current?.close();
    };
  }, []);

  return {
    connect,
    disconnect,
    sessionState,
    characterState,
    isCapturing,
    isPlaying,
  };
}
```

---

## Connection Flow Diagram

```
User taps character card
    ↓
StoryScreen mounts
    ↓
User taps "Begin Story" button (required for audio permission + AudioContext gesture)
    ↓
useLiveAPI.connect() called
    ├─ initPlayback() → AudioContext @ 24kHz created
    ├─ WebSocket opens to /ws/story
    └─ Sends: { character_id: "grandma-rose" }
        ↓
Backend receives, loads character config, connects to Gemini Live API
    ↓
Gemini Live API setup complete
    ↓
Backend sends: { setupComplete: true, characterName: "Grandma Rose" }
    ↓
Frontend: startCapture() → AudioWorklet @ 16kHz
    ↓
Gemini opens conversation with character greeting
    ↓
24kHz PCM audio arrives → clearBuffer not needed → playChunk() → speaker
    ↓
Character avatar enters "speaking" state
    ↓
Child speaks (mic was already open)
    ↓
Gemini detects speech (VAD) → Gemini processes
    ↓
If character was speaking: serverContent.interrupted = true
    ├─ clearBuffer() → audio stops immediately
    └─ setCharacterState("listening")
        ↓
Gemini processes child's speech
    ↓
Character responds with new audio
    ↓
Loop continues...
```

---

## Microphone Permission UX

The browser requires a user gesture before accessing the mic. Our flow:

1. Character selection → no mic access needed
2. StoryScreen loads → shows a large friendly "Begin Story" button
3. User taps/clicks → this gesture allows us to:
   - `getUserMedia()` (microphone)
   - `new AudioContext()` (audio playback)
   - `WebSocket` connection established
4. After tap, button fades out, character appears, session starts

```jsx
// In StoryScreen.jsx
const [begun, setBegan] = useState(false);

if (!begun) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <CharacterAvatar characterId={character.avatar} state="wave" size={200} />
      <h2 className="font-bangers text-4xl mt-6 mb-4">
        {character.name} is ready!
      </h2>
      <button
        className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bangers
                   text-3xl px-10 py-4 rounded-full shadow-lg transform
                   hover:scale-105 transition-all"
        onClick={() => {
          setBegan(true);
          connect();
        }}
      >
        Begin the Story!
      </button>
    </div>
  );
}
```

---

## Audio State Machine

```
characterState:
  "idle"      → no audio activity, character at rest
  "thinking"  → connecting / processing (spinner animation)
  "speaking"  → character's audio playing (mouth animation)
  "listening" → waiting for child to speak (ear animation, subtle glow)

Transitions:
  idle → thinking     : connect() called
  thinking → speaking : first audio chunk from Gemini
  speaking → listening: turnComplete received
  speaking → listening: interrupted received + clearBuffer()
  listening → speaking: child spoke, Gemini responds with audio
  any → idle          : disconnect() called
```

---

## Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---|---|---|---|---|
| AudioWorklet | ✓ | ✓ | ✓ 14.1+ | ✓ |
| getUserMedia | ✓ | ✓ | ✓ | ✓ |
| WebSocket | ✓ | ✓ | ✓ | ✓ |
| AudioContext 16kHz | ✓ | ✓ | ✓ | ✓ |

**Note:** Safari on iOS requires the "Begin Story" button tap to unlock AudioContext.
This is handled by our gesture-gated connect flow.

---

## Definition of Done

- [ ] `capture.worklet.js` converts Float32 → Int16 PCM correctly at 16kHz
- [ ] `playback.worklet.js` plays Int16 PCM at 24kHz without distortion or gaps
- [ ] `useAudioCapture` starts mic, sends base64 PCM chunks over WebSocket
- [ ] `useAudioPlayback` plays incoming audio chunks sequentially
- [ ] `clearBuffer()` stops playback immediately (within 50ms)
- [ ] `useLiveAPI` handles all server message types
- [ ] Character state transitions work: idle → thinking → speaking → listening
- [ ] Interruption handled: audio clears, character enters listening state
- [ ] Works on Chrome, Firefox, Safari (iOS + desktop)
- [ ] No audio glitches or gaps during continuous 5-minute story session
- [ ] Mic permission request handled gracefully (denied state shown)
