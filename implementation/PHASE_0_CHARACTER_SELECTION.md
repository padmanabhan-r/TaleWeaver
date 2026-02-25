# Phase 0 — Character Selection Experience

## Goal
The first thing a child sees is a magical, delightful screen where they choose their storyteller.
This is NOT a settings page. It is the beginning of the story itself.
The selection screen should feel like opening a pop-up book.

---

## Screen Design

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│          ✨  Who should tell your story today?  ✨          │
│                    (Bangers font, large)                    │
│                                                             │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐                │
│   │          │  │          │  │          │                │
│   │  [Rose   │  │ [Captain │  │  [Fairy  │                │
│   │  avatar] │  │  Leo     │  │  Sparkle │                │
│   │          │  │ avatar]  │  │  avatar] │                │
│   │  Grandma │  │ Captain  │  │  Fairy   │                │
│   │  Rose    │  │   Leo    │  │  Sparkle │                │
│   │          │  │          │  │          │                │
│   │ Bedtime  │  │ Adventure│  │  Magic   │                │
│   │  tales   │  │ stories  │  │  tales   │                │
│   └──────────┘  └──────────┘  └──────────┘                │
│                                                             │
│        ┌──────────┐      ┌──────────┐                     │
│        │          │      │          │                     │
│        │[Professor│      │  [Dragon │                     │
│        │  Whiz    │      │  Blaze]  │                     │
│        │  avatar] │      │          │                     │
│        │ Professor│      │  Dragon  │                     │
│        │   Whiz   │      │  Blaze   │                     │
│        │          │      │          │                     │
│        │ Science  │      │  Silly   │                     │
│        │adventures│      │adventures│                     │
│        └──────────┘      └──────────┘                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Character Cards

Each card:
- **Size**: ~180×220px on desktop, ~140×170px on mobile
- **Background**: Pastel gradient unique to each character
- **Avatar**: Animated (idle breathing/blinking) SVG or Lottie JSON
- **Name**: Comic Neue Bold, large
- **Tagline**: 2-3 words describing story style
- **Hover effect**: Card floats up, glows, character does a little wave
- **Tap effect**: Character bounces, plays a 1-second audio greeting preview

### Character Colors & Gradients

| Character | Gradient | Accent |
|---|---|---|
| Grandma Rose | `#FFD1DC → #FFB3C6` | `#FF69B4` |
| Captain Leo | `#B3D4FF → #7FB3FF` | `#2563EB` |
| Fairy Sparkle | `#E8B4FF → #C084FC` | `#A855F7` |
| Professor Whiz | `#B3FFD4 → #6EE7B7` | `#10B981` |
| Dragon Blaze | `#FFD4B3 → #FFA07A` | `#F97316` |

---

## Character Configuration Data

```javascript
// frontend/src/characters/index.js

export const CHARACTERS = [
  {
    id: "grandma-rose",
    name: "Grandma Rose",
    tagline: "Cozy bedtime tales",
    voiceName: "Aoede",
    avatar: "grandma-rose",
    cardGradient: "from-pink-200 to-rose-300",
    accentColor: "#FF69B4",
    greeting: "Hello sweetheart! I've been waiting for you. Shall we tell a story?",
    imageStyle: "warm watercolor illustration, storybook style, soft pastel colors, cozy and gentle, children's book art",
    personality: "warm_grandmother",
  },
  {
    id: "captain-leo",
    name: "Captain Leo",
    tagline: "Bold adventures",
    voiceName: "Charon",
    avatar: "captain-leo",
    cardGradient: "from-blue-200 to-blue-400",
    accentColor: "#2563EB",
    greeting: "Ahoy there, young explorer! Ready for an adventure on the high seas?",
    imageStyle: "bold comic book style, vibrant saturated colors, action-packed, nautical adventure, children's illustration",
    personality: "adventurous_captain",
  },
  {
    id: "fairy-sparkle",
    name: "Fairy Sparkle",
    tagline: "Magical tales",
    voiceName: "Kore",
    avatar: "fairy-sparkle",
    cardGradient: "from-purple-200 to-violet-400",
    accentColor: "#A855F7",
    greeting: "Oh! A visitor! I have the most wonderful magical story just waiting to be told!",
    imageStyle: "sparkly magical fantasy illustration, pastel rainbow colors, glitter and stars, enchanted forest, fairy tale art style",
    personality: "magical_fairy",
  },
  {
    id: "professor-whiz",
    name: "Professor Whiz",
    tagline: "Science adventures",
    voiceName: "Puck",
    avatar: "professor-whiz",
    cardGradient: "from-green-200 to-emerald-400",
    accentColor: "#10B981",
    greeting: "Fascinating! A young mind arrives! I have a most extraordinary story involving science and discovery!",
    imageStyle: "colorful cartoon science illustration, bright cheerful laboratory, inventor workshop style, children's STEM art",
    personality: "curious_professor",
  },
  {
    id: "dragon-blaze",
    name: "Dragon Blaze",
    tagline: "Silly dragon fun",
    voiceName: "Fenrir",
    avatar: "dragon-blaze",
    cardGradient: "from-orange-200 to-red-300",
    accentColor: "#F97316",
    greeting: "ROAAARRR! Oh wait, I mean... hello! Dragon Blaze here, ready for the most EPIC story EVER!",
    imageStyle: "bold vibrant cartoon style, fiery bright colors, funny expressive dragon characters, action-comedy children's illustration",
    personality: "energetic_dragon",
  },
];

export const getCharacter = (id) => CHARACTERS.find(c => c.id === id);
```

