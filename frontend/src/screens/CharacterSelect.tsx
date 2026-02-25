import { useState, useCallback } from "react";
import { CHARACTERS, Character } from "@/characters";
import CharacterPortrait from "@/components/CharacterPortrait";

interface Props {
  onSelect: (character: Character) => void;
}

const ENGLISH_IDS = ["grandma-rose", "captain-leo", "fairy-sparkle", "professor-whiz", "dragon-blaze"];

const CharacterSelect = ({ onSelect }: Props) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const englishChars = CHARACTERS.filter((c) => ENGLISH_IDS.includes(c.id));
  const indianChars = CHARACTERS.filter((c) => !ENGLISH_IDS.includes(c.id));

  const handleSelect = useCallback(
    (character: Character) => {
      if (selectedId || isTransitioning) return;
      setSelectedId(character.id);
      setTimeout(() => setIsTransitioning(true), 600);
      setTimeout(() => onSelect(character), 1200);
    },
    [selectedId, isTransitioning, onSelect]
  );

  const renderCard = (char: Character) => {
    const isSelected = selectedId === char.id;
    const isDismissed = selectedId !== null && !isSelected;

    return (
      <button
        key={char.id}
        onClick={() => handleSelect(char)}
        onMouseEnter={() => setHoveredId(char.id)}
        onMouseLeave={() => setHoveredId(null)}
        disabled={!!selectedId}
        className={`
          rounded-2xl flex flex-col items-center overflow-hidden
          bg-gradient-to-b ${char.cardGradient}
          border-4 shadow-md
          transition-all duration-300 cursor-pointer
          ${isSelected ? "border-yellow-400 scale-110 shadow-yellow-200/50 ring-gold-pulse z-20" : "border-transparent"}
          ${isDismissed ? "card-dismissed pointer-events-none" : ""}
          ${!selectedId && hoveredId === char.id ? "shadow-xl border-white/80 -translate-y-2 scale-[1.05]" : ""}
        `}
        style={{ minHeight: "210px" }}
      >
        {/* Portrait */}
        <div className="flex-1 w-full flex items-center justify-center pt-1 relative overflow-hidden">
          <div
            className={`transition-transform duration-300 ${
              isSelected ? "emoji-selected" : hoveredId === char.id ? "emoji-hover" : ""
            }`}
          >
            <CharacterPortrait character={char} size="card" />
          </div>
        </div>

        {/* Name + tagline */}
        <div className="w-full px-2 py-2 bg-white/35 backdrop-blur-sm flex flex-col items-center gap-0.5">
          <span className="font-bangers text-lg text-gray-800 tracking-wide leading-tight">
            {char.name}
          </span>
          <span className="font-comic-neue text-sm rounded-full bg-white/50 px-2 py-0.5 text-gray-600">
            {char.tagline}
          </span>
        </div>
      </button>
    );
  };

  return (
    <div
      className={`h-screen w-full flex flex-col items-center justify-center px-4 py-3 relative overflow-hidden ${
        isTransitioning ? "screen-fade-out" : ""
      }`}
      style={{
        background: `
          radial-gradient(ellipse 80% 50% at 20% 80%, rgba(196, 181, 253, 0.35) 0%, transparent 70%),
          radial-gradient(ellipse 60% 40% at 85% 15%, rgba(186, 230, 253, 0.45) 0%, transparent 70%),
          radial-gradient(ellipse 50% 50% at 50% 50%, rgba(253, 230, 138, 0.1) 0%, transparent 60%),
          linear-gradient(160deg, #BAE6FD 0%, #DDD6FE 35%, #E9D5FF 65%, #C4B5FD 100%)
        `,
      }}
    >
      {/* Atmospheric clouds */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute rounded-full cloud-drift" style={{ width: "500px", height: "140px", top: "6%", left: "-8%", background: "radial-gradient(ellipse, rgba(255,255,255,0.25) 0%, transparent 70%)" }} />
        <div className="absolute rounded-full cloud-drift-slow" style={{ width: "600px", height: "120px", top: "55%", right: "-12%", background: "radial-gradient(ellipse, rgba(255,255,255,0.18) 0%, transparent 70%)" }} />
        <div className="absolute rounded-full cloud-drift-slow" style={{ width: "350px", height: "100px", bottom: "8%", left: "10%", background: "radial-gradient(ellipse, rgba(255,255,255,0.12) 0%, transparent 70%)" }} />
      </div>

      {/* Title */}
      <div className="z-10 text-center mb-4">
        <h1
          className="font-bangers text-4xl md:text-5xl text-purple-900 mb-1 tracking-wide"
          style={{ textShadow: "2px 3px 0px rgba(168, 85, 247, 0.2)" }}
        >
          Who should tell your story?
        </h1>
        <p className="font-comic-neue text-base md:text-lg text-purple-500/80">
          Tap a storyteller to begin!
        </p>
      </div>

      <div className="z-10 w-full max-w-6xl px-2 flex flex-col gap-3">

        {/* ── Row 1: English storytellers ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {englishChars.map(renderCard)}
        </div>

        {/* ── Divider ── */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-white/40" />
          <div className="flex items-center gap-1.5 bg-white/30 backdrop-blur-sm border border-white/50 rounded-full px-4 py-1 shadow-sm">
            <span className="text-base">🇮🇳</span>
            <span className="font-bangers text-base tracking-wide text-purple-800">
              Indian Languages
            </span>
            <span className="font-comic-neue text-xs text-purple-600">
              · भारतीय भाषाएँ
            </span>
          </div>
          <div className="flex-1 h-px bg-white/40" />
        </div>

        {/* ── Row 2: Indian language storytellers ── */}
        <div className="flex justify-center">
          <div className="grid grid-cols-2 gap-3" style={{ width: "calc(42% + 6px)" }}>
            {indianChars.map(renderCard)}
          </div>
        </div>

      </div>
    </div>
  );
};

export default CharacterSelect;
