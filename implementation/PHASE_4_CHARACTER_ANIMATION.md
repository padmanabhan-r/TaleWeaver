# Phase 4 — Character UI & Story Screen

## Status: ✅ DONE (core UI) / ⬜ TODO (avatar animations)

---

## What Was Built

### Story Screen (`frontend/src/screens/StoryScreen.tsx`)
- Full-screen layout: character portrait (left) + scene grid (right)
- Character portrait panel shows `CharacterPortrait` SVG + character name + state label
- State label tracks `characterState`: idle / thinking / speaking / listening
- "Begin the Story!" button triggers `useLiveAPI.connect()`
- "End Story" button disconnects and returns to character select
- Integrates `useLiveAPI` + `useStoryImages` hooks
- `AudioVisualizer` shows real-time waveform amplitude
- Session end state: shows ended message

### Character Portraits (`frontend/src/components/CharacterPortrait.tsx`)
14 inline SVG portraits, each hand-crafted:

| Character | Design |
|---|---|
| Grandma Rose | Elderly woman, pink/rose tones, silver hair, warm smile |
| Captain Leo | Sea captain, navy uniform, gold buttons, captain's hat |
| Fairy Sparkle | Fairy with wings, purple tones, wand with star |
| Professor Whiz | Professor with round glasses, green tones, graduation cap |
| Dragon Blaze | Orange/red friendly dragon, big eyes, small wings |
| Paati | Tamil grandmother, pink sari, bindi, flower in hair |
| Dadi | Hindi grandmother, blue sari, gold jewelry, warm smile |
| Ammamma | Telugu grandmother, red/gold sari, bindi, traditional |
| Aaji | Marathi grandmother, green sari, nauvari style hint |
| Dida | Bengali grandmother, white sari with blue border, bun |
| Count Cosmo | Friendly astronaut, helmet with star, floating numbers |
| Dr. Luna | Scientist, lab coat, magnifying glass, flowers |
| Professor Pip | Owl in graduation cap, round glasses, book in wing |
| Arty | Colorful artist character with paint palette |

All portraits are static (no animation). Switch statement in `CharacterPortrait` maps `character.id` to the correct SVG component.

### Audio Visualizer (`frontend/src/components/AudioVisualizer.tsx`)
- Real-time amplitude waveform using Web Audio API `AnalyserNode`
- Attaches to both capture and playback AudioContexts
- Draws animated bars reflecting live audio levels

### Screen Transitions
- Character selection: fade-out CSS animation on card click
- Story screen mount: fade-in CSS animation
- CSS classes: `animate-fade-out`, `animate-fade-in` (defined in Tailwind config)

### CSS Animations (`frontend/index.css` / Tailwind config)
- `cloud-drift`, `cloud-drift-slow` — floating clouds on landing page
- `card-shimmer` — loading skeleton for scene cards
- `fade-in`, `fade-out` — screen transitions
- `pulse-ring` — gold selection ring on character cards

---

## What Was NOT Built (from original plan)

| Planned | Status |
|---|---|
| Lottie/Rive animated avatars (breathing, blinking) | ⬜ Not done — static SVGs only |
| Lip-sync mouth animation tied to audio amplitude | ⬜ Not done |
| Character wave animation on hover | ⬜ Not done |
| "Thinking" head-tilt animation | ⬜ Not done |
| "Listening" lean-forward + ear glow effect | ⬜ Not done |
| Character slides from card to story screen position | ⬜ Not done (fade only) |

---

## What Remains for Full Vision

- Replace static SVGs with Rive state machines: idle → speaking → listening → thinking
- Tie mouth/body animation to real-time audio amplitude from `AudioVisualizer`
- Hover animations on character cards (wave, bounce)