---

## Component Structure

### `CharacterSelect.jsx`

```jsx
// frontend/src/screens/CharacterSelect.jsx

import { useState } from "react";
import { CHARACTERS } from "../characters";
import { CharacterCard } from "../components/CharacterCard";

export function CharacterSelect({ onSelect }) {
  const [hoveredId, setHoveredId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  const handleSelect = (character) => {
    setSelectedId(character.id);
    // Play short greeting audio preview (pre-recorded or TTS)
    // Then transition to story screen after 1.5s
    setTimeout(() => onSelect(character), 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-200 to-purple-200
                    flex flex-col items-center justify-center p-8">
      {/* Sparkle/star particles in background (CSS animation) */}
      <div className="sparkle-container absolute inset-0 pointer-events-none" />

      <h1 className="font-bangers text-5xl md:text-6xl text-purple-800
                     drop-shadow-lg mb-2 text-center">
        Who should tell your story today?
      </h1>
      <p className="text-purple-600 text-xl mb-12 text-center font-comic-neue">
        Tap a storyteller to begin!
      </p>

      {/* Character grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-4xl w-full">
        {CHARACTERS.map((character) => (
          <CharacterCard
            key={character.id}
            character={character}
            isHovered={hoveredId === character.id}
            isSelected={selectedId === character.id}
            onHover={() => setHoveredId(character.id)}
            onLeave={() => setHoveredId(null)}
            onClick={() => handleSelect(character)}
          />
        ))}
      </div>
    </div>
  );
}
```

### `CharacterCard.jsx`

```jsx
// frontend/src/components/CharacterCard.jsx

import { CharacterAvatar } from "./CharacterAvatar";

export function CharacterCard({ character, isHovered, isSelected, onHover, onLeave, onClick }) {
  return (
    <button
      className={`
        relative rounded-3xl p-4 flex flex-col items-center gap-3
        transition-all duration-300 cursor-pointer border-4
        bg-gradient-to-b ${character.cardGradient}
        ${isHovered ? "scale-105 -translate-y-2 shadow-2xl border-white" : "scale-100 border-transparent shadow-lg"}
        ${isSelected ? "scale-110 border-yellow-400 shadow-yellow-200/50 shadow-2xl" : ""}
      `}
      style={{ borderColor: isSelected ? "#FBBF24" : isHovered ? "white" : "transparent" }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={onClick}
    >
      {/* Animated avatar */}
      <CharacterAvatar
        characterId={character.avatar}
        state={isSelected ? "excited" : isHovered ? "wave" : "idle"}
        size={120}
      />

      {/* Character name */}
      <span className="font-bangers text-2xl text-gray-800 drop-shadow-sm">
        {character.name}
      </span>

      {/* Tagline */}
      <span className="font-comic-neue text-sm text-gray-600 bg-white/50
                       rounded-full px-3 py-1">
        {character.tagline}
      </span>

      {/* Selected glow ring */}
      {isSelected && (
        <div className="absolute inset-0 rounded-3xl animate-pulse
                        ring-4 ring-yellow-400 ring-offset-2" />
      )}
    </button>
  );
}
```

