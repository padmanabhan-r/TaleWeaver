# Phase 4 — Character Animation & UI

## Goal
The character avatar is the soul of TaleWeaver. It should feel like a living being:
- Breathing and blinking when idle
- Moving its mouth when speaking (lip-sync)
- Leaning forward and glowing when listening
- Looking thoughtful when processing

The UI should feel like a magical storybook, not an app.

---

## Story Screen Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                    TaleWeaver ✨                                 │
│                (header — subtle, not dominant)                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌──────────────────────────┐   ┌───────────────────────────┐ │
│   │                          │   │                           │ │
│   │                          │   │   STORY SCENES            │ │
│   │    CHARACTER AVATAR      │   │                           │ │
│   │                          │   │  ┌────────┐  ┌────────┐  │ │
│   │    [animated SVG /       │   │  │ Scene  │  │ Scene  │  │ │
│   │     Lottie]              │   │  │   1    │  │   2    │  │ │
│   │                          │   │  └────────┘  └────────┘  │ │
│   │  State ring:             │   │                           │ │
│   │  🟡 speaking             │   │  ┌────────┐  ┌────────┐  │ │
│   │  🔵 listening            │   │  │ Scene  │  │ ✨     │  │ │
│   │  ⚪ idle                 │   │  │   3    │  │drawing │  │ │
│   │                          │   │  └────────┘  └────────┘  │ │
│   └──────────────────────────┘   └───────────────────────────┘ │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  [optional subtitle — what the character is saying]     │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  [End Story]                          [Change Character] │  │
│   └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Character State Ring

The ring around the character avatar communicates state visually:

| State | Ring Style | Animation |
|---|---|---|
| `idle` | Gray, thin, no pulse | Static |
| `thinking` | Blue, dotted, rotating | Spin 2s infinite |
| `speaking` | Yellow/gold, solid | Pulse with audio level |
| `listening` | Soft blue, glowing | Gentle pulse 1.5s |
| `excited` | Rainbow gradient | Fast rainbow cycle |

```css
/* State ring animations */
.state-ring-speaking {
  box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.7);
  animation: ring-pulse-speaking 0.8s ease infinite;
}

@keyframes ring-pulse-speaking {
  0%   { box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.7); }
  70%  { box-shadow: 0 0 0 15px rgba(251, 191, 36, 0); }
  100% { box-shadow: 0 0 0 0 rgba(251, 191, 36, 0); }
}

.state-ring-listening {
  box-shadow: 0 0 0 8px rgba(96, 165, 250, 0.3);
  animation: ring-glow-listening 1.5s ease-in-out infinite alternate;
}

@keyframes ring-glow-listening {
  from { box-shadow: 0 0 0 5px rgba(96, 165, 250, 0.2); }
  to   { box-shadow: 0 0 0 20px rgba(96, 165, 250, 0.5); }
}

.state-ring-thinking {
  border: 4px dotted #93C5FD;
  animation: ring-spin 2s linear infinite;
}

@keyframes ring-spin {
  to { transform: rotate(360deg); }
}
```

---

## Character Avatar Component

### Option A: CSS-Animated SVG (MVP approach)

Each character is a custom SVG with named groups for animated parts:
- `#body` — gentle sway
- `#head` — slight bob
- `#mouth` — morphs between closed/open shapes
- `#eyes` — blink keyframes
- `#arms` — wave and gesture animations

