import React, { useRef } from "react";
import { motion } from "framer-motion";
import { Character } from "@/characters";
import StorybookEmpty from "@/components/StorybookEmpty";
import { StorySceneGrid } from "@/components/StorySceneGrid";
import { AudioVisualizer } from "@/components/AudioVisualizer";
import { useLiveAPI, CharacterState } from "@/hooks/useLiveAPI";
import { useStoryImages } from "@/hooks/useStoryImages";
import FloatingElements from "@/components/FloatingElements";

interface Props {
  character: Character;
  onBack: () => void;
}

const AVATAR_STATE_CLASS: Record<CharacterState, string> = {
  idle: "state-idle",
  thinking: "state-idle",
  speaking: "state-speaking",
  listening: "state-listening",
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

const StoryScreen = ({ character, onBack }: Props) => {
  const sessionIdRef = useRef<string>(crypto.randomUUID());

  const { scenes, triggerImageGeneration } = useStoryImages(
    character.imageStyle,
    sessionIdRef.current
  );

  const {
    connect, disconnect, sessionState, characterState, isCapturing,
    captureCtxRef, captureSourceRef, playbackCtxRef, playbackGainRef,
  } = useLiveAPI({ character, onImageTrigger: triggerImageGeneration });

  const avatarStateClass = AVATAR_STATE_CLASS[characterState];
  const isConnecting = sessionState === "connecting" || sessionState === "ready";
  const isActive = sessionState === "active";
  const statusKey = isActive ? `active_${characterState}` : sessionState;
  const statusText = STATUS_TEXT[statusKey] ?? "";

  const handleBack = () => { disconnect(); onBack(); };

  return (
    <div className="relative min-h-screen bg-sky-gradient overflow-hidden">
      <FloatingElements />

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
          <div className="w-32" />
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
            <motion.div
              className={`w-36 h-36 sm:w-48 sm:h-48 rounded-full overflow-hidden border-4 border-primary/40 shadow-xl ${avatarStateClass}`}
              animate={characterState === "speaking" ? { scale: [1, 1.03, 1] } : {}}
              transition={{ duration: 0.5, repeat: characterState === "speaking" ? Infinity : 0 }}
            >
              <img
                src={character.image}
                alt={character.name}
                className="w-full h-full object-cover"
              />
            </motion.div>

            {/* Name + language */}
            <div className="text-center">
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
                {character.name}
              </h2>
              <p className="text-sm text-muted-foreground font-body">{character.language} Storyteller</p>
            </div>

            {/* Status text */}
            <p className="font-body text-base text-foreground/70 text-center">{statusText}</p>

            {/* Speaking indicator bars */}
            {characterState === "speaking" && isActive && (
              <div className="flex gap-1 items-end h-6">
                {[0, 1, 2, 3, 4].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 bg-primary rounded-full"
                    animate={{ height: ["8px", "20px", "8px"] }}
                    transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                  />
                ))}
              </div>
            )}

            {/* Audio visualizers */}
            {isActive && (
              <div className="flex flex-col gap-2 w-full px-2">
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
            )}

            {/* Begin button */}
            {!isActive && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
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
            )}

            {/* End button */}
            {isActive && (
              <button
                onClick={disconnect}
                className="font-body text-sm px-6 py-2 rounded-full border border-border/60 text-muted-foreground hover:text-foreground hover:border-border transition-colors"
              >
                End Story
              </button>
            )}
          </motion.div>

          {/* Right — story canvas */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="flex-1 md:w-4/5 story-canvas rounded-2xl border-2 border-dashed border-cycle overflow-hidden flex flex-col"
          >
            {scenes.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
                <StorybookEmpty />
              </div>
            ) : (
              <div className="flex-1 relative">
                <StorySceneGrid scenes={scenes} />
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default StoryScreen;
