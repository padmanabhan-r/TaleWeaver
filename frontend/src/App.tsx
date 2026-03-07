import { useState } from "react";
import LandingPage from "./screens/LandingPage";
import CharacterSelect from "./screens/CharacterSelect";
import ThemeSelect from "./screens/ThemeSelect";
import StoryScreen from "./screens/StoryScreen";
import MuteButton from "./components/MuteButton";
import { Character } from "./characters";
import { useAmbientSound } from "./hooks/useAmbientSound";

type Screen = "landing" | "story-select" | "theme-select" | "story";

const App = () => {
  const [screen, setScreen] = useState<Screen>("landing");
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [theme, setTheme] = useState<string | undefined>();
  const [propImage, setPropImage] = useState<string | undefined>();
  const [propDescription, setPropDescription] = useState<string | undefined>();
  const [muted, setMuted] = useState(false);

  // Ambient music plays on landing + character select, stops during story or when muted
  useAmbientSound(screen !== "story" && !muted);

  const handleCharacterSelect = (character: Character) => {
    setSelectedCharacter(character);
    setScreen("theme-select");
  };

  const handleThemeConfirm = (t: string, img?: string, desc?: string) => {
    setTheme(t);
    setPropImage(img);
    setPropDescription(desc);
    setScreen("story");
  };

  const handleBackFromTheme = () => {
    setSelectedCharacter(null);
    setScreen("story-select");
  };

  const handleBackFromStory = () => {
    setTheme(undefined);
    setPropImage(undefined);
    setPropDescription(undefined);
    setScreen("theme-select");
  };

  const handleBackToLanding = () => {
    setScreen("landing");
    setSelectedCharacter(null);
    setTheme(undefined);
    setPropImage(undefined);
    setPropDescription(undefined);
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
      {screen === "theme-select" && selectedCharacter && (
        <ThemeSelect
          character={selectedCharacter}
          onBack={handleBackFromTheme}
          onConfirm={handleThemeConfirm}
        />
      )}
      {screen === "story" && selectedCharacter && (
        <StoryScreen
          character={selectedCharacter}
          theme={theme}
          propImage={propImage}
          propDescription={propDescription}
          onBack={handleBackFromStory}
        />
      )}
      {screen !== "story" && (
        <MuteButton muted={muted} onToggle={() => setMuted((m) => !m)} />
      )}
    </>
  );
};

export default App;