```jsx
// frontend/src/components/CharacterAvatar.jsx

import { useMemo } from "react";
import GrandmaRoseSVG from "../characters/grandma-rose/avatar.svg?react";
import CaptainLeoSVG from "../characters/captain-leo/avatar.svg?react";
import FairySparkleSVG from "../characters/fairy-sparkle/avatar.svg?react";
import ProfessorWhizSVG from "../characters/professor-whiz/avatar.svg?react";
import DragonBlazeSVG from "../characters/dragon-blaze/avatar.svg?react";

const AVATAR_MAP = {
  "grandma-rose": GrandmaRoseSVG,
  "captain-leo": CaptainLeoSVG,
  "fairy-sparkle": FairySparkleSVG,
  "professor-whiz": ProfessorWhizSVG,
  "dragon-blaze": DragonBlazeSVG,
};

const STATE_CLASSES = {
  idle:      "character-idle",
  speaking:  "character-speaking",
  listening: "character-listening",
  thinking:  "character-thinking",
  excited:   "character-excited",
  wave:      "character-wave",
};

export function CharacterAvatar({ characterId, state = "idle", size = 200 }) {
  const AvatarSVG = AVATAR_MAP[characterId];

  if (!AvatarSVG) {
    return <FallbackAvatar characterId={characterId} state={state} size={size} />;
  }

  return (
    <div
      className={`character-avatar-wrapper ${STATE_CLASSES[state] || "character-idle"}`}
      style={{ width: size, height: size }}
    >
      {/* State ring */}
      <div className={`state-ring state-ring-${state}`} />

      {/* Avatar SVG */}
      <AvatarSVG
        className="w-full h-full"
        aria-label={`${characterId} character`}
      />

      {/* Speaking particle effects */}
      {state === "speaking" && <SpeakingParticles />}

      {/* Listening sparkle effect */}
      {state === "listening" && <ListeningSparkle />}
    </div>
  );
}

// Fallback: Emoji-based character if SVG not available
function FallbackAvatar({ characterId, state, size }) {
  const EMOJI = {
    "grandma-rose": "👵",
    "captain-leo": "🧑‍✈️",
    "fairy-sparkle": "🧚",
    "professor-whiz": "🧑‍🔬",
    "dragon-blaze": "🐲",
  };
  const emoji = EMOJI[characterId] || "🌟";

  return (
    <div
      className={`fallback-avatar ${STATE_CLASSES[state]}`}
      style={{ fontSize: size * 0.7, width: size, height: size }}
    >
      {emoji}
    </div>
  );
}

// Musical note / sound wave particles when speaking
function SpeakingParticles() {
  return (
    <div className="speaking-particles">
      {["♪", "♫", "♬", "🎵"].map((note, i) => (
        <span
          key={i}
          className="particle"
          style={{ animationDelay: `${i * 0.3}s` }}
        >
          {note}
        </span>
      ))}
    </div>
  );
}

// Sparkle dots when listening
function ListeningSparkle() {
  return (
    <div className="listening-sparkle">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="sparkle-dot"
          style={{ animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </div>
  );
}
```

### Option B: Lottie Animations (Higher fidelity)

```jsx
// If using @lottiefiles/react-lottie-player
import { Player } from "@lottiefiles/react-lottie-player";
import idleAnim from "../characters/grandma-rose/idle.json";
import speakingAnim from "../characters/grandma-rose/speaking.json";

const ANIMATIONS = {
  idle: idleAnim,
  speaking: speakingAnim,
  listening: listeningAnim,
  thinking: thinkingAnim,
};

export function LottieCharacterAvatar({ characterId, state }) {
  const anim = ANIMATIONS[state] || ANIMATIONS.idle;

  return (
    <Player
      autoplay
      loop
      src={anim}
      style={{ height: "300px", width: "300px" }}
    />
  );
}
```

---

## Mouth Animation (Lip-Sync Approximation)

True phoneme-based lip-sync is complex. We use a simpler, effective approach:

### Audio-Level Based Mouth Movement

The playback worklet posts audio level data back to the main thread:

```javascript
// Addition to playback.worklet.js
process(inputs, outputs) {
  // ... (existing playback logic)

  // Calculate RMS level for mouth animation
  if (this._isPlaying) {
    let sum = 0;
    for (let i = 0; i < output.length; i++) {
      sum += output[i] * output[i];
    }
    const rms = Math.sqrt(sum / output.length);
    // Post level every 50ms to avoid flooding main thread
    if (this._frameCount++ % 3 === 0) {
      this.port.postMessage({ type: "level", value: rms });
    }
  }

  return true;
}
```

In the React component, use this level to drive mouth openness:

```javascript
// In useAudioPlayback.js, add:
const [audioLevel, setAudioLevel] = useState(0);

// In workletNode.port.onmessage:
if (event.data.type === "level") {
  setAudioLevel(event.data.value);
}

// Map level (0-1) to mouth open height (0-30px)
const mouthOpenPx = Math.min(30, audioLevel * 200);
```

In SVG, the mouth is a simple rectangle whose height changes:

```svg
<!-- In character SVG, mouth element: -->
<rect
  id="mouth"
  x="80" y="140"
  width="40"
  height="[controlled by React]"
  rx="10"
  fill="#CC5555"
/>
```

This gives a convincing "talking" effect without true phoneme sync.

---

## Subtitle/Transcript Display

An optional subtitle bar shows what the character is saying in real-time:

