import { useState, useCallback } from "react";
import { CHARACTERS, Character } from "@/characters";
import CharacterPortrait from "@/components/CharacterPortrait";

interface Props {
  onSelect: (character: Character) => void;
}

const CharacterSelect = ({ onSelect }: Props) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const handleSelect = useCallback(
    (character: Character) => {
      if (selectedId || isTransitioning) return;
      setSelectedId(character.id);

      setTimeout(() => {
        setIsTransitioning(true);
      }, 600);

      setTimeout(() => {
        onSelect(character);
      }, 1200);
    },
    [selectedId, isTransitioning, onSelect]
  );

  return (
    <div
      className={`min-h-screen w-full flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden ${
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
      {/* Soft atmospheric clouds */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div
          className="absolute rounded-full cloud-drift"
          style={{
            width: "500px",
            height: "140px",
            top: "6%",
            left: "-8%",
            background: "radial-gradient(ellipse, rgba(255,255,255,0.25) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute rounded-full cloud-drift-slow"
          style={{
            width: "600px",
            height: "120px",
            top: "55%",
            right: "-12%",
            background: "radial-gradient(ellipse, rgba(255,255,255,0.18) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: "500px",
            height: "500px",
            top: "25%",
            left: "35%",
            background: "radial-gradient(circle, rgba(251,191,36,0.08) 0%, transparent 55%)",
          }}
        />
        <div
          className="absolute rounded-full cloud-drift"
          style={{
            width: "400px",
            height: "90px",
            top: "32%",
            left: "55%",
            background: "radial-gradient(ellipse, rgba(255,255,255,0.15) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute rounded-full cloud-drift-slow"
          style={{
            width: "350px",
            height: "100px",
            bottom: "8%",
            left: "10%",
            background: "radial-gradient(ellipse, rgba(255,255,255,0.12) 0%, transparent 70%)",
          }}
        />
      </div>

      {/* Title */}
      <div className="z-10 text-center mb-8 md:mb-10">
        <h1
          className="font-bangers text-5xl md:text-6xl lg:text-7xl text-purple-900 mb-3 tracking-wide"
          style={{ textShadow: "2px 3px 0px rgba(168, 85, 247, 0.2)" }}
        >
          Who should tell your story?
        </h1>
        <p className="font-comic-neue text-xl md:text-2xl text-purple-500/80">
          Tap a storyteller to begin!
        </p>
      </div>

      {/* Character grid */}
      <div className="z-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5 md:gap-6 max-w-6xl w-full px-2">
        {CHARACTERS.map((char) => {
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
                rounded-3xl flex flex-col items-center overflow-hidden
                bg-gradient-to-b ${char.cardGradient}
                border-4 shadow-lg
                transition-all duration-300 cursor-pointer
                ${isSelected ? "border-yellow-400 scale-110 shadow-yellow-200/50 ring-gold-pulse z-20" : "border-transparent"}
                ${isDismissed ? "card-dismissed pointer-events-none" : ""}
                ${!selectedId && hoveredId === char.id ? "shadow-2xl border-white/80 -translate-y-3 scale-[1.06]" : ""}
              `}
              style={{ minHeight: "260px" }}
            >
              {/* Portrait area — top portion */}
              <div className="flex-1 w-full flex items-end justify-center pt-2 pb-0 relative overflow-hidden">
                <div
                  className={`transition-transform duration-300 ${
                    isSelected
                      ? "emoji-selected"
                      : hoveredId === char.id
                      ? "emoji-hover"
                      : ""
                  }`}
                >
                  <CharacterPortrait character={char} size="card" />
                </div>
              </div>

              {/* Info area — bottom */}
              <div className="w-full px-3 py-3 bg-white/35 backdrop-blur-sm flex flex-col items-center gap-1">
                <span className="font-bangers text-xl md:text-2xl text-gray-800 tracking-wide">
                  {char.name}
                </span>
                <span className="font-comic-neue text-xs md:text-sm rounded-full bg-white/50 px-3 py-0.5 text-gray-600">
                  {char.tagline}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CharacterSelect;
