import { useRef, useState, useCallback, useEffect } from "react";
import { Character } from "@/characters";

const WS_URL = import.meta.env.VITE_WS_URL ??
  `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}/ws/story`;

export type SessionState = "idle" | "connecting" | "ready" | "active" | "error" | "ended";
export type CharacterState = "idle" | "thinking" | "speaking" | "listening";

interface Transcription {
  type: "child" | "character";
  text: string;
}

export interface BadgeAward {
  emoji: string;
  name: string;
  reason: string;
}

interface UseLiveAPIOptions {
  character: Character;
  theme?: string;
  propImage?: string;       // raw base64 JPEG, no data: prefix
  propDescription?: string; // human-readable label, e.g. "a friendly blue dragon"
  onImageTrigger?: ((text: string) => void) | null;
  onGenerateIllustration?: ((description: string) => void) | null;
  onTranscription?: ((msg: Transcription) => void) | null;
  onBadgeAwarded?: ((badge: BadgeAward) => void) | null;
  onChildSpoke?: (() => void) | null;
}

// ── Audio capture ────────────────────────────────────────────────────────────

function useAudioCapture(wsRef: React.RefObject<WebSocket | null>) {
  const [isCapturing, setIsCapturing] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  const startCapture = useCallback(async () => {
    if (isCapturing) return;

    // Do NOT specify sampleRate in getUserMedia — browsers (especially macOS) often
    // ignore it or produce malformed audio when it conflicts with the native rate.
    // AudioContext({ sampleRate: 16000 }) handles the resampling reliably instead.
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
    streamRef.current = stream;

    const audioContext = new AudioContext({ sampleRate: 16000 });
    audioContextRef.current = audioContext;

    await audioContext.audioWorklet.addModule("/audio-processors/capture.worklet.js");

    const workletNode = new AudioWorkletNode(audioContext, "audio-capture-processor", {
      processorOptions: { bufferSize: 1024 },
    });
    workletNodeRef.current = workletNode;

    workletNode.port.onmessage = (event) => {
      if (event.data.type !== "audio") return;
      const ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN) return;

      const int16Array: Int16Array = event.data.data;
      const base64 = arrayBufferToBase64(int16Array.buffer);

      ws.send(JSON.stringify({
        realtime_input: {
          media_chunks: [{ mime_type: "audio/pcm;rate=16000", data: base64 }],
        },
      }));
    };

    const source = audioContext.createMediaStreamSource(stream);
    sourceRef.current = source;
    source.connect(workletNode);

    setIsCapturing(true);
    console.log("[audio-capture] Started ✓");
  }, [isCapturing, wsRef]);

  const stopCapture = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    workletNodeRef.current?.disconnect();
    workletNodeRef.current = null;
    sourceRef.current = null;
    audioContextRef.current?.close();
    audioContextRef.current = null;
    setIsCapturing(false);
    console.log("[audio-capture] Stopped");
  }, []);

  return { startCapture, stopCapture, isCapturing, captureCtxRef: audioContextRef, captureSourceRef: sourceRef };
}

// ── Audio playback ───────────────────────────────────────────────────────────
// Uses AudioBufferSourceNode scheduling instead of a worklet queue.
// Each chunk is scheduled to start exactly when the previous one ends,
// so there is no queue to overflow regardless of how fast Gemini streams.

function useAudioPlayback() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const initializedRef = useRef(false);

  const initPlayback = useCallback(async () => {
    if (initializedRef.current) return;

    const audioContext = new AudioContext({ sampleRate: 24000 });
    audioContextRef.current = audioContext;

    // Ensure context is running — browsers may start it suspended
    if (audioContext.state === "suspended") await audioContext.resume();

    const gainNode = audioContext.createGain();
    gainNodeRef.current = gainNode;
    gainNode.connect(audioContext.destination);

    initializedRef.current = true;
    console.log("[audio-playback] Initialized ✓", audioContext.state);
  }, []);

  const playChunk = useCallback((base64AudioData: string) => {
    const audioContext = audioContextRef.current;
    const gainNode = gainNodeRef.current;
    if (!audioContext || !gainNode) return;

    // Safari may auto-suspend an AudioContext that hasn't played audio recently.
    // Schedule the chunk to play immediately after resuming instead of dropping it.
    if (audioContext.state === "suspended") {
      audioContext.resume().then(() => playChunkRef.current(base64AudioData)).catch(console.warn);
      return;
    }

    // Decode base64 → PCM16 LE → Float32
    const binaryString = atob(base64AudioData);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    const int16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) float32[i] = int16[i] / 32768;

    // Create an AudioBuffer and schedule it to play immediately after the previous chunk
    const audioBuffer = audioContext.createBuffer(1, float32.length, 24000);
    audioBuffer.getChannelData(0).set(float32);

    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(gainNode);

    const now = audioContext.currentTime;
    const startTime = Math.max(now, nextStartTimeRef.current);
    source.start(startTime);
    nextStartTimeRef.current = startTime + audioBuffer.duration;

    sourcesRef.current.push(source);
    source.onended = () => {
      const idx = sourcesRef.current.indexOf(source);
      if (idx >= 0) sourcesRef.current.splice(idx, 1);
      if (sourcesRef.current.length === 0) setIsPlaying(false);
    };

    setIsPlaying(true);
  }, []);

  const clearBuffer = useCallback(() => {
    sourcesRef.current.forEach(s => { try { s.stop(); } catch { /* already ended */ } });
    sourcesRef.current = [];
    nextStartTimeRef.current = 0;
    setIsPlaying(false);
    console.log("[audio-playback] Buffer cleared (interrupted)");
  }, []);

  return { initPlayback, playChunk, clearBuffer, isPlaying, playbackCtxRef: audioContextRef, playbackGainRef: gainNodeRef };
}

