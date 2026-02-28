import { useState } from "react";
import LandingPage from "./screens/LandingPage";
import CharacterSelect from "./screens/CharacterSelect";
import StoryScreen from "./screens/StoryScreen";
import MuteButton from "./components/MuteButton";
import { Character } from "./characters";
import { useAmbientSound } from "./hooks/useAmbientSound";

type Screen = "landing" | "story-select" | "story";

const App = () => {
  const [screen, setScreen] = useState<Screen>("landing");
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [muted, setMuted] = useState(false);

  // Ambient music plays on landing + character select, stops during story or when muted
  useAmbientSound(screen !== "story" && !muted);

  const handleCharacterSelect = (character: Character) => {
    setSelectedCharacter(character);
    setScreen("story");
  };

  const handleBack = () => {
    setSelectedCharacter(null);
    setScreen("story-select");
  };

  const handleBackToLanding = () => {
    setScreen("landing");
    setSelectedCharacter(null);
  };

  return (
    <>
      {screen === "landing" && (
        <LandingPage onStoryMode={() => setScreen("story-select")} />
      )}
      {screen === "story-select" && (
        <CharacterSelect
          onSelect={handleCharacterSelect}
          onBack={handleBackToLanding}
        />
      )}
      {screen === "story" && selectedCharacter && (
        <StoryScreen character={selectedCharacter} onBack={handleBack} />
      )}
      {screen !== "story" && (
        <MuteButton muted={muted} onToggle={() => setMuted((m) => !m)} />
      )}
    </>
  );
};

export default App;