```jsx
// frontend/src/components/Subtitle.jsx

export function Subtitle({ text, isCharacterSpeaking, isChildSpeaking }) {
  if (!text) return null;

  return (
    <div className={`
      subtitle-bar rounded-2xl px-6 py-3 mx-4
      transition-all duration-300
      ${isCharacterSpeaking
        ? "bg-white/90 text-gray-800"
        : isChildSpeaking
          ? "bg-blue-100/90 text-blue-800"
          : "opacity-0"
      }
    `}>
      {isChildSpeaking && (
        <span className="text-blue-500 mr-2">You: </span>
      )}
      <span className="font-comic-neue text-lg leading-relaxed">
        {text}
      </span>

      {/* Typing cursor when streaming */}
      {isCharacterSpeaking && (
        <span className="typing-cursor">|</span>
      )}
    </div>
  );
}
```

---

## Full Story Screen Component

```jsx
// frontend/src/screens/StoryScreen.jsx

import { useState, useCallback, useRef } from "react";
import { CharacterAvatar } from "../components/CharacterAvatar";
import { StorySceneGrid } from "../components/StorySceneGrid";
import { Subtitle } from "../components/Subtitle";
import { useLiveAPI } from "../hooks/useLiveAPI";
import { useStoryImages } from "../hooks/useStoryImages";

export function StoryScreen({ character, onExit }) {
  const [begun, setBegan] = useState(false);
  const [subtitleText, setSubtitleText] = useState("");
  const [childSpeaking, setChildSpeaking] = useState(false);
  const sessionIdRef = useRef(`session-${Date.now()}`);

  const { scenes, triggerImageGeneration } = useStoryImages();

  const handleImageTrigger = useCallback((transcriptionText) => {
    triggerImageGeneration(
      transcriptionText,
      character.imageStyle,
      sessionIdRef.current
    );
  }, [character.imageStyle, triggerImageGeneration]);

  const handleTranscription = useCallback(({ type, text }) => {
    setSubtitleText(text);
    setChildSpeaking(type === "child");
    // Clear subtitle after a delay
    setTimeout(() => setSubtitleText(""), 4000);
  }, []);

  const {
    connect,
    disconnect,
    sessionState,
    characterState,
  } = useLiveAPI({
    character,
    onImageTrigger: handleImageTrigger,
    onTranscription: handleTranscription,
  });

  const handleBegin = async () => {
    setBegan(true);
    await connect();
  };

  const handleEnd = () => {
    disconnect();
    onExit();
  };

  // PRE-START screen
  if (!begun) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-200 to-purple-300
                      flex flex-col items-center justify-center gap-8 p-8">
        <CharacterAvatar
          characterId={character.avatar}
          state="wave"
          size={250}
        />
        <h2 className="font-bangers text-5xl text-purple-900 text-center
                       drop-shadow-lg">
          {character.name} is ready!
        </h2>
        <p className="font-comic-neue text-xl text-purple-700 text-center max-w-md">
          Tap the button and start talking — just tell {character.name.split(" ")[0]}
          what kind of story you want!
        </p>
        <button
          onClick={handleBegin}
          className="bg-yellow-400 hover:bg-yellow-500 active:scale-95
                     text-gray-900 font-bangers text-4xl
                     px-12 py-5 rounded-full shadow-xl
                     transform hover:scale-105 transition-all
                     border-4 border-yellow-600"
        >
          Begin the Story!
        </button>
      </div>
    );
  }

  // MAIN STORY SCREEN
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 to-purple-200
                    flex flex-col">
      {/* Header */}
      <header className="text-center py-3 px-4">
        <h1 className="font-bangers text-3xl text-purple-800 drop-shadow">
          TaleWeaver ✨
        </h1>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col md:flex-row gap-6 p-4">
        {/* Left: Character panel */}
        <div className="flex flex-col items-center gap-4 md:w-[40%]">
          <CharacterAvatar
            characterId={character.avatar}
            state={characterState}
            size={240}
          />

          {/* Session state indicator */}
          <div className="text-center">
            <p className="font-comic-neue text-lg text-purple-700">
              {characterState === "speaking" && `${character.name.split(" ")[0]} is telling the story...`}
              {characterState === "listening" && "Your turn to speak!"}
              {characterState === "thinking" && "Getting ready..."}
              {characterState === "idle" && character.name}
            </p>
          </div>
        </div>

        {/* Right: Story scenes */}
        <div className="flex-1 flex flex-col gap-4 md:w-[60%]">
          {scenes.length > 0 ? (
            <StorySceneGrid scenes={scenes} />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-purple-400">
                <p className="text-6xl mb-4">📖</p>
                <p className="font-comic-neue text-xl">
                  Story pictures will appear here...
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Subtitle bar */}
      <Subtitle
        text={subtitleText}
        isCharacterSpeaking={characterState === "speaking"}
        isChildSpeaking={childSpeaking}
      />

      {/* Bottom controls */}
      <footer className="flex justify-between items-center p-4">
        <button
          onClick={handleEnd}
          className="font-comic-neue text-lg text-red-500 hover:text-red-700
                     bg-white/70 rounded-full px-6 py-2 shadow
                     hover:shadow-lg transition-all"
        >
          End Story
        </button>

        <div className="flex items-center gap-2">
          {/* Mic indicator */}
          <div className={`
            w-4 h-4 rounded-full
            ${characterState === "listening"
              ? "bg-green-500 animate-pulse"
              : "bg-gray-300"
            }
          `} />
          <span className="font-comic-neue text-sm text-gray-600">
            {characterState === "listening" ? "Listening" : ""}
          </span>
        </div>

        <button
          onClick={onExit}
          className="font-comic-neue text-lg text-purple-600 hover:text-purple-800
                     bg-white/70 rounded-full px-6 py-2 shadow
                     hover:shadow-lg transition-all"
        >
          Change Storyteller
        </button>
      </footer>
    </div>
  );
}
```

