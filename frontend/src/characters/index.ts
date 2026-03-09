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
    imageStyle: "children's fantasy storybook art, warm golden light, rich jewel tones, magical atmosphere, watercolor and ink",
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
    imageStyle: "soft pastel watercolor, children's picture book art, magical sparkles, delicate line work, dreamy warm atmosphere",
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
    imageStyle: "bold vibrant colors, bright sunny palette, children's adventure book art, dynamic composition, clean cartoon illustration",
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
    imageStyle: "bright cheerful colors, children's science fiction art, clean cartoon style, soft glow effects, playful digital illustration",
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
    imageStyle: "rich jewel tones, warm firelight palette, children's fantasy storybook art, painterly illustration, vivid colors",
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
    imageStyle: "warm watercolor, rich saffron and gold tones, children's picture book art, heartwarming illustration style, soft evening light",
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
    imageStyle: "vibrant jewel tones, golden lamp light, children's picture book art, rich Indian folk illustration style, bold colors, decorative patterns",
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
    imageStyle: "warm golden light, children's storybook art, lush tropical colors, bright and vibrant, painterly illustration",
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
    imageStyle: "elegant warm watercolor style, golden light, children's picture book art, soft jewel tones, delicate detail",
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
    imageStyle: "warm watercolor, golden sunset tones, children's picture book art, tranquil serene atmosphere, soft gentle palette",
    category: "indian",
  },
];

