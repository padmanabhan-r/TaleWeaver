import { StoryScene } from "@/hooks/useStoryImages";

interface Props {
  scenes: StoryScene[];
}

export function StorySceneGrid({ scenes }: Props) {
  // Only work with fully loaded scenes that have image data
  const loaded = scenes.filter((s) => s.status === "loaded" && s.imageData);
  const isLoading = scenes.at(-1)?.status === "loading";

  const current = loaded.at(-1);
  const prev = loaded.length >= 2 ? loaded.at(-2) : null;

  return (
    <div className="relative w-full h-full">
      {/* No image yet — shimmer while first image loads */}
      {!current && isLoading && <SceneShimmer />}

      {/* Previous image stays underneath so there's never a blank canvas */}
      {prev?.imageData && (
        <img
          src={`data:${prev.mimeType};base64,${prev.imageData}`}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* Current image fades in on top — key change triggers the animation */}
      {current?.imageData && (
        <img
          key={current.id}
          src={`data:${current.mimeType};base64,${current.imageData}`}
          alt="Story scene"
          className="absolute inset-0 w-full h-full object-cover scene-fade-in"
        />
      )}

      {/* Subtle indicator while next image generates (current still visible) */}
      {isLoading && current && (
        <div className="absolute bottom-4 right-4 z-10 bg-white/90 rounded-full px-3 py-1.5 font-comic-neue text-xs text-purple-700 shadow-md flex items-center gap-1.5">
          <span className="animate-spin inline-block">✨</span>
          Drawing...
        </div>
      )}

      {/* Scene count badge */}
      {loaded.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-white/80 rounded-full px-3 py-1 font-bangers text-sm text-purple-800 shadow">
          Scene {loaded.length}
        </div>
      )}
    </div>
  );
}

function SceneShimmer() {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-purple-200 via-pink-100 to-purple-200 animate-shimmer overflow-hidden">
      <div className="absolute inset-0 shimmer-wave" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
        <span className="text-4xl">🎨</span>
        <span className="font-comic-neue text-purple-600 text-sm">Drawing...</span>
      </div>
    </div>
  );
}
