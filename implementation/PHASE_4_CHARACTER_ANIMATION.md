# Phase 4 — Character UI & Story Screen

## Status: ✅ DONE (Framer Motion per-state animations) / ⬜ DEFERRED (Rive lip-sync)

---

## What Was Built

### Story Screen (`frontend/src/screens/StoryScreen.tsx`)
- Full-screen layout: 1/5 character portrait panel (left) + 4/5 scene canvas (right)
- Animated portrait with per-`characterState` Framer Motion animations
- "Begin the Story!" button triggers `useLiveAPI.connect()`
- "End Story" button disconnects and returns to theme select
- Theme chip in header showing emoji + theme name when a theme is active
- Camera toggle button + mirrored video preview (Phase 7.1)
- Integrates `useLiveAPI` + `useStoryImages` hooks
- `AudioVisualizer` shows real-time waveform amplitude (mic + playback)
- Speaking indicator bars (5-bar animated EQ) below portrait when speaking

### Per-State Portrait Animations (Framer Motion)

All animations are fully implemented using existing PNG portraits + Framer Motion v12.

| State | Portrait motion | Border colour | Extra visual |
|---|---|---|---|
| `idle` | Slow breathing scale (4s, easeInOut) | `border-primary/40` (gold) | — |
| `thinking` | Side-to-side sway `[0, 3°, -3°, 3°, -3°, 0]` (2s) | `border-violet-400/60` | Floating 💭 bubble (−top−right, bobs up) |
| `speaking` | Fast scale pulse (0.45s) | `border-primary` (gold full) | 3 expanding sound-wave rings (staggered delay) |
| `listening` | Gentle vertical bob `y: [0, -5, 0]` (2.5s) | `border-cyan-400/70` | — |

**Key implementation detail:** `key={characterState}` on the portrait `motion.div` forces a clean
Framer Motion remount on every state change — prevents jerky mid-animation jumps. Combined with
`initial={{ scale: 1, rotate: 0, y: 0 }}` to ensure neutral start position.

Config tables in `StoryScreen.tsx`:
```tsx
const PORTRAIT_ANIMATE: Record<CharacterState, object> = {
  idle:      { scale: [1, 1.018, 1] },
  thinking:  { rotate: [0, 3, -3, 3, -3, 0] },
  speaking:  { scale: [1, 1.06, 1] },
  listening: { y: [0, -5, 0] },
};

const PORTRAIT_TRANSITION: Record<CharacterState, object> = {
  idle:      { duration: 4,    repeat: Infinity, ease: "easeInOut" },
  thinking:  { duration: 2,    repeat: Infinity, ease: "easeInOut" },
  speaking:  { duration: 0.45, repeat: Infinity, ease: "easeInOut" },
  listening: { duration: 2.5,  repeat: Infinity, ease: "easeInOut" },
};
```

### CSS State Classes (`frontend/src/index.css`)
- `state-idle`: subtle static glow
- `state-thinking`: `thinking-pulse` keyframe — violet glow ring 0→12px expanding
- `state-speaking`: gold glow
- `state-listening`: cyan glow

### Audio Visualizer (`frontend/src/components/AudioVisualizer.tsx`)
- Real-time amplitude waveform using Web Audio API `AnalyserNode`
- Attaches to both capture and playback AudioContexts
- Draws animated bars reflecting live audio levels

### Screen Transitions
- Character selection: fade-out CSS animation on card click
- Story screen mount: fade-in CSS animation
- CSS classes: `animate-fade-out`, `animate-fade-in` (defined in Tailwind config)

---

## What Was NOT Built (Deferred to Stretch Goal 10)

| Planned | Status |
|---|---|
| Rive/Lottie animated avatars (breathing, blinking state machines) | ⬜ Deferred — Framer Motion covers the use case sufficiently |
| Lip-sync mouth animation tied to audio amplitude in real time | ⬜ Deferred |
| Character wave animation on hover (character select cards) | ⬜ Not done |
| Character slides from card to story screen position | ⬜ Not done (fade only) |

---

## What Remains for Full Vision

- **Rive state machine avatars** (Stretch Goal 10): Replace PNGs with Rive files wired to
  `characterState`. Mouth animation intensity driven by `AudioVisualizer` amplitude.
  This is the highest visual-impact remaining upgrade but requires creating Rive assets for all 10 characters.
