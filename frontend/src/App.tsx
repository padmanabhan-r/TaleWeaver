import { useState } from "react";
import LandingPage from "./screens/LandingPage";
import CharacterSelect from "./screens/CharacterSelect";
import StudyCharacterSelect from "./screens/StudyCharacterSelect";
import StoryScreen from "./screens/StoryScreen";
import { Character } from "./characters";

type Screen = "landing" | "story-select" | "story" | "study-select" | "study";

const App = () => {
  const [screen, setScreen] = useState<Screen>("landing");
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);

  const handleCharacterSelect = (character: Character, mode: "story" | "study") => {
    setSelectedCharacter(character);
    setScreen(mode);
  };

  const handleBack = () => {
    setSelectedCharacter(null);
    if (screen === "story") setScreen("story-select");
    else if (screen === "study") setScreen("study-select");
  };

  const handleBackToLanding = () => {
    setScreen("landing");
    setSelectedCharacter(null);
  };

  return (
    <>
      {screen === "landing" && (
        <LandingPage
          onStoryMode={() => setScreen("story-select")}
          onStudyMode={() => setScreen("study-select")}
        />
      )}
      {screen === "story-select" && (
        <CharacterSelect
          onSelect={(c) => handleCharacterSelect(c, "story")}
          onBack={handleBackToLanding}
        />
      )}
      {screen === "study-select" && (
        <StudyCharacterSelect
          onSelect={(c) => handleCharacterSelect(c, "study")}
          onBack={handleBackToLanding}
        />
      )}
      {(screen === "story" || screen === "study") && selectedCharacter && (
        <StoryScreen character={selectedCharacter} onBack={handleBack} />
      )}
    </>
  );
};

export default App;
