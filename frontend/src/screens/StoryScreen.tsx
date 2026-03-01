import React, { useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Character } from "@/characters";
import StorybookEmpty from "@/components/StorybookEmpty";
import { StorySceneGrid } from "@/components/StorySceneGrid";
import { AudioVisualizer } from "@/components/AudioVisualizer";
import { useLiveAPI, CharacterState, ChoiceRequest, BadgeAward } from "@/hooks/useLiveAPI";
import { useStoryImages, StoryScene } from "@/hooks/useStoryImages";
import FloatingElements from "@/components/FloatingElements";
import ChoiceOverlay from "@/components/ChoiceOverlay";
import BadgePopup from "@/components/BadgePopup";

const THEMES_EMOJI: Record<string, string> = {
  Animals: "🦁", Space: "🚀", Kingdoms: "🏰", Ocean: "🌊", Food: "🍕",
  Jungle: "🌳", Magic: "🦄", Robots: "🤖", Spooky: "🎃", Adventure: "🏔️",
  Circus: "🎪", Dinosaurs: "🦕",
  Sharing: "🤝", Courage: "💪", Gratitude: "🙏", Creativity: "🎨", Kindness: "🌍",
};

// ── localStorage gallery ──────────────────────────────────────────────────────

export interface StoryGalleryEntry {
  id: string;
  characterId: string;
  characterName: string;
  characterImage: string;
  title: string;
  images: { imageData: string; mimeType: string }[];
  timestamp: number;
}