---

## Character Avatar SVG Specification

Each character SVG must have these IDs for JavaScript-driven animation:

```
#character-root    — root group, transform for whole-body bob
#head              — head group
#mouth             — mouth element (animated for speaking)
#left-eye          — left eye (blink)
#right-eye         — right eye (blink)
#body              — body group
#left-arm          — left arm (wave)
#right-arm         — right arm (gesture)
#accessories       — optional items (hat, wand, etc.)
```

### Grandma Rose SVG (placeholder sketch)
- Oval face, warm colors, soft white hair bun, reading glasses, knitting needles
- Seated in an armchair silhouette
- Cozy shawl, book in lap

### Captain Leo SVG (placeholder sketch)
- Strong jaw, confident smile, captain's hat, naval jacket
- Standing proud, telescope in hand
- Ship wheel in background element

### Fairy Sparkle SVG (placeholder sketch)
- Pointed ears, sparkly wings, star-tipped wand
- Floating slightly off ground
- Sparkle trails in background

### Professor Whiz SVG (placeholder sketch)
- Round glasses, wild hair, lab coat, bowtie
- Pointing at a chalkboard element
- Gear and test tube accessories

### Dragon Blaze SVG (placeholder sketch)
- Round friendly dragon face, big eyes
- Stubby wings, small friendly claws
- Little puff of (colorful, non-scary) smoke

---

## CSS Variables per Character

```css
/* Applied to body when character is selected */
[data-character="grandma-rose"] {
  --char-primary: #FF69B4;
  --char-bg: linear-gradient(to bottom, #FFF0F5, #FFE4EE);
  --char-ring: #FF69B4;
}

[data-character="captain-leo"] {
  --char-primary: #2563EB;
  --char-bg: linear-gradient(to bottom, #EFF6FF, #DBEAFE);
  --char-ring: #60A5FA;
}

[data-character="fairy-sparkle"] {
  --char-primary: #A855F7;
  --char-bg: linear-gradient(to bottom, #FAF5FF, #EDE9FE);
  --char-ring: #C084FC;
}

[data-character="professor-whiz"] {
  --char-primary: #10B981;
  --char-bg: linear-gradient(to bottom, #F0FDF4, #DCFCE7);
  --char-ring: #34D399;
}

[data-character="dragon-blaze"] {
  --char-primary: #F97316;
  --char-bg: linear-gradient(to bottom, #FFF7ED, #FED7AA);
  --char-ring: #FB923C;
}
```

---

## Definition of Done

- [ ] All 5 characters have avatar components (SVG or fallback emoji)
- [ ] `idle` state: gentle breathing/bob animation
- [ ] `speaking` state: mouth opens/closes, state ring pulses gold
- [ ] `listening` state: leaning forward, ring glows blue, mic indicator active
- [ ] `thinking` state: spinning dotted ring
- [ ] State transitions are smooth (CSS transitions, no flash)
- [ ] Character name and state text visible below avatar
- [ ] Subtitle bar shows character/child text with appropriate styling
- [ ] "Begin Story" pre-start screen works correctly
- [ ] "End Story" and "Change Storyteller" buttons work
- [ ] Full screen is responsive (mobile + desktop)
- [ ] Background color/gradient changes per character (CSS vars)
- [ ] No layout shift when scene images appear
