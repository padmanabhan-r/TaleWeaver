import { useState, useCallback, useRef, useEffect } from "react";

const API_BASE = import.meta.env.VITE_API_URL ?? "";
const MAX_SCENES = Infinity;

export interface StoryScene {
  id: string;
  status: "loading" | "loaded";
  imageData: string | null;
  mimeType: string | null;
  description: string;
}

// Minimum wait before generating subsequent images (not the first)
const SUBSEQUENT_DELAY_MS = 3_000;
// If a tool call fired an image within this window, the turn-complete fallback stays silent.
// This prevents double-firing when Gemini is actively using generate_illustration.
const TOOL_CALL_GRACE_MS = 25_000;

export function useStoryImages(imageStyle: string, sessionId: string, intervalSeconds: number = 10) {
  const [scenes, setScenes] = useState<StoryScene[]>([]);
  const sceneCountRef = useRef(0);
  const lastTriggerTimeRef = useRef(0);
  const sessionStartTimeRef = useRef(Date.now());
  // Rolling story context — last ~2000 chars of character speech across all turns
  const storyContextRef = useRef("");
  // Last successfully generated image + its scene description for context-aware continuity
  const lastImageRef = useRef<{ data: string; mimeType: string; sceneDescription: string } | null>(null);
  // Tracks the last time Gemini fired generate_illustration — fallback defers to this
  const lastToolCallTimeRef = useRef(0);
  // Keep interval in a ref so changes take effect immediately without recreating callbacks
  const intervalMsRef = useRef(intervalSeconds * 1000);
  useEffect(() => { intervalMsRef.current = intervalSeconds * 1000; }, [intervalSeconds]);
  // Stop flag + abort controller — set by stop(), prevents new triggers and cancels in-flight fetch
  const stoppedRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const stop = useCallback(() => {
    stoppedRef.current = true;
    abortControllerRef.current?.abort();
  }, []);

  const triggerImageGeneration = useCallback(
    async (transcriptionText: string) => {
      if (stoppedRef.current) return;
      // Append this turn to the rolling context (keep last ~2000 chars)
      storyContextRef.current = (storyContextRef.current + " " + transcriptionText).slice(-2000).trim();
      // Cap at max scenes
      if (sceneCountRef.current >= MAX_SCENES) return;

      const now = Date.now();
      const isFirst = sceneCountRef.current === 0;

      // First image: fire as soon as the first turn completes, with only a small buffer
      // to ensure there's enough story text to describe a meaningful scene.
      if (isFirst) {
        if (now - sessionStartTimeRef.current < SUBSEQUENT_DELAY_MS) return;
      } else {
        // If Gemini used the tool recently, trust it — don't double-fire
        if (now - lastToolCallTimeRef.current < TOOL_CALL_GRACE_MS) return;
        // Enforce the user-controlled interval between fallback images
        if (now - lastTriggerTimeRef.current < intervalMsRef.current) return;
      }

      lastTriggerTimeRef.current = now;
      const sceneId = `scene-${++sceneCountRef.current}`;
      const prevImage = lastImageRef.current;

      // Optimistically add a loading card
      setScenes((prev) => [
        ...prev,
        {
          id: sceneId,
          status: "loading",
          imageData: null,
          mimeType: null,
          description: transcriptionText.slice(0, 100),
        },
      ]);

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        const response = await fetch(`${API_BASE}/api/image`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: abortController.signal,
          body: JSON.stringify({
            scene_description: transcriptionText.slice(0, 2000),
            story_context: storyContextRef.current,
            image_style: imageStyle,
            session_id: sessionId,
            previous_image_data: prevImage?.data ?? "",
            previous_image_mime_type: prevImage?.mimeType ?? "image/png",
            previous_scene_description: prevImage?.sceneDescription ?? "",
          }),
        });

        if (stoppedRef.current) return;

        if (response.status === 429) {
          // Vertex AI rate-limited — silently discard, reset timer so next turn can retry
          setScenes((prev) => prev.filter((s) => s.id !== sceneId));
          sceneCountRef.current--;
          lastTriggerTimeRef.current = 0;
          return;
        }

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();

        if (stoppedRef.current) return;

        lastImageRef.current = { data: data.image_data, mimeType: data.mime_type, sceneDescription: data.scene_description };
        setScenes((prev) =>
          prev.map((scene) =>
            scene.id === sceneId
              ? {
                  ...scene,
                  status: "loaded",
                  imageData: data.image_data,
                  mimeType: data.mime_type,
                }
              : scene
          )
        );
      } catch (err) {
        if ((err as Error).name === "AbortError") return; // session ended — discard silently
        console.error("[story-images] Generation failed:", err);
        // Silently remove the failed loading card
        setScenes((prev) => prev.filter((s) => s.id !== sceneId));
        sceneCountRef.current--;
      }
    },
    [imageStyle, sessionId]
  );

  // Called when Gemini explicitly triggers an illustration via tool call.
  // Bypasses the rate limit and session delay — Gemini already chose the right moment.
  const forceImageGeneration = useCallback(
    async (sceneDescription: string) => {
      if (stoppedRef.current) return;
      if (sceneCountRef.current >= MAX_SCENES) return;

      storyContextRef.current = (storyContextRef.current + " " + sceneDescription).slice(-2000).trim();
      // Mark that the tool call path just fired — fallback will stay silent for TOOL_CALL_GRACE_MS
      const now = Date.now();
      lastToolCallTimeRef.current = now;
      lastTriggerTimeRef.current = now;

      const sceneId = `scene-${++sceneCountRef.current}`;
      const prevImage = lastImageRef.current;

      setScenes((prev) => [
        ...prev,
        { id: sceneId, status: "loading", imageData: null, mimeType: null, description: sceneDescription.slice(0, 100) },
      ]);

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        const response = await fetch(`${API_BASE}/api/image`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: abortController.signal,
          body: JSON.stringify({
            scene_description: sceneDescription.slice(0, 2000),
            story_context: storyContextRef.current,
            image_style: imageStyle,
            session_id: sessionId,
            skip_extraction: true,
            previous_image_data: prevImage?.data ?? "",
            previous_image_mime_type: prevImage?.mimeType ?? "image/png",
            previous_scene_description: prevImage?.sceneDescription ?? "",
          }),
        });

        if (stoppedRef.current) return;

        if (!response.ok) {
          setScenes((prev) => prev.filter((s) => s.id !== sceneId));
          sceneCountRef.current--;
          lastTriggerTimeRef.current = 0; // reset so next turn can retry
          return;
        }

        const data = await response.json();
        if (stoppedRef.current) return;

        lastImageRef.current = { data: data.image_data, mimeType: data.mime_type, sceneDescription: data.scene_description };
        setScenes((prev) =>
          prev.map((scene) =>
            scene.id === sceneId
              ? { ...scene, status: "loaded", imageData: data.image_data, mimeType: data.mime_type }
              : scene
          )
        );
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        console.error("[story-images] Force generation failed:", err);
        setScenes((prev) => prev.filter((s) => s.id !== sceneId));
        sceneCountRef.current--;
        lastTriggerTimeRef.current = 0; // reset so next turn can retry
      }
    },
    [imageStyle, sessionId]
  );

  return { scenes, triggerImageGeneration, forceImageGeneration, stop };
}
