import { useState, useEffect } from "react";
import { StoryScene } from "@/hooks/useStoryImages";

interface Props {
  scenes: StoryScene[];
}

export function StorySceneGrid({ scenes }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-advance to the latest scene when a new one arrives
  useEffect(() => {
    if (scenes.length > 0) {
      setCurrentIndex(scenes.length - 1);
    }
  }, [scenes.length]);

  if (scenes.length === 0) return null;

  const scene = scenes[currentIndex];
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < scenes.length - 1;

  return (
    <div className="relative w-full h-full">
      {/* Full-panel scene display */}
      <div className="w-full h-full rounded-2xl overflow-hidden bg-purple-100">
        {scene.status === "loading" ? (
          <SceneShimmer />
        ) : scene.imageData ? (
          <img
            key={scene.id}
            src={`data:${scene.mimeType};base64,${scene.imageData}`}
            alt={`Story scene ${currentIndex + 1}`}
            className="w-full h-full object-cover scene-pop-in"
          />
        ) : null}
      </div>

      {/* Left arrow — browse back */}
      {hasPrev && (
        <button
          onClick={() => setCurrentIndex((i) => i - 1)}
          className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg text-purple-700 font-bold transition-all hover:scale-110"
          aria-label="Previous scene"
        >
          ←
        </button>
      )}

      {/* Right arrow — shown when browsing history, returns to latest */}
      {hasNext && (
        <button
          onClick={() => setCurrentIndex((i) => i + 1)}
          className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg text-purple-700 font-bold transition-all hover:scale-110"
          aria-label="Next scene"
        >
          →
        </button>
      )}

      {/* Scene counter */}
      {scenes.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white/80 rounded-full px-3 py-1 font-bangers text-sm text-purple-800 shadow">
          {currentIndex + 1} / {scenes.length}
        </div>
      )}
    </div>
  );
}

function SceneShimmer() {
  return (
    <div className="w-full h-full bg-gradient-to-br from-purple-200 via-pink-100 to-purple-200 animate-shimmer relative overflow-hidden">
      <div className="absolute inset-0 shimmer-wave" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
        <span className="text-4xl">🎨</span>
        <span className="font-comic-neue text-purple-600 text-sm">Drawing...</span>
      </div>
    </div>
  );
}
