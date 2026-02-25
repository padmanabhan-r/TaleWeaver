# Lovable Prompt — TaleWeaver Character Selection UI

> Paste everything below the horizontal rule directly into Lovable.

---

## PROMPT

Build a React + Vite + TailwindCSS web app called **TaleWeaver** — an AI-powered interactive storytelling app for children aged 4–10. The app has two screens: a **Character Selection screen** and a **Story screen placeholder**. You are only building the UI shell — no backend, no API calls, no audio.

---

### Tech Stack

- React 19 + Vite
- TailwindCSS v4
- Google Fonts: **Bangers** (headings) and **Comic Neue** (body/captions)
- No UI component library needed — custom styled components only
- No backend calls

---

### Fonts Setup

In `index.html`, add inside `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bangers&family=Comic+Neue:wght@400;700&display=swap" rel="stylesheet">
```

In `tailwind.config.js`, extend fontFamily:
```js
fontFamily: {
  bangers: ["Bangers", "cursive"],
  "comic-neue": ["Comic Neue", "cursive"],
}
```

---

### App State (App.jsx)

```jsx
const [screen, setScreen] = useState("select"); // "select" | "story"
const [selectedCharacter, setSelectedCharacter] = useState(null);

const handleCharacterSelect = (character) => {
  setSelectedCharacter(character);
  setScreen("story");
};

const handleBack = () => {
  setScreen("select");
  setSelectedCharacter(null);
};
```

Render `<CharacterSelect onSelect={handleCharacterSelect} />` when screen is "select", and `<StoryScreen character={selectedCharacter} onBack={handleBack} />` when screen is "story".

---

### Character Data

Create `src/characters/index.js` with this exact data:

```js
export const CHARACTERS = [
  {
    id: "grandma-rose",
    name: "Grandma Rose",
    tagline: "Cozy bedtime tales",
    emoji: "👵",
    description: "Warm, gentle, and full of love. She knows every fairy tale ever told.",
    cardGradient: "from-pink-200 to-rose-300",
    bgColor: "#FFD1DC",
    accentColor: "#FF69B4",
    textColor: "#9D174D",
    greeting: "Hello sweetheart! I've been waiting for you. Shall we tell a story?",
  },
  {
    id: "captain-leo",
    name: "Captain Leo",
    tagline: "Bold adventures",
    emoji: "🧑‍✈️",
    description: "Brave, exciting, and ready for any adventure. Ahoy, young explorer!",
    cardGradient: "from-blue-200 to-blue-400",
    bgColor: "#B3D4FF",
    accentColor: "#2563EB",
    textColor: "#1E3A8A",
    greeting: "Ahoy there, young explorer! Ready for an adventure on the high seas?",
  },
  {
    id: "fairy-sparkle",
    name: "Fairy Sparkle",
    tagline: "Magical tales",
    emoji: "🧚",
    description: "Whimsical, magical, full of wonder. Every story she tells sparkles.",
    cardGradient: "from-purple-200 to-violet-400",
    bgColor: "#E8B4FF",
    accentColor: "#A855F7",
    textColor: "#6B21A8",
    greeting: "Oh! A visitor! I have the most wonderful magical story just waiting to be told!",
  },
  {
    id: "professor-whiz",
    name: "Professor Whiz",
    tagline: "Science adventures",
    emoji: "🧑‍🔬",
    description: "Curious, clever, and endearingly absent-minded. Science is his magic!",
    cardGradient: "from-green-200 to-emerald-400",
    bgColor: "#B3FFD4",
    accentColor: "#10B981",
    textColor: "#065F46",
    greeting: "Fascinating! A young mind arrives! I have a most extraordinary story!",
  },
  {
    id: "dragon-blaze",
    name: "Dragon Blaze",
    tagline: "Silly dragon fun",
    emoji: "🐲",
    description: "Big, enthusiastic, and VERY excited. Every story is the BEST story EVER!",
    cardGradient: "from-orange-200 to-red-300",
    bgColor: "#FFD4B3",
    accentColor: "#F97316",
    textColor: "#9A3412",
    greeting: "ROAAARRR! Oh wait, I mean... hello! Ready for the most EPIC story EVER?!",
  },
];

export const getCharacter = (id) => CHARACTERS.find((c) => c.id === id);
```

---

### Screen 1 — Character Selection (`src/screens/CharacterSelect.jsx`)

**Background**: A full-screen gradient `from-sky-200 via-blue-100 to-purple-200`, with animated floating sparkle dots (pure CSS, no library).

**Layout**:
- Centered vertically and horizontally
- Title at top: `"✨ Who should tell your story today? ✨"` in **Bangers** font, `text-5xl md:text-6xl`, color `text-purple-900`, with a text drop shadow
- Subtitle below: `"Tap a storyteller to begin!"` in Comic Neue, `text-xl`, `text-purple-600`
- A 2-column grid on mobile, 3-column grid on `md:` and above, `gap-6`, max-width `max-w-4xl`, centered