function saveToGallery(
  sessionId: string,
  character: Character,
  scenes: StoryScene[],
  storyFirstLine: string,
) {
  const images = scenes
    .filter((s) => s.status === "loaded" && s.imageData)
    .map((s) => ({ imageData: s.imageData!, mimeType: s.mimeType! }));

  if (images.length === 0) return;

  const title = storyFirstLine
    ? storyFirstLine.split(" ").slice(0, 7).join(" ") + "…"
    : `A story with ${character.name}`;

  const entry: StoryGalleryEntry = {
    id: sessionId,
    characterId: character.id,
    characterName: character.name,
    characterImage: character.image,
    title,
    images,
    timestamp: Date.now(),
  };

  try {
    const existing: StoryGalleryEntry[] = JSON.parse(
      localStorage.getItem("taleweaver_gallery") ?? "[]"
    );
    const updated = [entry, ...existing.filter((e) => e.id !== entry.id)].slice(0, 20);
    localStorage.setItem("taleweaver_gallery", JSON.stringify(updated));
  } catch {
    // localStorage unavailable — ignore
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  character: Character;
  theme?: string;
  propImage?: string;
  onBack: () => void;
}

const AVATAR_STATE_CLASS: Record<CharacterState, string> = {
  idle:      "state-idle",
  thinking:  "state-thinking",
  speaking:  "state-speaking",
  listening: "state-listening",
};

const BORDER_CLASS: Record<CharacterState, string> = {
  idle:      "border-primary/40",
  thinking:  "border-violet-400/60",
  speaking:  "border-primary",
  listening: "border-cyan-400/70",
};

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

const STATUS_TEXT: Record<string, string> = {
  idle: "Ready to tell a story!",
  connecting: "Waking up the storyteller...",
  ready: "Almost ready — take a deep breath!",
  active_idle: "...",
  active_thinking: "Hmm, thinking of something wonderful...",
  active_speaking: "Telling the story...",
  active_listening: "I'm listening!",
  error: "Oops! Something went wrong. Try again!",
  ended: "The end! That was a great story!",
};

const StoryScreen = ({ character, theme, propImage, onBack }: Props) => {
  const sessionIdRef = useRef<string>(crypto.randomUUID());
  const [intervalSeconds, setIntervalSeconds] = useState(8);

  // Choice overlay state
  const [activeChoice, setActiveChoice] = useState<ChoiceRequest | null>(null);
  // Badge popup state (queue: show one at a time)
  const [activeBadge, setActiveBadge] = useState<BadgeAward | null>(null);
  const badgeQueueRef = useRef<BadgeAward[]>([]);

  // Capture first story line for gallery title
  const storyFirstLineRef = useRef("");

  const { scenes, triggerImageGeneration, stop: stopImages } = useStoryImages(
    character.imageStyle,
    sessionIdRef.current,
    intervalSeconds
  );
  // Keep a stable ref to scenes for saving on end (state snapshot)
  const scenesRef = useRef<StoryScene[]>(scenes);
  scenesRef.current = scenes;

  const handleChoiceRequest = useCallback((choice: ChoiceRequest) => {
    setActiveChoice(choice);
  }, []);

  const handleChildSpoke = useCallback(() => {
    setActiveChoice(null);
  }, []);

  const handleBadgeAwarded = useCallback((badge: BadgeAward) => {
    badgeQueueRef.current.push(badge);
    // Only show if nothing is currently displayed
    setActiveBadge((prev) => prev ?? badgeQueueRef.current.shift() ?? null);
  }, []);

  const handleBadgeDismiss = useCallback(() => {
    const next = badgeQueueRef.current.shift() ?? null;
    setActiveBadge(next);
  }, []);

  const {
    connect, disconnect, answerChoice, sessionState, characterState, isCapturing,
    captureCtxRef, captureSourceRef, playbackCtxRef, playbackGainRef,
    cameraEnabled, toggleCamera, cameraVideoRef,
  } = useLiveAPI({
    character,
    theme,
    propImage,
    onImageTrigger: triggerImageGeneration,
    onTranscription: (msg) => {
      if (msg.type === "character" && !storyFirstLineRef.current) {
        storyFirstLineRef.current = msg.text;
      }
    },
    onChoiceRequest: handleChoiceRequest,
    onBadgeAwarded: handleBadgeAwarded,
    onChildSpoke: handleChildSpoke,
  });

  const handleChoice = useCallback(
    (option: string) => {
      if (!activeChoice) return;
      answerChoice(activeChoice.callId, option);
      setActiveChoice(null);
    },
    [activeChoice, answerChoice]
  );

  const endAndSave = useCallback(() => {
    saveToGallery(sessionIdRef.current, character, scenesRef.current, storyFirstLineRef.current);
    stopImages();
    disconnect();
  }, [character, disconnect, stopImages]);

  const handleBack = () => {
    saveToGallery(sessionIdRef.current, character, scenesRef.current, storyFirstLineRef.current);
    stopImages();
    disconnect();
    onBack();
  };

  const avatarStateClass = AVATAR_STATE_CLASS[characterState];
  const isConnecting = sessionState === "connecting" || sessionState === "ready";
  const isActive = sessionState === "active";
  const statusKey = isActive ? `active_${characterState}` : sessionState;
  const statusText = STATUS_TEXT[statusKey] ?? "";

  return (
    <div className="relative min-h-screen bg-sky-gradient overflow-hidden">
      <FloatingElements />

      {/* Badge popup — rendered at fixed position, above everything */}
      <AnimatePresence>
        {activeBadge && (
          <BadgePopup badge={activeBadge} onDismiss={handleBadgeDismiss} />
        )}
      </AnimatePresence>

      <div className="relative z-10 h-screen flex flex-col">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between px-4 sm:px-8 py-4 border-b border-border/30"
        >
          <button
            onClick={handleBack}
            className="text-muted-foreground hover:text-foreground font-body transition-colors"
          >
            ← Change Storyteller
          </button>
          <h1 className="font-display text-lg sm:text-xl font-bold text-primary">TaleWeaver</h1>
          <div className="flex justify-end flex-shrink-0">
            {theme && theme !== "camera_prop" && theme !== "sketch" && (
              <span className="whitespace-nowrap px-3 py-1 rounded-full bg-primary/20 border border-primary/30 font-body text-xs text-primary">
                {THEMES_EMOJI[theme] ?? "💭"} {theme}
              </span>
            )}
            {theme === "camera_prop" && (
              <span className="whitespace-nowrap px-3 py-1 rounded-full bg-primary/20 border border-primary/30 font-body text-xs text-primary">
                📸 Prop story
              </span>
            )}
            {theme === "sketch" && (
              <span className="whitespace-nowrap px-3 py-1 rounded-full bg-primary/20 border border-primary/30 font-body text-xs text-primary">
                ✏️ Sketch story
              </span>
            )}
          </div>
        </motion.header>

        {/* Main content */}
        <div className="flex-1 flex flex-col md:flex-row gap-4 p-4 sm:p-6 overflow-hidden">
          {/* Left — character panel */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col items-center justify-center md:w-1/5 gap-5"
          >
            {/* Avatar */}
            <div className="relative flex items-center justify-center">

              {/* Sound wave rings — speaking only */}
              {characterState === "speaking" && [0, 0.4, 0.8].map((delay, i) => (
                <motion.div
                  key={i}
                  className="absolute inset-0 rounded-full border-2 border-primary/50"
                  animate={{ scale: [1, 1.75], opacity: [0.6, 0] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay, ease: "easeOut" }}
                />
              ))}

              {/* Thinking bubble — thinking only */}
              {characterState === "thinking" && (
                <motion.div
                  className="absolute -top-2 -right-2 text-xl pointer-events-none select-none"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: [0.5, 1, 0.5], y: [0, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  💭
                </motion.div>
              )}

              {/* Portrait */}
              <motion.div
                key={characterState}
                className={`w-36 h-36 sm:w-48 sm:h-48 rounded-full overflow-hidden border-4 shadow-xl transition-colors duration-500 ${BORDER_CLASS[characterState]} ${avatarStateClass}`}
                initial={{ scale: 1, rotate: 0, y: 0 }}
                animate={PORTRAIT_ANIMATE[characterState]}
                transition={PORTRAIT_TRANSITION[characterState]}
              >
                <img src={character.image} alt={character.name} className="w-full h-full object-cover" />
              </motion.div>

            </div>

            {/* Name + language */}
            <div className="text-center">
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
                {character.name}
              </h2>
              <p className="text-sm text-muted-foreground font-body">{character.language} Storyteller</p>
            </div>

            {/* Status text */}
            <p className="font-body text-base text-foreground/70 text-center">{statusText}</p>

            {/* Speaking indicator bars — always in DOM, opacity only */}
            <div className={`flex gap-1 items-end h-6 transition-opacity duration-300 ${characterState === "speaking" && isActive ? "opacity-100" : "opacity-0"}`}>
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  className="w-1.5 bg-primary rounded-full"
                  style={{ height: "20px", transformOrigin: "bottom" }}
                  animate={{ scaleY: [0.4, 1, 0.4] }}
                  transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                />
              ))}
            </div>

            {/* Audio visualizers — always in DOM, opacity only */}
            <div className={`flex flex-col gap-2 w-full px-2 transition-opacity duration-300 ${isActive ? "opacity-100" : "opacity-0"}`}>
              <div style={{ height: "40px" }}>
                <AudioVisualizer
                  active={isActive}
                  ctxRef={playbackCtxRef}
                  nodeRef={playbackGainRef as React.RefObject<AudioNode | null>}
                  color="hsl(42 100% 62%)"
                />
              </div>
              <div style={{ height: "40px" }}>
                <AudioVisualizer
                  active={isCapturing}
                  ctxRef={captureCtxRef}
                  nodeRef={captureSourceRef as React.RefObject<AudioNode | null>}
                  color="hsl(170 70% 50%)"
                />
              </div>
            </div>

            {/* Button area */}
            <div className="flex flex-col items-center gap-2" style={{ minHeight: "80px" }}>
              {!isActive ? (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.8 }}
                  whileHover={!isConnecting ? { scale: 1.05 } : {}}
                  whileTap={!isConnecting ? { scale: 0.95 } : {}}
                  onClick={connect}
                  disabled={isConnecting}
                  className="px-10 py-4 rounded-full bg-primary text-primary-foreground font-display text-xl font-bold magic-glow animate-glow-pulse hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-3"
                >
                  {isConnecting ? (
                    <>
                      <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Getting the story ready...
                    </>
                  ) : (
                    "🪄 Begin the Story!"
                  )}
                </motion.button>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col items-center gap-2"
                >
                  <button
                    onClick={endAndSave}
                    className="font-body text-sm px-6 py-2 rounded-full border border-border/60 text-muted-foreground hover:text-foreground hover:border-border transition-colors"
                  >
                    End Story
                  </button>
                  <button
                    onClick={toggleCamera}
                    className={`font-body text-xs px-4 py-1.5 rounded-full border transition-colors ${
                      cameraEnabled
                        ? "border-cyan-400/70 text-cyan-400 bg-cyan-400/10 hover:bg-cyan-400/20"
                        : "border-border/60 text-muted-foreground hover:text-foreground hover:border-border"
                    }`}
                  >
                    {cameraEnabled ? "📷 Camera On" : "📷 Share Camera"}
                  </button>
                </motion.div>
              )}
            </div>

            {/* Camera preview */}
            <div className={`w-full rounded-xl overflow-hidden border border-cyan-400/30 transition-opacity duration-300 ${cameraEnabled && isActive ? "opacity-100" : "opacity-0 pointer-events-none"}`}
              style={{ height: cameraEnabled && isActive ? undefined : 0 }}>
              <video
                ref={cameraVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
                style={{ transform: "scaleX(-1)" }}
              />
            </div>
          </motion.div>

          {/* Right — story canvas */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="flex-1 md:w-4/5 flex flex-col gap-1.5"
          >
            {/* Interval control */}
            <div className="flex items-center justify-end gap-2">
              <div className="group relative">
                <span className="text-muted-foreground/50 hover:text-muted-foreground cursor-help text-sm select-none">ℹ</span>
                <div className="absolute top-full right-0 mt-1.5 w-60 bg-card border border-border/60 rounded-lg shadow-lg p-2.5 text-xs font-body text-muted-foreground leading-relaxed
                  opacity-0 pointer-events-none scale-95 origin-top-right
                  group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto
                  transition-all duration-150 z-50">
                  On a free Gemini quota, rate limits will kick in and cause images to fail. With a free account, keep this at <span className="text-foreground font-semibold">30s or above</span> for best results.
                </div>
              </div>
              <span className="font-body text-xs text-muted-foreground">image every</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIntervalSeconds((v) => Math.max(5, v - 1))}
                  className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors text-sm leading-none"
                >−</button>
                <span className="font-body text-xs font-semibold text-foreground/80 w-8 text-center">{intervalSeconds}s</span>
                <button
                  onClick={() => setIntervalSeconds((v) => Math.min(60, v + 1))}
                  className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors text-sm leading-none"
                >+</button>
              </div>
              <span className="font-body text-xs text-magic-orange w-16 text-right">
                {intervalSeconds <= 7 ? "⚠ too fast" : ""}
              </span>
            </div>

            {/* Canvas — relative so ChoiceOverlay can be positioned inside */}
            <div className="flex-1 story-canvas rounded-2xl border-2 border-dashed border-cycle overflow-hidden flex flex-col relative">
              {scenes.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
                  <StorybookEmpty />
                </div>
              ) : (
                <div className="flex-1 relative">
                  <StorySceneGrid scenes={scenes} />
                </div>
              )}

              {/* Choice overlay — inside the canvas so it's contextually placed */}
              <AnimatePresence>
                {activeChoice && isActive && (
                  <ChoiceOverlay options={activeChoice.options} onChoice={handleChoice} />
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default StoryScreen;
