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
  propImage?: string;     // raw base64 JPEG, no data: prefix
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

function useAudioPlayback() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const initializedRef = useRef(false);

  const initPlayback = useCallback(async () => {
    if (initializedRef.current) return;

    const audioContext = new AudioContext({ sampleRate: 24000 });
    audioContextRef.current = audioContext;

    await audioContext.audioWorklet.addModule("/audio-processors/playback.worklet.js");

    const workletNode = new AudioWorkletNode(audioContext, "audio-playback-processor");
    workletNodeRef.current = workletNode;

    workletNode.port.onmessage = (event) => {
      if (event.data.type === "cleared") setIsPlaying(false);
    };

    const gainNode = audioContext.createGain();
    gainNodeRef.current = gainNode;

    workletNode.connect(gainNode);
    gainNode.connect(audioContext.destination);
    initializedRef.current = true;
    console.log("[audio-playback] Initialized ✓");
  }, []);

  const playChunk = useCallback((base64AudioData: string) => {
    const worklet = workletNodeRef.current;
    if (!worklet) return;

    const audioContext = audioContextRef.current;
    if (audioContext?.state === "suspended") audioContext.resume();

    const binaryString = atob(base64AudioData);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const int16 = new Int16Array(bytes.buffer);
    worklet.port.postMessage({ type: "audio", data: int16 }, [int16.buffer]);
    setIsPlaying(true);
  }, []);

  const clearBuffer = useCallback(() => {
    workletNodeRef.current?.port.postMessage({ type: "clear" });
    setIsPlaying(false);
    console.log("[audio-playback] Buffer cleared (interrupted)");
  }, []);

  return { initPlayback, playChunk, clearBuffer, isPlaying, playbackCtxRef: audioContextRef, playbackGainRef: gainNodeRef };
}

// ── Camera stream ────────────────────────────────────────────────────────────

function useCameraStream(wsRef: React.RefObject<WebSocket | null>) {
  const [enabled, setEnabled] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<number | null>(null);

  // Once enabled=true the video element mounts — attach the stream
  useEffect(() => {
    if (enabled && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [enabled]);

  const toggle = useCallback(async () => {
    if (enabled) {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
      setEnabled(false);
      console.log("[camera-stream] Stopped");
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
        streamRef.current = stream;
        const canvas = document.createElement("canvas");
        intervalRef.current = window.setInterval(() => {
          const video = videoRef.current;
          const ws = wsRef.current;
          if (!video || !ws || ws.readyState !== WebSocket.OPEN || video.videoWidth === 0) return;
          const MAX = 512;
          const scale = Math.min(1, MAX / Math.max(video.videoWidth, video.videoHeight));
          canvas.width = Math.round(video.videoWidth * scale);
          canvas.height = Math.round(video.videoHeight * scale);
          canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
          const base64 = canvas.toDataURL("image/jpeg", 0.6).split(",")[1];
          if (!base64) return;
          ws.send(JSON.stringify({ realtime_input: { media_chunks: [{ mime_type: "image/jpeg", data: base64 }] } }));
        }, 1000);
        setEnabled(true); // triggers useEffect to set srcObject after video mounts
        console.log("[camera-stream] Started ✓");
      } catch (err) {
        console.error("[camera-stream] getUserMedia failed:", err);
      }
    }
  }, [enabled, wsRef]);

  const stop = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setEnabled(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
  }, []);

  return { enabled, toggle, stop, videoRef };
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

export function useLiveAPI({ character, theme, propImage, onImageTrigger, onGenerateIllustration, onTranscription, onBadgeAwarded, onChildSpoke }: UseLiveAPIOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const [sessionState, setSessionState] = useState<SessionState>("idle");
  const [characterState, setCharacterState] = useState<CharacterState>("idle");
  // Accumulates character speech across transcription chunks (finished flag unreliable in native audio)
  const outputTextAccRef = useRef("");
  const { startCapture, stopCapture, isCapturing, captureCtxRef, captureSourceRef } = useAudioCapture(wsRef);
  const { initPlayback, playChunk, clearBuffer, isPlaying, playbackCtxRef, playbackGainRef } = useAudioPlayback();
  const { enabled: cameraEnabled, toggle: toggleCamera, stop: stopCamera, videoRef: cameraVideoRef } = useCameraStream(wsRef);

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
                onBadgeAwardedRef.current?.(call.args as BadgeAward);
                // Respond immediately so Gemini can continue narrating
                ws.send(JSON.stringify({
                  toolResponse: {
                    functionResponses: [{ id: call.id, response: { output: "Badge awarded!" } }],
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
        setSessionState("ended");
        setCharacterState("idle");
      };

    } catch (err) {
      console.error("[live-api] Connection failed:", err);
      setSessionState("error");
    }
  }, [character.id, sessionState, initPlayback, stopCapture]);

  const disconnect = useCallback(() => {
    stopCapture();
    stopCamera();
    clearBuffer();
    wsRef.current?.close(1000, "User ended session");
    wsRef.current = null;
    setSessionState("idle");
    setCharacterState("idle");
  }, [stopCapture, stopCamera, clearBuffer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCapture();
      wsRef.current?.close();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    connect, disconnect, sessionState, characterState, isCapturing, isPlaying,
    captureCtxRef, captureSourceRef, playbackCtxRef, playbackGainRef,
    cameraEnabled, toggleCamera, cameraVideoRef,
  };
}