**Each Character Card**:

The card is a `<button>` element. It should:

- Be `rounded-3xl`, `p-5`, `flex flex-col items-center gap-3`
- Use a `bg-gradient-to-b` matching that character's `cardGradient`
- Have `border-4 border-transparent` by default
- Have a `shadow-lg` box shadow
- On **hover**: lift up with `translateY(-8px) scale(1.05)`, `shadow-2xl`, border becomes `border-white`
- On **selected** (after click): border becomes `border-yellow-400`, scale to `scale-110`, `shadow-yellow-200/50`, add a gold pulsing ring around the card
- All transitions via `transition-all duration-300`

Inside the card (top to bottom):

1. **Character Avatar Area** — a large emoji displayed at `text-8xl` (96px), inside a circle `w-28 h-28 rounded-full bg-white/60 flex items-center justify-center shadow-inner`. On hover the emoji does a gentle bounce animation. On selected it does a bigger jump animation.

2. **Character Name** — in **Bangers** font, `text-2xl`, `text-gray-800`

3. **Tagline pill** — in Comic Neue, `text-sm`, inside a `rounded-full bg-white/60 px-3 py-1 text-gray-700`

**Click behavior (animated sequence)**:

When a card is clicked:
1. Immediately: the clicked card gets `border-yellow-400` and a gold pulsing ring, the emoji "jumps" (bounceIn animation)
2. After 150ms: all other cards fade out and shrink (`opacity-0 scale-90 pointer-events-none`)
3. After 600ms: the selected card scales up slightly and a sparkle burst appears (CSS only)
4. After 1200ms: the screen transitions out (fade to white) and the Story screen fades in

Implement this with `useState` for `selectedId` and `isTransitioning`, and use `setTimeout` for the sequence. Use CSS `transition` and `animation` classes toggled via state.

**Sparkle Background**:

Create floating sparkle particles using pure CSS. Position them absolutely behind all content (`z-0`). Have 12 sparkle dots (small `w-2 h-2 rounded-full bg-yellow-300/60`) scattered at random positions across the screen, each with a slow `animate-bounce` or `animate-ping` with different `animation-delay` values (0s, 0.3s, 0.6s ... 3.3s) and `animation-duration` (2s, 2.5s, 3s pattern). Also add 6 larger `text-2xl` star emojis (⭐, ✨, 🌟) at different positions with slow floating animations.

---

### Screen 2 — Story Placeholder (`src/screens/StoryScreen.jsx`)

This is a **placeholder only** — the real story functionality (voice, audio, AI) will be connected separately. It just needs to look correct and export the right interface.

**Background**: A full-screen gradient that uses the selected character's colors — `bg-gradient-to-b` from a light tint of their accent color to white. Apply `data-character={character.id}` on the root div.

**Layout** (two-column on desktop, single column on mobile):

```
┌──────────────────────────────────────────────────────────┐
│  ← Back          TaleWeaver ✨            [placeholder]   │
├──────────────────────────────────────────────────────────┤
│                                                          │
│   LEFT PANEL (40%)        RIGHT PANEL (60%)              │
│                                                          │
│   Big character emoji     "Story scenes will             │
│   (text-[180px])          appear here as the             │
│                           story unfolds..."              │
│   Character name          (placeholder empty state       │
│   (Bangers, 3xl)          with dashed border,            │
│                           book emoji, gentle             │
│   Status text:            animation)                     │
│   "Ready to tell                                         │
│    a story!"                                             │
│   (Comic Neue, xl)                                       │
│                                                          │
│   ┌──────────────────┐                                   │
│   │  Begin the Story! │   ← big yellow button            │
│   └──────────────────┘                                   │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**"Begin the Story!" button**:
- `bg-yellow-400 hover:bg-yellow-500`
- `font-bangers text-3xl`
- `px-10 py-4 rounded-full shadow-xl`
- `border-4 border-yellow-600`
- `transform hover:scale-105 active:scale-95 transition-all`
- When clicked, the button changes text to `"Connecting..."` and shows a spinner (disabled state). Since this is a placeholder, nothing else happens — the real connection logic will be added later.

**Character avatar in story screen**:
- The emoji is displayed very large (`text-[160px] md:text-[200px]`)
- Surrounded by a pulsing ring in the character's accent color
- The ring has 3 states indicated by a CSS class: `state-idle` (gray ring, static), `state-speaking` (gold ring, pulsing), `state-listening` (blue ring, slow glow)
- Default state is `state-idle` in the placeholder

**Right panel empty state**:
- A `rounded-3xl border-4 border-dashed border-purple-300 bg-white/40`
- Centered content: `📖` emoji at `text-6xl`, then text `"Story pictures will appear here..."` in Comic Neue
- The border has a slow shimmer/glow animation cycling through pastel colors

**Back button**: top-left, `← Back`, Comic Neue, links back to character select via `onBack()`

---

### CSS Animations Required

Add these to `src/index.css`:

```css
/* Emoji bounce on hover */
@keyframes emoji-bounce {
  0%, 100% { transform: translateY(0) scale(1); }
  30%       { transform: translateY(-12px) scale(1.15); }
  60%       { transform: translateY(-5px) scale(1.05); }
}
.emoji-hover { animation: emoji-bounce 0.5s ease forwards; }