---

## Transition Animation (Selection → Story)

When a character is selected:

1. **t=0ms**: Card glows, character plays "excited" animation
2. **t=200ms**: All other cards fade out slowly
3. **t=500ms**: Selected card expands and moves to center of screen
4. **t=800ms**: Character says their greeting (audio plays)
5. **t=1500ms**: Transition to StoryScreen — character slides to left panel position
   while story panel area fades in from the right

```css
/* Character card selection transition */
.character-card-selected-expand {
  animation: expand-to-center 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

@keyframes expand-to-center {
  0%   { transform: scale(1); }
  50%  { transform: scale(1.2) translateY(-10px); }
  100% { transform: scale(1.1) translateY(-5px); }
}

/* Other cards fading out */
.character-card-fade-out {
  animation: fade-shrink 0.4s ease-out forwards;
}

@keyframes fade-shrink {
  to { opacity: 0; transform: scale(0.8); }
}
```

---

## State Management

```javascript
// App.jsx — top-level state

const [screen, setScreen] = useState("character-select"); // "character-select" | "story"
const [selectedCharacter, setSelectedCharacter] = useState(null);

const handleCharacterSelect = (character) => {
  setSelectedCharacter(character);
  setScreen("story");
};

return screen === "character-select"
  ? <CharacterSelect onSelect={handleCharacterSelect} />
  : <StoryScreen character={selectedCharacter} />;
```

---

## Avatar Assets Required

For each character, we need:

### Option A: Lottie Animations (Recommended)
- `idle.json` — gentle breathing, blinking, slight swaying
- `speaking.json` — mouth moving, expressive gestures
- `listening.json` — leaning forward, attentive expression, ear glow/sparkle
- `thinking.json` — looking up, finger on chin
- `excited.json` — jumping, clapping, big smile
- `wave.json` — friendly wave on hover

### Option B: CSS-animated SVGs (Simpler, works without Lottie)
- Single SVG per character with CSS classes toggled based on state
- Mouth path morphing using CSS transitions
- Body bob via `transform: translateY()` animation
- Eyes blinking via opacity animation on eyelid element

### Recommended Tool for Asset Creation
- **Rive** (rive.app) — best for interactive, state-machine-based animations
- **LottieFiles** — good library of pre-made characters to customize
- **For MVP**: Use simple CSS SVGs + animate mouth via a rectangle that changes height

---

## Accessibility

- Each card has `aria-label="Choose [Character Name] as your storyteller"`
- Selection confirmed with `aria-live="polite"` announcement
- Keyboard navigation supported (Tab + Enter)
- Touch targets minimum 44×44px (cards are 140×170px minimum)
- Color contrast ratios meet WCAG AA for all text

---

## Files to Create

```
frontend/src/
├── screens/
│   └── CharacterSelect.jsx         (screen component)
├── components/
│   ├── CharacterCard.jsx           (individual card)
│   └── SparkleBackground.jsx       (particle effect)
├── characters/
│   ├── index.js                    (CHARACTERS registry)
│   ├── grandma-rose/
│   │   ├── config.js               (character-specific overrides)
│   │   └── avatar.svg (or .lottie)
│   ├── captain-leo/
│   ├── fairy-sparkle/
│   ├── professor-whiz/
│   └── dragon-blaze/
└── index.css
    └── (add sparkle animation, card hover, transition keyframes)
```

---

## Definition of Done

- [ ] All 5 character cards render with correct colors and placeholder avatars
- [ ] Hover animation: card lifts smoothly
- [ ] Click animation: selected card glows gold
- [ ] All other cards fade out on selection
- [ ] Transition to story screen fires after 1.5 seconds
- [ ] Selected character config is passed to StoryScreen
- [ ] Works on mobile (touch) and desktop (mouse + keyboard)
- [ ] No flash of unstyled content on load
