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

// Wait this long after session start before generating the first image
const SESSION_START_DELAY_MS = 8_000;

export function useStoryImages(imageStyle: string, sessionId: string, intervalSeconds: number = 10) {
  const [scenes, setScenes] = useState<StoryScene[]>([]);
  const sceneCountRef = useRef(0);
  const lastTriggerTimeRef = useRef(0);
  const sessionStartTimeRef = useRef(Date.now());
  // Rolling story context — last ~2000 chars of character speech across all turns
  const storyContextRef = useRef("");
  // Last successfully generated image + its scene description for context-aware continuity
  const lastImageRef = useRef<{ data: string; mimeType: string; sceneDescription: string } | null>(null);
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

      // Wait for story to establish before generating first image
      const now = Date.now();
      if (now - sessionStartTimeRef.current < SESSION_START_DELAY_MS) return;

      // Rate limit — controlled by intervalMsRef
      if (now - lastTriggerTimeRef.current < intervalMsRef.current) return;

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

  // Pre-seed the canvas with the pre-generated opening image before the session starts.
  const seedInitialImage = useCallback(
    (image: { data: string; mimeType: string; sceneDescription: string }) => {
      if (stoppedRef.current) return;
      lastImageRef.current = image;
      lastTriggerTimeRef.current = Date.now(); // prevent the fallback from firing immediately
      const sceneId = `scene-${++sceneCountRef.current}`;
      setScenes([{
        id: sceneId,
        status: "loaded",
        imageData: image.data,
        mimeType: image.mimeType,
        description: image.sceneDescription.slice(0, 100),
      }]);
    },
    []
  );

  // Called when Gemini explicitly triggers an illustration via tool call.
  // Bypasses the rate limit and session delay — Gemini already chose the right moment.
  const forceImageGeneration = useCallback(
    async (sceneDescription: string) => {
      if (stoppedRef.current) return;
      if (sceneCountRef.current >= MAX_SCENES) return;

      storyContextRef.current = (storyContextRef.current + " " + sceneDescription).slice(-2000).trim();
      // Update timer so the fallback doesn't fire immediately after a tool-triggered image
      lastTriggerTimeRef.current = Date.now();

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

        if (response.status === 429) {
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
              ? { ...scene, status: "loaded", imageData: data.image_data, mimeType: data.mime_type }
              : scene
          )
        );
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        console.error("[story-images] Force generation failed:", err);
        setScenes((prev) => prev.filter((s) => s.id !== sceneId));
        sceneCountRef.current--;
      }
    },
    [imageStyle, sessionId]
  );

  return { scenes, triggerImageGeneration, forceImageGeneration, seedInitialImage, stop };
}