/* Emoji big jump on selection */
@keyframes emoji-jump {
  0%   { transform: translateY(0) scale(1) rotate(0deg); }
  25%  { transform: translateY(-20px) scale(1.2) rotate(-5deg); }
  50%  { transform: translateY(-30px) scale(1.3) rotate(5deg); }
  75%  { transform: translateY(-10px) scale(1.1) rotate(-2deg); }
  100% { transform: translateY(0) scale(1) rotate(0deg); }
}
.emoji-selected { animation: emoji-jump 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }

/* Gold ring pulse around selected card */
@keyframes gold-ring-pulse {
  0%   { box-shadow: 0 0 0 0px rgba(251, 191, 36, 0.7); }
  70%  { box-shadow: 0 0 0 12px rgba(251, 191, 36, 0); }
  100% { box-shadow: 0 0 0 0px rgba(251, 191, 36, 0); }
}
.ring-gold-pulse { animation: gold-ring-pulse 1s ease-out infinite; }

/* Sparkle float */
@keyframes sparkle-float {
  0%, 100% { transform: translateY(0px) scale(1); opacity: 0.6; }
  50%       { transform: translateY(-15px) scale(1.1); opacity: 1; }
}

/* Screen fade out transition */
@keyframes fade-to-white {
  from { opacity: 1; }
  to   { opacity: 0; }
}
.screen-fade-out { animation: fade-to-white 0.4s ease forwards; }

/* Screen fade in */
@keyframes fade-from-white {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}
.screen-fade-in { animation: fade-from-white 0.5s ease forwards; }

/* Card fade out (others when one selected) */
@keyframes card-dismiss {
  to { opacity: 0; transform: scale(0.85); }
}
.card-dismissed { animation: card-dismiss 0.3s ease forwards; }

/* Speaking ring pulse (story screen) */
@keyframes speaking-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.5); }
  50%       { box-shadow: 0 0 0 20px rgba(251, 191, 36, 0); }
}
.state-speaking { animation: speaking-pulse 0.8s ease infinite; }

/* Listening ring glow (story screen) */
@keyframes listening-glow {
  0%   { box-shadow: 0 0 0 5px rgba(96, 165, 250, 0.2); }
  100% { box-shadow: 0 0 0 20px rgba(96, 165, 250, 0.5); }
}
.state-listening { animation: listening-glow 1.5s ease-in-out infinite alternate; }

/* Dashed border color cycle on story right panel */
@keyframes border-rainbow {
  0%   { border-color: #C084FC; }
  25%  { border-color: #60A5FA; }
  50%  { border-color: #34D399; }
  75%  { border-color: #FB923C; }
  100% { border-color: #C084FC; }
}
.border-cycle { animation: border-rainbow 4s linear infinite; }
```

---

### File Structure to Produce

```
src/
├── App.jsx
├── index.css
├── main.jsx
├── characters/
│   └── index.js
└── screens/
    ├── CharacterSelect.jsx
    └── StoryScreen.jsx
```

No other files needed. Keep it simple and clean.

---

### Important Notes for Lovable

1. **Do not add any backend calls, fetch, axios, or API integrations.** This is pure UI.

2. **The `onSelect(character)` callback in `CharacterSelect`** must pass the full character object (the one from `CHARACTERS` array) — this is how the real backend integration will work later.

3. **Export interfaces matter**: `CharacterSelect` takes `{ onSelect }`. `StoryScreen` takes `{ character, onBack }`.

4. **The character emoji avatars** are the source of visual delight here — make them BIG, give them room to breathe, and make sure the animations feel playful not jarring.

5. **Mobile first**: The grid is 2 columns on mobile, 3 on desktop. Cards must be finger-friendly (min 140px wide).

6. **No `console.error` suppression, no mock data beyond what's in `characters/index.js`.**

7. **The `StoryScreen` "Begin the Story!" button** should call an `onBegin` prop when clicked (even if it's not provided yet), with a graceful no-op if the prop is undefined. This is where the WebSocket connection will be initiated later.

8. The overall visual feeling should be: **a magical pop-up book, not a mobile app**. Lush, colorful, warm. Like Pixar meets a children's picture book. Think soft gradients, rounded everything, big playful fonts, emoji characters that feel alive.
