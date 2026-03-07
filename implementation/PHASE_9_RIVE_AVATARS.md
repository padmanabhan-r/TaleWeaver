# Phase 9 — Rive Animated Avatars (Lip-sync) ❌ DROPPED

> **Dropped** — requires Rive asset creation for all 10 characters (designer work). Too much effort. Framer Motion states are sufficient.


Replace the current PNG + Framer Motion portraits with Rive state machine animations that lip-sync to real-time audio amplitude.

---

## Current State

Framer Motion covers all 4 character states well:
- `idle`: slow breathing scale (4s, easeInOut)
- `thinking`: side-to-side sway + floating 💭 bubble
- `speaking`: fast scale pulse (0.45s) + 3 expanding sound-wave rings
- `listening`: gentle vertical bob (2.5s, cyan border)

This is good enough for v1. Rive is the next visual level — mouth moves with the voice.

---

## Target

```
characterState = "speaking"
  → Rive: activate "speaking" state → mouth animates to audio amplitude
characterState = "listening"
  → Rive: activate "listening" state → character leans forward, eyes wide
characterState = "thinking"
  → Rive: activate "thinking" state → head tilts, thought bubble
characterState = "idle"
  → Rive: activate "idle" state → breathing, subtle blink
```

Audio amplitude from `AudioVisualizer` drives mouth animation intensity in real time.

---

## Implementation Plan

### 1. Create Rive Assets
- One `.riv` file per character (10 total)
- State machine with 4 states: `idle`, `thinking`, `speaking`, `listening`
- `speaking` state: mouth bone/shape driven by a `amplitude` number input (0.0 → 1.0)
- Each character has distinct personality in animation (Draco bounces more, Rishi is calmer)

### 2. Install Rive React Runtime
```bash
npm install @rive-app/react-canvas
```

### 3. Replace Portrait in StoryScreen.tsx
```tsx
import { useRive, useStateMachineInput } from "@rive-app/react-canvas";

const { rive, RiveComponent } = useRive({
  src: `/characters/${characterId}.riv`,
  stateMachines: "CharacterSM",
  autoplay: true,
});

const amplitudeInput = useStateMachineInput(rive, "CharacterSM", "amplitude");
const stateInput = useStateMachineInput(rive, "CharacterSM", "state");

// Wire characterState
useEffect(() => {
  stateInput?.change(stateToIndex[characterState]);
}, [characterState]);

// Wire audio amplitude
useEffect(() => {
  if (amplitudeInput) amplitudeInput.value = currentAmplitude;
}, [currentAmplitude]);
```

### 4. Expose Amplitude from AudioVisualizer
`AudioVisualizer` already computes RMS amplitude — expose it via a callback or ref so `StoryScreen` can pass it to Rive.

### 5. Fallback
If `.riv` fails to load, fall back to existing PNG + Framer Motion portrait.

---

## Effort vs Impact

| | |
|---|---|
| **Effort** | Very High — Rive asset creation for all 10 characters requires a designer or significant tooling |
| **Impact** | Very High — transforms from "nice animations" to "living, breathing character" |
| **Prerequisite** | Rive assets (`.riv` files) for all 10 characters |

---

## Files to Change
- `frontend/src/screens/StoryScreen.tsx` — swap PNG `<img>` for `<RiveComponent>`, wire amplitude + state
- `frontend/src/components/AudioVisualizer.tsx` — expose amplitude via callback/ref
- `frontend/public/characters/` — add 10 `.riv` files
- `package.json` — add `@rive-app/react-canvas`
