import wizardImg from "@/assets/characters/wizard.png";
import fairyImg from "@/assets/characters/fairy.png";
import pirateImg from "@/assets/characters/pirate.png";
import robotImg from "@/assets/characters/robot.png";
import dragonImg from "@/assets/characters/dragon.png";
import dadiImg from "@/assets/characters/dadi.png";
import maharajaImg from "@/assets/characters/maharaja.png";
import hanumanImg from "@/assets/characters/hanuman.png";
import rajkumariImg from "@/assets/characters/rajkumari.png";
import rishiImg from "@/assets/characters/rishi.png";

export interface Character {
  id: string;
  name: string;
  language: string;
  tagline: string;
  description: string;
  image: string;
  greeting: string;
  imageStyle: string;
  category: "english" | "indian";
}

export const CHARACTERS: Character[] = [
  // ── English storytellers ──────────────────────────────────────────────
  {
    id: "wizard",
    name: "Wizard Wally",
    language: "English",
    tagline: "Magical tales",
    description: "A wise and playful wizard who loves magical tales",
    image: wizardImg,
    greeting: "Greetings, young adventurer! Ready for a magical story?",
    imageStyle: "magical wizard illustration, enchanted library, glowing spell books, starry backdrop, children's fantasy art, warm golden light",
    category: "english",
  },
  {
    id: "fairy",
    name: "Fairy Flora",
    language: "English",
    tagline: "Enchanted adventures",
    description: "A kind fairy princess from the Enchanted Garden",
    image: fairyImg,
    greeting: "Hello, little one! Let me sprinkle some story magic!",
    imageStyle: "enchanted garden illustration, fairy wings, flowers and butterflies, soft pastel colors, magical sparkles, children's picture book art",
    category: "english",
  },
  {
    id: "pirate",
    name: "Captain Coco",
    language: "English",
    tagline: "Bold sea adventures",
    description: "A brave pirate captain with exciting sea adventures",
    image: pirateImg,
    greeting: "Ahoy, matey! Ready to sail into a grand adventure?",
    imageStyle: "bold pirate adventure illustration, colorful ship and ocean, treasure chest, bright sunny day, children's adventure book art",
    category: "english",
  },
  {
    id: "robot",
    name: "Robo Ricky",
    language: "English",
    tagline: "Futuristic fun",
    description: "A friendly robot from the future with amazing stories",
    image: robotImg,
    greeting: "Beep boop! Story mode activated! Let's begin!",
    imageStyle: "colorful cartoon robot illustration, friendly face, bright tech elements, futuristic city, children's science fiction art",
    category: "english",
  },
  {
    id: "dragon",
    name: "Draco the Dragon",
    language: "English",
    tagline: "Fiery fun tales",
    description: "A gentle baby dragon who loves sharing tales",
    image: dragonImg,
    greeting: "Rawr! I mean... hello! Want to hear a fiery tale?",
    imageStyle: "cute baby dragon illustration, colorful scales, friendly expression, magical cave, children's fantasy storybook art, warm lighting",
    category: "english",
  },
  // ── Indian storytellers ───────────────────────────────────────────────
  {
    id: "dadi",
    name: "Dadi Maa",
    language: "Hindi",
    tagline: "Hindi कहानियाँ",
    description: "A loving grandmother with timeless Indian folktales",
    image: dadiImg,
    greeting: "आओ बच्चों, आज दादी एक कहानी सुनाएगी!",
    imageStyle: "warm watercolor illustration, traditional Indian home, cozy evening lamp, marigold flowers, rangoli, children's picture book art, heartwarming",
    category: "indian",
  },
  {
    id: "maharaja",
    name: "Raja Vikram",
    language: "Marathi",
    tagline: "Marathi गोष्टी",
    description: "A brave and just king with tales of wisdom and courage",
    image: maharajaImg,
    greeting: "स्वागत आहे! आज आपण एक भव्य कथा ऐकूया!",
    imageStyle: "vibrant Indian court illustration, royal palace, traditional Marathi attire, marigolds, golden lamp light, children's picture book art",
    category: "indian",
  },
  {
    id: "hanuman",
    name: "Little Hanuman",
    language: "Tamil",
    tagline: "Tamil கதைகள்",
    description: "The mighty and playful monkey hero of Indian mythology",
    image: hanumanImg,
    greeting: "வணக்கம்! ஒரு அற்புதமான கதை கேட்போம்!",
    imageStyle: "bright Indian mythology illustration, lush jungle, lotus flowers, warm golden light, children's storybook art, Tamil style",
    category: "indian",
  },
  {
    id: "rajkumari",
    name: "Rajkumari Meera",
    language: "Telugu",
    tagline: "Telugu కథలు",
    description: "A graceful princess who shares tales of love and bravery",
    image: rajkumariImg,
    greeting: "నమస్కారం! రండి, మీకు అందమైన కథ చెప్తాను!",
    imageStyle: "elegant Telugu princess illustration, palace garden, jasmine flowers, traditional jewelry, warm watercolor style, children's picture book art",
    category: "indian",
  },
  {
    id: "rishi",
    name: "Rishi Bodhi",
    language: "Bengali",
    tagline: "Bengali গল্প",
    description: "A peaceful sage who shares ancient wisdom through stories",
    image: rishiImg,
    greeting: "নমস্কার! এসো, একটি জ্ঞানের গল্প শুনি।",
    imageStyle: "serene Bengali sage illustration, riverside setting, lotus flowers, golden sunset, mustard fields, warm watercolor, children's picture book art",
    category: "indian",
  },
];

