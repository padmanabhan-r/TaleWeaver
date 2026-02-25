import { Character } from "@/characters";
import CharacterPortrait from "@/components/CharacterPortrait";
import StorybookEmpty from "@/components/StorybookEmpty";
import { useLiveAPI, CharacterState } from "@/hooks/useLiveAPI";

interface Props {
  character: Character;
  onBack: () => void;
  onBegin?: () => void;
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

const StoryScreen = ({ character, onBack, onBegin }: Props) => {
  const { connect, disconnect, sessionState, characterState } = useLiveAPI({ character });

  const avatarClass = AVATAR_STATE_CLASS[characterState];

  const isConnecting = sessionState === "connecting" || sessionState === "ready";
  const isActive = sessionState === "active";

  const statusKey = isActive ? `active_${characterState}` : sessionState;
  const statusText = STATUS_TEXT[statusKey] ?? "";

  const handleBegin = () => {
    onBegin?.();
    connect();
  };

  const handleBack = () => {
    disconnect();
    onBack();
  };

  return (
    <div
      className="min-h-screen w-full screen-fade-in"
      style={{
        background: `linear-gradient(to bottom, ${character.bgColor}40, #ffffff)`,
      }}
      data-character={character.id}
    >
      {/* Header */}
      <header className="flex items-center justify-between px-4 md:px-8 py-4">
        <button
          onClick={handleBack}
          className="font-comic-neue text-lg hover:opacity-70 transition-opacity flex items-center gap-1"
          style={{ color: character.textColor }}
        >
          ← Back
        </button>
        <h2
          className="font-bangers text-2xl md:text-3xl tracking-wide"
          style={{ color: character.textColor }}
        >
          TaleWeaver
        </h2>
        <div className="w-16" />
      </header>

      {/* Main content */}
      <main className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-12 px-4 md:px-12 py-8 max-w-6xl mx-auto">
        {/* Left panel — character + controls */}
        <div className="flex flex-col items-center gap-6 md:w-[40%] shrink-0">
          {/* Character portrait with animated ring */}
          <div
            className={`rounded-full flex items-center justify-center ${avatarClass}`}
            style={{ padding: "12px" }}
          >
            <CharacterPortrait character={character} size="story" />
          </div>

          <h3
            className="font-bangers text-3xl tracking-wide"
            style={{ color: character.textColor }}
          >
            {character.name}
          </h3>

          <p
            className="font-comic-neue text-xl text-center"
            style={{ color: character.accentColor }}
          >
            {statusText}
          </p>

          {/* Begin button — shown when not yet active */}
          {!isActive && (
            <button
              onClick={handleBegin}
              disabled={isConnecting}
              className="bg-yellow-400 hover:bg-yellow-500 font-bangers text-3xl px-10 py-4 rounded-full shadow-xl border-4 border-yellow-600 transform hover:scale-105 active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-3"
              style={{ color: "#92400E" }}
            >
              {isConnecting ? (
                <>
                  <svg className="animate-spin h-7 w-7" viewBox="0 0 24 24" fill="none">
                    <circle
                      className="opacity-25"
                      cx="12" cy="12" r="10"
                      stroke="currentColor" strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Getting the story ready...
                </>
              ) : (
                "Begin the Story!"
              )}
            </button>
          )}

          {/* End button — shown while active */}
          {isActive && (
            <button
              onClick={disconnect}
              className="font-comic-neue text-base px-6 py-2 rounded-full border-2 hover:opacity-70 transition-opacity"
              style={{ color: character.textColor, borderColor: character.accentColor }}
            >
              End Story
            </button>
          )}
        </div>

        {/* Right panel — story scene images appear here (Phase 3) */}
        <div className="md:w-[60%] w-full min-h-[400px] md:min-h-[500px] rounded-3xl border-4 border-dashed bg-white/40 flex flex-col items-center justify-center gap-4 p-8 border-cycle">
          <StorybookEmpty />
        </div>
      </main>
    </div>
  );
};

export default StoryScreen;
