# Lovable Prompt V2 — Character Art Redesign

> Paste everything below the horizontal rule directly into Lovable.

---

## PROMPT

Redesign the TaleWeaver character selection and story screens. The current design uses emoji as character avatars — replace them with proper illustrated character portraits that you design. Make it beautiful for children aged 4–10.

---

### Characters — Who They Are

Design each character however you think best expresses their personality:

**Grandma Rose** — Warm, cozy, loving grandmother. Bedtime stories and fairy tales. Safety and softness.

**Captain Leo** — Bold, adventurous sea captain. Treasure hunts and brave heroes. Excitement and confidence.

**Fairy Sparkle** — Whimsical, magical fairy. Enchantment and wonder. Light and sparkle.

**Professor Whiz** — Curious, joyfully absent-minded professor. Science and invention. Discovery and delight.

**Dragon Blaze** — Huge, friendly, enthusiastic dragon. Silly adventures and comedy. Big energy, bigger heart.

Their color palettes are already in `src/characters/index.ts` — use `cardGradient`, `accentColor`, `bgColor`, and `textColor` from each character object. Do not change that file.

---

### What to Remove

- All emoji used as character avatars
- All emoji used as background decoration (the floating ⭐ ✨ 🌟)
- The `📖` emoji placeholder in StoryScreen's right panel

---

### What to Keep (Technical Constraints)

Do not change any of these — the backend will wire into them:

- `src/characters/index.ts` — untouched
- `src/App.tsx` — untouched
- The `onSelect(character)` callback in CharacterSelect
- The `character`, `onBack`, `onBegin` props in StoryScreen
- The `isConnecting` state and spinner on the Begin button
- The `state-idle` CSS class on the avatar wrapper in StoryScreen
- All existing keyframe animation class names in `index.css` — add new ones, remove none
- `tailwind.config.ts` — untouched

---

### Everything Else

Design it however you want. The goal is: a child sees this screen and their face lights up.
