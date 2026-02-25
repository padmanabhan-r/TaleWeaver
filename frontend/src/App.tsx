import { useState } from "react";
import CharacterSelect from "./screens/CharacterSelect";
import StoryScreen from "./screens/StoryScreen";
import { Character } from "./characters";

type Screen = "select" | "story";

const App = () => {
  const [screen, setScreen] = useState<Screen>("select");
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);

  const handleCharacterSelect = (character: Character) => {
    setSelectedCharacter(character);
    setScreen("story");
  };

  const handleBack = () => {
    setScreen("select");
    setSelectedCharacter(null);
  };

  return (
    <>
      {screen === "select" && <CharacterSelect onSelect={handleCharacterSelect} />}
      {screen === "story" && selectedCharacter && (
        <StoryScreen character={selectedCharacter} onBack={handleBack} />
      )}
    </>
  );
};

export default App;
