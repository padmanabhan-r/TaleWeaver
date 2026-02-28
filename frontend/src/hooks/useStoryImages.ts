import { useState, useCallback, useRef } from "react";

const API_BASE = import.meta.env.VITE_API_URL ?? "";
const MAX_SCENES = 8;

export interface StoryScene {
  id: string;
  status: "loading" | "loaded";
  imageData: string | null;
  mimeType: string | null;
  description: string;
}

// Wait this long after session start before generating the first image
const SESSION_START_DELAY_MS = 8_000;

export function useStoryImages(imageStyle: string, sessionId: string) {
  const [scenes, setScenes] = useState<StoryScene[]>([]);
  const sceneCountRef = useRef(0);
  const lastTriggerTimeRef = useRef(0);
  const sessionStartTimeRef = useRef(Date.now());
  // Rolling story context — last ~2000 chars of character speech across all turns
  const storyContextRef = useRef("");
  // Last successfully generated image for visual continuity
  const lastImageRef = useRef<{ data: string; mimeType: string } | null>(null);

  const triggerImageGeneration = useCallback(
    async (transcriptionText: string) => {
      // Append this turn to the rolling context (keep last ~2000 chars)
      storyContextRef.current = (storyContextRef.current + " " + transcriptionText).slice(-2000).trim();
      // Cap at max scenes
      if (sceneCountRef.current >= MAX_SCENES) return;

      // Wait for story to establish before generating first image
      const now = Date.now();
      if (now - sessionStartTimeRef.current < SESSION_START_DELAY_MS) return;

      // Rate limit: 1 image per 10 seconds
      if (now - lastTriggerTimeRef.current < 10_000) return;

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

      try {
        const response = await fetch(`${API_BASE}/api/image`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scene_description: transcriptionText.slice(0, 2000),
            story_context: storyContextRef.current,
            image_style: imageStyle,
            session_id: sessionId,
            previous_image_data: prevImage?.data ?? "",
            previous_image_mime_type: prevImage?.mimeType ?? "image/png",
          }),
        });

        if (response.status === 429) {
          // Vertex AI rate-limited — silently discard, reset timer so next turn can retry
          setScenes((prev) => prev.filter((s) => s.id !== sceneId));
          sceneCountRef.current--;
          lastTriggerTimeRef.current = 0;
          return;
        }

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();

        lastImageRef.current = { data: data.image_data, mimeType: data.mime_type };
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
        console.error("[story-images] Generation failed:", err);
        // Silently remove the failed loading card
        setScenes((prev) => prev.filter((s) => s.id !== sceneId));
        sceneCountRef.current--;
      }
    },
    [imageStyle, sessionId]
  );

  return { scenes, triggerImageGeneration };
}