// ── Helper ───────────────────────────────────────────────────────────────────

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// ── Main hook ────────────────────────────────────────────────────────────────

export function useLiveAPI({ character, theme, propImage, propDescription, onImageTrigger, onGenerateIllustration, onTranscription, onBadgeAwarded, onChildSpoke }: UseLiveAPIOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const [sessionState, setSessionState] = useState<SessionState>("idle");
  const [characterState, setCharacterState] = useState<CharacterState>("idle");
  const [isPaused, setIsPaused] = useState(false);
  // True only when the user explicitly clicks "End Story" — prevents unexpected drops from
  // showing "See our story!" as if the session ended intentionally.
  const userEndedRef = useRef(false);
  // Accumulates character speech across transcription chunks (finished flag unreliable in native audio)
  const outputTextAccRef = useRef("");
  const { startCapture, stopCapture, isCapturing, captureCtxRef, captureSourceRef } = useAudioCapture(wsRef);
  const { initPlayback, playChunk, clearBuffer, isPlaying, playbackCtxRef, playbackGainRef } = useAudioPlayback();

  // Keep latest callbacks in refs so the WS onmessage closure never goes stale
  const playChunkRef = useRef(playChunk);
  const clearBufferRef = useRef(clearBuffer);
  const startCaptureRef = useRef(startCapture);


  const onImageTriggerRef = useRef(onImageTrigger);
  const onGenerateIllustrationRef = useRef(onGenerateIllustration);
  const onTranscriptionRef = useRef(onTranscription);
  const onBadgeAwardedRef = useRef(onBadgeAwarded);
  const onChildSpokeRef = useRef(onChildSpoke);
  useEffect(() => { playChunkRef.current = playChunk; }, [playChunk]);
  useEffect(() => { clearBufferRef.current = clearBuffer; }, [clearBuffer]);
  useEffect(() => { startCaptureRef.current = startCapture; }, [startCapture]);


  useEffect(() => { onImageTriggerRef.current = onImageTrigger; }, [onImageTrigger]);
  useEffect(() => { onGenerateIllustrationRef.current = onGenerateIllustration; }, [onGenerateIllustration]);
  useEffect(() => { onTranscriptionRef.current = onTranscription; }, [onTranscription]);
  useEffect(() => { onBadgeAwardedRef.current = onBadgeAwarded; }, [onBadgeAwarded]);
  useEffect(() => { onChildSpokeRef.current = onChildSpoke; }, [onChildSpoke]);

  const connect = useCallback(async () => {
    if (sessionState !== "idle") return;
    userEndedRef.current = false;
    setSessionState("connecting");

    try {
      await initPlayback();

      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("[live-api] WebSocket connected");
        ws.send(JSON.stringify({
          character_id: character.id,
          theme: theme ?? null,
          prop_image: propImage ?? null,
          prop_description: propDescription ?? null,
        }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // Setup confirmation from backend
          if (data.setupComplete) {
            console.log(`[live-api] Session ready for ${data.characterName}`);
            setSessionState("ready");
            setCharacterState("thinking");

            // Resume playback AudioContext NOW — Gemini will start sending audio
            // almost immediately after setupComplete (the "Begin!" trigger happens
            // on the backend before the proxy starts). On Safari, AudioContext
            // auto-suspends ~1 s after creation if nothing has played, so we must
            // resume it before audio chunks arrive, not after mic starts.
            const playbackCtx = playbackCtxRef.current;
            if (playbackCtx && playbackCtx.state === "suspended") {
              playbackCtx.resume().catch(console.warn);
              console.log("[live-api] Playback AudioContext resumed at setupComplete");
            }

            startCaptureRef.current().then(() => {
              setSessionState("active");
              setCharacterState("idle");
            }).catch((err) => {
              console.error("[live-api] Mic capture failed:", err);
              setSessionState("error");
            });
            return;
          }

          if (data.error) {
            console.error("[live-api] Backend error:", data.error);
            setSessionState("error");
            return;
          }

          // Tool calls: handle each by name
          if (data.toolCall?.functionCalls) {
            for (const call of data.toolCall.functionCalls) {
              if (call.name === "generate_illustration") {
                // Respond immediately — don't block Gemini's narration while image generates
                ws.send(JSON.stringify({
                  toolResponse: {
                    functionResponses: [{ id: call.id, response: { output: "Illustration generated." } }],
                  },
                }));
                const description = (call.args?.scene_description as string) ?? "";
                onGenerateIllustrationRef.current?.(description);
              } else if (call.name === "awardBadge") {
                // Don't clear the buffer — the model is mid-story and audio should continue.
                // The badge is visual only; the system prompt tells the model not to announce it.
                onBadgeAwardedRef.current?.(call.args as BadgeAward);
                ws.send(JSON.stringify({
                  toolResponse: {
                    functionResponses: [{ id: call.id, response: { output: "Badge shown on screen. Continue the story immediately — do not mention the badge again." } }],
                  },
                }));
              }
            }
            return;
          }

          const sc = data.serverContent;
          if (!sc) return;

          // Barge-in: child interrupted the character
          if (sc.interrupted) {
            outputTextAccRef.current = "";
            clearBufferRef.current();
            setCharacterState("listening");
            onChildSpokeRef.current?.();
            return;
          }

          // What the child said
          if (sc.inputTranscription?.finished && sc.inputTranscription?.text) {
            onTranscriptionRef.current?.({ type: "child", text: sc.inputTranscription.text });
            onChildSpokeRef.current?.();
          }

          // Accumulate character speech transcription chunks
          if (sc.outputTranscription?.text) {
            outputTextAccRef.current += sc.outputTranscription.text;
          }

          // Audio chunks from the character
          if (sc.modelTurn?.parts) {
            for (const part of sc.modelTurn.parts) {
              if (part.inlineData?.data) {
                playChunkRef.current(part.inlineData.data);
                setCharacterState("speaking");
              }
            }
          }

          // Character finished speaking — trigger image with the full turn text
          if (sc.turnComplete) {
            const accText = outputTextAccRef.current.trim();
            if (accText) {
              onTranscriptionRef.current?.({ type: "character", text: accText });
              onImageTriggerRef.current?.(accText);
              outputTextAccRef.current = "";
            }
            setCharacterState("listening");
          }

        } catch (e) {
          console.error("[live-api] Message parse error:", e);
        }
      };

      ws.onerror = () => {
        console.error("[live-api] WebSocket error");
        setSessionState("error");
        setCharacterState("idle");
      };

      ws.onclose = (event) => {
        console.log("[live-api] WebSocket closed:", event.code, event.reason);
        stopCapture();
        // Only transition to "ended" (shows "See our story!") if the user clicked End Story.
        // Unexpected drops (Gemini timeout, network) go to "error" so the child can restart.
        setSessionState(userEndedRef.current ? "ended" : "error");
        setCharacterState("idle");
      };

    } catch (err) {
      console.error("[live-api] Connection failed:", err);
      setSessionState("error");
    }
  }, [character.id, sessionState, initPlayback, stopCapture]);

  const notifyActionDone = useCallback(() => {
    const ws = wsRef.current;
    if (ws?.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({
      client_content: {
        turns: [{ role: "user", parts: [{ text: "I did it! Did you see me?" }] }],
        turn_complete: true,
      },
    }));
  }, []);

  const togglePause = useCallback(() => {
    const gain = playbackGainRef.current;
    const captureCtx = captureCtxRef.current;
    if (isPaused) {
      // Resume — unmute playback and restart mic AudioContext
      if (gain) gain.gain.value = 1;
      captureCtx?.resume();
      setIsPaused(false);
    } else {
      // Pause — silence playback and suspend mic AudioContext (stops worklet processing)
      if (gain) gain.gain.value = 0;
      captureCtx?.suspend();
      setIsPaused(true);
    }
  }, [isPaused, playbackGainRef, captureCtxRef]);

  const disconnect = useCallback(() => {
    userEndedRef.current = true;
    setIsPaused(false);
    // Restore gain in case we were paused
    if (playbackGainRef.current) playbackGainRef.current.gain.value = 1;
    stopCapture();
    clearBuffer();
    wsRef.current?.close(1000, "User ended session");
    wsRef.current = null;
    setCharacterState("idle");
  }, [stopCapture, clearBuffer, playbackGainRef]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCapture();
      wsRef.current?.close();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    connect, disconnect, togglePause, isPaused, sessionState, characterState, isCapturing, isPlaying,
    captureCtxRef, captureSourceRef, playbackCtxRef, playbackGainRef,
  };
}
