import { useState } from "react";
import LandingPage from "./screens/LandingPage";
import CharacterSelect from "./screens/CharacterSelect";
import StoryScreen from "./screens/StoryScreen";
import { Character } from "./characters";
import { useAmbientSound } from "./hooks/useAmbientSound";

type Screen = "landing" | "story-select" | "story";

const App = () => {
  const [screen, setScreen] = useState<Screen>("landing");
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);

  // Ambient music plays on landing + character select, stops during story
  useAmbientSound(screen !== "story");

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
    </>
  );
};

export default App;
