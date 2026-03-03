import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Character } from "@/characters";
import { StoryScene } from "@/hooks/useStoryImages";

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "";

interface RecapPage {
  type: "text" | "image";
  content: string;
  image_data: string;
  mime_type: string;
}

interface Props {
  character: Character;
  scenes: StoryScene[];
  onClose: () => void;
}

export default function StoryRecapModal({ character, scenes, onClose }: Props) {
  const [pages, setPages] = useState<RecapPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const sceneData = scenes
      .filter((s) => s.status === "loaded" && s.imageData)
      .slice(0, 6)
      .map((s) => ({
        image_data: s.imageData!,
        mime_type: s.mimeType ?? "image/png",
        description: s.description,
      }));

    if (sceneData.length === 0) {
      setError("No story scenes to recap yet!");
      setLoading(false);
      return;
    }

    fetch(`${API_BASE}/api/story-recap`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        character_name: character.name,
        image_style: character.imageStyle,
        scenes: sceneData,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => setPages(data.pages ?? []))
      .catch(() => setError("Couldn't create the storybook. Please try again!"))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.25 }}
        className="bg-card text-card-foreground rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-border"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <img
              src={character.image}
              alt={character.name}
              className="w-10 h-10 rounded-full object-cover border-2 border-primary/40"
            />
            <div>
              <h2 className="font-display text-xl font-bold text-card-foreground">Our Story</h2>
              <p className="font-body text-xs text-muted-foreground">with {character.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-card-foreground transition-colors text-3xl leading-none pb-1"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <div className="w-12 h-12 border-4 border-muted border-t-primary rounded-full animate-spin" />
              <p className="font-body text-muted-foreground text-sm text-center">
                Creating your storybook…
                <br />
                <span className="text-xs opacity-70">Just a moment</span>
              </p>
            </div>
          )}

          {!loading && error && (
            <div className="text-center py-12">
              <p className="font-body text-muted-foreground text-sm">{error}</p>
            </div>
          )}

          {!loading && !error && pages.length > 0 && (
            <div className="flex flex-col gap-6">
              {pages.map((page, i) =>
                page.type === "text" ? (
                  <p key={i} className="font-body text-lg text-card-foreground leading-relaxed">
                    {page.content}
                  </p>
                ) : (
                  <img
                    key={i}
                    src={`data:${page.mime_type};base64,${page.image_data}`}
                    alt={`Story illustration ${Math.floor(i / 2) + 1}`}
                    className="w-full rounded-2xl shadow-md"
                  />
                )
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
