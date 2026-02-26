import { useEffect, useRef } from "react";
import { StoryScene } from "@/hooks/useStoryImages";

interface Props {
  scene: StoryScene;
  index: number;
  isLatest: boolean;
}

export function StorySceneCard({ scene, index, isLatest }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);

  // Auto-scroll the latest scene into view when it becomes the newest
  useEffect(() => {
    if (isLatest && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [isLatest]);

  return (
    <div
      ref={cardRef}
      className={`
        relative rounded-2xl overflow-hidden border-4 border-white
        shadow-xl aspect-[4/3] bg-purple-100
        ${scene.status === "loaded" ? "scene-pop-in" : ""}
        ${isLatest && scene.status === "loaded" ? "ring-4 ring-yellow-400" : ""}
      `}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {scene.status === "loading" ? (
        <SceneShimmer />
      ) : scene.imageData ? (
        <img
          src={`data:${scene.mimeType};base64,${scene.imageData}`}
          alt={`Story scene ${index + 1}`}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : null}

      {/* Scene number badge */}
      <div className="absolute top-2 left-2 bg-white/80 rounded-full w-7 h-7 flex items-center justify-center font-bangers text-sm text-purple-800 shadow">
        {index + 1}
      </div>
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
