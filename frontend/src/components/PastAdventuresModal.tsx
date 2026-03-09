import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StoryGalleryEntry } from "@/screens/StoryScreen";

interface Props {
  onClose: () => void;
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function loadGallery(): StoryGalleryEntry[] {
  try {
    return JSON.parse(localStorage.getItem("taleweaver_gallery") ?? "[]");
  } catch {
    return [];
  }
}

// ── Storybook view for a single past story ───────────────────────────────────

function StorybookView({
  entry,
  onBack,
}: {
  entry: StoryGalleryEntry;
  onBack: () => void;
}) {
  const title = entry.recapTitle || entry.title;

  return (
    <div className="flex flex-col h-full" style={{ background: "#fdf6e3" }}>
      {/* Header */}
      <div
        className="flex items-center gap-3 px-6 py-4 flex-shrink-0"
        style={{ borderBottom: "1px solid #e8d9b5" }}
      >
        <button
          onClick={onBack}
          className="font-body text-sm transition-opacity hover:opacity-60 mr-1"
          style={{ color: "#9c7a3a" }}
        >
          ← Back
        </button>
        <img
          src={entry.characterImage}
          alt={entry.characterName}
          className="w-9 h-9 rounded-full object-cover border-2"
          style={{ borderColor: "#c9a84c" }}
        />
        <div>
          <p className="font-display text-base font-bold" style={{ color: "#6b4c11" }}>
            {entry.characterName}
          </p>
          <p className="font-body text-xs" style={{ color: "#9c7a3a" }}>
            {formatDate(entry.timestamp)}
          </p>
        </div>
      </div>

      {/* Scrollable storybook */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col items-center px-8 pb-16">
          {/* Title block */}
          <div className="text-center pt-10 pb-8 max-w-xl">
            <p className="font-display text-3xl font-bold leading-tight" style={{ color: "#5c3d0e" }}>
              {title}
            </p>
            <p className="font-body text-sm mt-2" style={{ color: "#9c7a3a" }}>
              A story with {entry.characterName}
            </p>
            <div className="flex items-center justify-center gap-3 mt-5">
              <div className="h-px w-16" style={{ background: "#c9a84c" }} />
              <span style={{ color: "#c9a84c" }}>✦</span>
              <div className="h-px w-16" style={{ background: "#c9a84c" }} />
            </div>
          </div>

          {/* Images */}
          <div className="flex flex-col gap-8 w-full max-w-2xl">
            {entry.images.map((img, i) => (
              <motion.img
                key={i}
                src={`data:${img.mimeType};base64,${img.imageData}`}
                alt={`Story scene ${i + 1}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="w-full rounded-2xl shadow-lg"
                style={{ border: "3px solid #e8d9b5" }}
              />
            ))}
          </div>

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
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Story card ────────────────────────────────────────────────────────────────

function StoryCard({
  entry,
  onClick,
}: {
  entry: StoryGalleryEntry;
  onClick: () => void;
}) {
  const thumb = entry.images[0];
  const title = entry.recapTitle || entry.title;

  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="flex flex-col rounded-2xl overflow-hidden text-left shadow-md transition-shadow hover:shadow-xl"
      style={{ background: "#fdf6e3", border: "2px solid #e8d9b5" }}
    >
      {/* Thumbnail */}
      <div className="w-full aspect-video overflow-hidden bg-amber-100">
        {thumb ? (
          <img
            src={`data:${thumb.mimeType};base64,${thumb.imageData}`}
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">📖</div>
        )}
      </div>

      {/* Card footer */}
      <div className="flex items-center gap-3 px-3 py-3">
        <img
          src={entry.characterImage}
          alt={entry.characterName}
          className="w-9 h-9 rounded-full object-cover flex-shrink-0 border-2"
          style={{ borderColor: "#c9a84c" }}
        />
        <div className="min-w-0">
          <p
            className="font-display text-sm font-bold truncate"
            style={{ color: "#5c3d0e" }}
          >
            {title}
          </p>
          <p className="font-body text-xs truncate" style={{ color: "#9c7a3a" }}>
            {entry.characterName} · {formatDate(entry.timestamp)}
          </p>
        </div>
      </div>
    </motion.button>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────

export default function PastAdventuresModal({ onClose }: Props) {
  const [entries] = useState<StoryGalleryEntry[]>(loadGallery);
  const [selected, setSelected] = useState<StoryGalleryEntry | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.95, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 16 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl flex flex-col"
        style={{ height: "min(85vh, 700px)", background: "#fdf6e3" }}
      >
        <AnimatePresence mode="wait">
          {selected ? (
            <motion.div
              key="book"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col h-full"
            >
              <StorybookView entry={selected} onBack={() => setSelected(null)} />
            </motion.div>
          ) : (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col h-full"
            >
              {/* Header */}
              <div
                className="flex items-center justify-between px-6 py-4 flex-shrink-0"
                style={{ borderBottom: "1px solid #e8d9b5" }}
              >
                <div>
                  <h2 className="font-display text-xl font-bold" style={{ color: "#6b4c11" }}>
                    Past Adventures
                  </h2>
                  <p className="font-body text-xs" style={{ color: "#9c7a3a" }}>
                    {entries.length} {entries.length === 1 ? "story" : "stories"} saved
                  </p>
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

              {/* Grid or empty state */}
              <div className="flex-1 overflow-y-auto px-6 py-5">
                {entries.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-4">
                    <span className="text-6xl">📖</span>
                    <p className="font-body text-base text-center" style={{ color: "#9c7a3a" }}>
                      No stories yet!
                      <br />
                      <span className="text-sm opacity-70">
                        Complete a story and it will appear here.
                      </span>
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {entries.map((entry) => (
                      <StoryCard
                        key={entry.id}
                        entry={entry}
                        onClick={() => setSelected(entry)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
