import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Character } from "@/characters";
import { StoryScene } from "@/hooks/useStoryImages";

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "";

interface BadgeSummary { emoji: string; name: string; reason: string; }

interface Props {
  character: Character;
  scenes: StoryScene[];
  badges?: BadgeSummary[];
  onClose: () => void;
  onRecapGenerated?: (title: string, narrations: string[]) => void;
}

export default function StoryRecapModal({ character, scenes, badges = [], onClose, onRecapGenerated }: Props) {
  const [title, setTitle] = useState("");
  const [narrations, setNarrations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadedScenes = scenes.filter((s) => s.status === "loaded" && s.imageData);

  useEffect(() => {
    if (loadedScenes.length === 0) {
      setError("No story scenes to recap yet!");
      setLoading(false);
      return;
    }

    const sceneData = loadedScenes.map((s) => ({
      image_data: s.imageData!,
      mime_type: s.mimeType ?? "image/png",
      description: s.description,
    }));

    fetch(`${API_BASE}/api/story-recap`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        character_name: character.name,
        image_style: character.imageStyle,
        scenes: sceneData,
        narrations: sceneData.map((s) => s.description).filter(Boolean),
      }),
    })
      .then((res) => {
        if (res.status === 413) throw new Error("TOO_LONG");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const t = data.title ?? "";
        const n = data.narrations ?? [];
        setTitle(t);
        setNarrations(n);
        if (t) onRecapGenerated?.(t, n);
      })
      .catch((err) => setError(
        err?.message === "TOO_LONG"
          ? "Story too long to save in the current version of the app — will be handled in a later version when GCS is enabled."
          : "Couldn't create the storybook. Please try again!"
      ))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="absolute inset-0 flex flex-col overflow-hidden"
      style={{ background: "#fdf6e3" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-4 flex-shrink-0"
        style={{ borderBottom: "1px solid #e8d9b5" }}
      >
        <div className="flex items-center gap-3">
          <img
            src={character.image}
            alt={character.name}
            className="w-10 h-10 rounded-full object-cover border-2"
            style={{ borderColor: "#c9a84c" }}
          />
          <div>
            <h2 className="font-display text-xl font-bold" style={{ color: "#6b4c11" }}>
              Our Story
            </h2>
            <p className="font-body text-xs" style={{ color: "#9c7a3a" }}>
              with {character.name}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-3xl leading-none pb-1 transition-opacity hover:opacity-60"
          style={{ color: "#9c7a3a" }}
          aria-label="Close"
        >
          ×
        </button>
      </div>

      {/* Scrollable storybook content */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div
              className="w-12 h-12 border-4 rounded-full animate-spin"
              style={{ borderColor: "#e8d9b5", borderTopColor: "#c9a84c" }}
            />
            <p className="font-body text-sm text-center" style={{ color: "#9c7a3a" }}>
              Creating your storybook…
              <br />
              <span className="text-xs opacity-70">Just a moment</span>
            </p>
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-12">
            <p className="font-body text-sm" style={{ color: "#9c7a3a" }}>
              {error}
            </p>
          </div>
        )}

        {!loading && !error && loadedScenes.length > 0 && (
          <div className="flex flex-col items-center px-8 pb-16">
            {/* Title block */}
            <div className="text-center pt-10 pb-8 max-w-xl">
              <p className="font-display text-4xl font-bold leading-tight" style={{ color: "#5c3d0e" }}>
                {title || `A Story with ${character.name}`}
              </p>
              <p className="font-body text-sm mt-2" style={{ color: "#9c7a3a" }}>
                A story with {character.name}
              </p>
              {/* Decorative divider */}
              <div className="flex items-center justify-center gap-3 mt-5">
                <div className="h-px w-16" style={{ background: "#c9a84c" }} />
                <span style={{ color: "#c9a84c" }}>✦</span>
                <div className="h-px w-16" style={{ background: "#c9a84c" }} />
              </div>
            </div>

            {/* Scenes */}
            <div className="flex flex-col gap-10 w-full max-w-2xl">
              {loadedScenes.map((scene, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex flex-col gap-4"
                >
                  <img
                    src={`data:${scene.mimeType ?? "image/png"};base64,${scene.imageData}`}
                    alt={`Story illustration ${i + 1}`}
                    className="w-full rounded-2xl shadow-lg"
                    style={{ border: "3px solid #e8d9b5" }}
                  />
                  {narrations[i] && (
                    <p
                      className="font-body text-lg leading-relaxed text-center px-4 italic"
                      style={{ color: "#5c3d0e" }}
                    >
                      {narrations[i]}
                    </p>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Badges earned */}
            {badges.length > 0 && (
              <div className="w-full max-w-2xl mt-10">
                <p className="font-display text-lg font-bold text-center mb-4" style={{ color: "#5c3d0e" }}>
                  🏅 Badges Earned
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  {badges.map((b, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 px-4 py-2 rounded-full font-body text-sm"
                      style={{ background: "#f5e6c0", border: "1px solid #c9a84c", color: "#5c3d0e" }}
                    >
                      <span className="text-xl">{b.emoji}</span>
                      <div>
                        <p className="font-semibold leading-tight">{b.name}</p>
                        <p className="text-xs opacity-70">{b.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* The End */}
            <div className="text-center mt-14 mb-2">
              <div className="flex items-center justify-center gap-3 mb-5">
                <div className="h-px w-16" style={{ background: "#c9a84c" }} />
                <span style={{ color: "#c9a84c" }}>✦</span>
                <div className="h-px w-16" style={{ background: "#c9a84c" }} />
              </div>
              <p className="font-display text-3xl font-bold" style={{ color: "#5c3d0e" }}>
                The End
              </p>
              <p className="font-body text-sm mt-2" style={{ color: "#9c7a3a" }}>
                {character.name} hopes you loved every moment ✨
              </p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
