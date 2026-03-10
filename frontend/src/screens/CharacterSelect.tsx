import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { CHARACTERS, Character } from "@/characters";
import FloatingElements from "@/components/FloatingElements";

interface Props {
  onSelect: (character: Character) => void;
  onBack?: () => void;
}

const CharacterCard = ({
  character,
  onSelect,
  index,
  disabled,
  selected,
  dismissed,
}: {
  character: Character;
  onSelect: (c: Character) => void;
  index: number;
  disabled: boolean;
  selected: boolean;
  dismissed: boolean;
}) => (
  <motion.button
    initial={{ opacity: 0, y: 40 }}
    animate={{ opacity: dismissed ? 0 : 1, y: 0, scale: dismissed ? 0.85 : selected ? 1.1 : 1 }}
    transition={{ delay: index * 0.07, duration: 0.45 }}
    whileHover={!disabled ? { scale: 1.08, y: -8 } : {}}
    whileTap={!disabled ? { scale: 0.95 } : {}}
    onClick={() => onSelect(character)}
    disabled={disabled}
    className={`group flex flex-col items-center gap-3 p-4 rounded-2xl bg-card/60 backdrop-blur-sm character-glow cursor-pointer border transition-colors w-44 sm:w-52 ${
      selected
        ? "border-primary shadow-[0_0_0_3px_hsl(var(--primary)/0.5)]"
        : "border-border/50 hover:border-primary/50"
    }`}
  >
    <motion.div
      className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-muted/30 border-2 transition-colors ${
        selected ? "border-primary" : "border-primary/30 group-hover:border-primary"
      }`}
      animate={selected ? { scale: [1, 1.05, 1] } : {}}
      transition={{ duration: 0.6, repeat: selected ? Infinity : 0 }}
    >
      <img src={character.image} alt={character.name} className="w-full h-full object-cover" />
    </motion.div>
    <div className="text-center">
      <h3 className="font-display text-sm sm:text-base font-bold text-foreground leading-tight">
        {character.name}
      </h3>
      <p className="text-xs text-muted-foreground mt-0.5">{character.language}</p>
    </div>
  </motion.button>
);

const CharacterSelect = ({ onSelect, onBack }: Props) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const englishChars = CHARACTERS.filter((c) => c.category === "english");
  const otherChars = CHARACTERS.filter((c) => c.category === "other");

  const handleSelect = useCallback(
    (character: Character) => {
      if (selectedId) return;
      setSelectedId(character.id);
      setTimeout(() => onSelect(character), 600);
    },
    [selectedId, onSelect]
  );

  return (
    <div className="relative min-h-screen bg-sky-gradient overflow-hidden">
      <FloatingElements />

      <div className="relative z-10 container mx-auto px-4 py-3 sm:py-5">
        {/* Home button */}
        {onBack && (
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={onBack}
            className="mb-6 text-muted-foreground hover:text-foreground font-body transition-colors"
          >
            Home
          </motion.button>
        )}

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="font-display text-3xl sm:text-5xl font-extrabold text-primary mb-2">
            Choose Your Storyteller
          </h1>
          <p className="text-foreground/70 font-body text-base sm:text-lg">
            Pick a friend to tell you a magical story ✨
          </p>
        </motion.div>

        {/* English characters */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-10"
        >
          <h2 className="font-display text-xl sm:text-2xl font-bold text-magic-teal mb-5 text-center">
            🌍 English Storytellers
          </h2>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
            {englishChars.map((char, i) => (
              <CharacterCard
                key={char.id}
                character={char}
                onSelect={handleSelect}
                index={i}
                disabled={!!selectedId}
                selected={selectedId === char.id}
                dismissed={!!selectedId && selectedId !== char.id}
              />
            ))}
          </div>
        </motion.div>

        {/* Divider */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: selectedId ? 0 : 1 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-4 mb-10"
        >
          <div className="flex-1 h-px bg-border/50" />
          <span className="font-display text-sm text-magic-orange font-bold px-3 py-1 rounded-full border border-magic-orange/30 bg-card/40 backdrop-blur-sm">
            🌏 World Languages
          </span>
          <div className="flex-1 h-px bg-border/50" />
        </motion.div>

        {/* World language characters */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="font-display text-xl sm:text-2xl font-bold text-magic-orange mb-5 text-center">
            🌏 World Language Storytellers
          </h2>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
            {otherChars.map((char, i) => (
              <CharacterCard
                key={char.id}
                character={char}
                onSelect={handleSelect}
                index={i + 4}
                disabled={!!selectedId}
                selected={selectedId === char.id}
                dismissed={!!selectedId && selectedId !== char.id}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CharacterSelect;
