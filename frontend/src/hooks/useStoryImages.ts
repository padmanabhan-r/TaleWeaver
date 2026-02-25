import { useState, useCallback, useRef } from "react";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";
const MAX_SCENES = 8;

// Client-side pre-filter — English, Tamil, and Hindi visual scene keywords
const VISUAL_WORDS = [
  // English
  "castle", "dragon", "forest", "ocean", "mountain", "cave", "village",
  "sky", "garden", "suddenly", "appeared", "imagine", "picture", "there was",
  "stood", "glowed", "sparkled", "kingdom", "wizard", "fairy", "princess",
  "knight", "ship", "robot", "once upon",
  // Tamil (காடு=forest, மலை=mountain, கடல்=ocean, கோட்டை=castle,
  //         திடீரென்று=suddenly, வாழ்ந்தது=lived, தோன்றியது=appeared,
  //         கிராமம்=village, ஆகாயம்=sky, தோட்டம்=garden)
  "காடு", "மலை", "கடல்", "கோட்டை", "திடீரென்று", "வாழ்ந்தது",
  "தோன்றியது", "கிராமம்", "ஆகாயம்", "தோட்டம்", "ஒரு காட்டிலே",
  "ஒரு நாள்", "அரண்மனை", "இளவரசி", "மந்திரி",
  // Hindi (जंगल=forest, पहाड़=mountain, समुद्र=ocean, महल=castle,
  //        अचानक=suddenly, रहता था=lived, गाँव=village, आकाश=sky,
  //        बगीचा=garden, एक बार=once upon)
  "जंगल", "पहाड़", "समुद्र", "महल", "अचानक", "रहता था", "रहती थी",
  "गाँव", "आकाश", "बगीचा", "एक बार", "राजकुमारी", "राजकुमार", "जादू",
];

export interface StoryScene {
  id: string;
  status: "loading" | "loaded";
  imageData: string | null;
  mimeType: string | null;
  description: string;
}

export function useStoryImages(imageStyle: string, sessionId: string) {
  const [scenes, setScenes] = useState<StoryScene[]>([]);
  const sceneCountRef = useRef(0);
  const lastTriggerTimeRef = useRef(0);

  const triggerImageGeneration = useCallback(
    async (transcriptionText: string) => {
      // Cap at max scenes
      if (sceneCountRef.current >= MAX_SCENES) return;

      // Rate limit: no more than 1 image per 15 seconds
      const now = Date.now();
      if (now - lastTriggerTimeRef.current < 15_000) return;

      // Client-side visual keyword pre-filter
      const lower = transcriptionText.toLowerCase();
      const isVisual =
        VISUAL_WORDS.some((w) => transcriptionText.includes(w)) ||
        transcriptionText.split(" ").length >= 10;
      if (!isVisual) return;

      lastTriggerTimeRef.current = now;
      const sceneId = `scene-${++sceneCountRef.current}`;

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
            scene_description: transcriptionText.slice(0, 400),
            image_style: imageStyle,
            session_id: sessionId,
          }),
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();

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
