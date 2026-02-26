import { useState, useCallback, useRef } from "react";

const API_BASE = import.meta.env.VITE_API_URL ?? "";
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
  // Telugu (అడవి=forest, పర్వతం=mountain, సముద్రం=ocean, రాజ్యం=kingdom,
  //          అకస్మాత్తుగా=suddenly, గ్రామం=village, ఆకాశం=sky, తోట=garden)
  "అడవి", "పర్వతం", "సముద్రం", "రాజ్యం", "అకస్మాత్తుగా", "గ్రామం",
  "ఆకాశం", "తోట", "రాకుమారి", "మాంత్రికుడు", "ఒకసారి",
  // Marathi (जंगल=forest, डोंगर=mountain, समुद्र=ocean, राज्य=kingdom,
  //           अचानक=suddenly, गाव=village, आकाश=sky, बाग=garden)
  "जंगल", "डोंगर", "समुद्र", "राज्य", "अचानक", "गाव", "आकाश", "बाग",
  "राजकन्या", "जादूगार", "एकदा",
  // Bengali (জঙ্গল=forest, পাহাড়=mountain, সমুদ্র=ocean, রাজ্য=kingdom,
  //          হঠাৎ=suddenly, গ্রাম=village, আকাশ=sky, বাগান=garden)
  "জঙ্গল", "পাহাড়", "সমুদ্র", "রাজ্য", "হঠাৎ", "গ্রাম", "আকাশ", "বাগান",
  "রাজকন্যা", "জাদুকর", "একদিন",
];

export interface StoryScene {
  id: string;
  status: "loading" | "loaded";
  imageData: string | null;
  mimeType: string | null;
  description: string;
}

// Wait this long after session start before generating the first image
const SESSION_START_DELAY_MS = 20_000;

export function useStoryImages(imageStyle: string, sessionId: string) {
  const [scenes, setScenes] = useState<StoryScene[]>([]);
  const sceneCountRef = useRef(0);
  const lastTriggerTimeRef = useRef(0);
  const sessionStartTimeRef = useRef(Date.now());
  // Rolling story context — last ~600 chars of character speech across all turns
  const storyContextRef = useRef("");

  const triggerImageGeneration = useCallback(
    async (transcriptionText: string) => {
      // Append this turn to the rolling context (keep last ~2000 chars)
      storyContextRef.current = (storyContextRef.current + " " + transcriptionText).slice(-2000).trim();
      // Cap at max scenes
      if (sceneCountRef.current >= MAX_SCENES) return;

      // Wait for story to establish before generating first image
      const now = Date.now();
      if (now - sessionStartTimeRef.current < SESSION_START_DELAY_MS) return;

      // Rate limit: 1 image per 30 seconds
      if (now - lastTriggerTimeRef.current < 30_000) return;

      // Client-side visual keyword pre-filter — require actual visual content keywords
      const isVisual = VISUAL_WORDS.some((w) => transcriptionText.includes(w));
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
            scene_description: transcriptionText.slice(0, 2000),
            story_context: storyContextRef.current,
            image_style: imageStyle,
            session_id: sessionId,
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
