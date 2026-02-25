export interface Character {
  id: string;
  name: string;
  tagline: string;
  emoji: string;
  description: string;
  cardGradient: string;
  bgColor: string;
  accentColor: string;
  textColor: string;
  greeting: string;
}

export const CHARACTERS: Character[] = [
  {
    id: "grandma-rose",
    name: "Grandma Rose",
    tagline: "Cozy bedtime tales",
    emoji: "👵",
    description: "Warm, gentle, and full of love. She knows every fairy tale ever told.",
    cardGradient: "from-pink-200 to-rose-300",
    bgColor: "#FFD1DC",
    accentColor: "#FF69B4",
    textColor: "#9D174D",
    greeting: "Hello sweetheart! I've been waiting for you. Shall we tell a story?",
  },
  {
    id: "captain-leo",
    name: "Captain Leo",
    tagline: "Bold adventures",
    emoji: "🧑‍✈️",
    description: "Brave, exciting, and ready for any adventure. Ahoy, young explorer!",
    cardGradient: "from-blue-200 to-blue-400",
    bgColor: "#B3D4FF",
    accentColor: "#2563EB",
    textColor: "#1E3A8A",
    greeting: "Ahoy there, young explorer! Ready for an adventure on the high seas?",
  },
  {
    id: "fairy-sparkle",
    name: "Fairy Sparkle",
    tagline: "Magical tales",
    emoji: "🧚",
    description: "Whimsical, magical, full of wonder. Every story she tells sparkles.",
    cardGradient: "from-purple-200 to-violet-400",
    bgColor: "#E8B4FF",
    accentColor: "#A855F7",
    textColor: "#6B21A8",
    greeting: "Oh! A visitor! I have the most wonderful magical story just waiting to be told!",
  },
  {
    id: "professor-whiz",
    name: "Professor Whiz",
    tagline: "Science adventures",
    emoji: "🧑‍🔬",
    description: "Curious, clever, and endearingly absent-minded. Science is his magic!",
    cardGradient: "from-green-200 to-emerald-400",
    bgColor: "#B3FFD4",
    accentColor: "#10B981",
    textColor: "#065F46",
    greeting: "Fascinating! A young mind arrives! I have a most extraordinary story!",
  },
  {
    id: "dragon-blaze",
    name: "Dragon Blaze",
    tagline: "Silly dragon fun",
    emoji: "🐲",
    description: "Big, enthusiastic, and VERY excited. Every story is the BEST story EVER!",
    cardGradient: "from-orange-200 to-red-300",
    bgColor: "#FFD4B3",
    accentColor: "#F97316",
    textColor: "#9A3412",
    greeting: "ROAAARRR! Oh wait, I mean... hello! Ready for the most EPIC story EVER?!",
  },
  // ── Indian language storytellers ─────────────────────────────────────────
  {
    id: "paati",
    name: "Paati",
    tagline: "Tamil கதைகள்",
    emoji: "👩‍🦳",
    description: "அன்பான தமிழ் பாட்டி. Warm Tamil grandmother with a treasure chest of folk tales.",
    cardGradient: "from-amber-100 to-orange-200",
    bgColor: "#FFE0B2",
    accentColor: "#C2410C",
    textColor: "#7C2D12",
    greeting: "வாங்க கண்ணா! என்னிடம் மிகவும் அழகான கதை இருக்கு. கேட்கணுமா?",
  },
  {
    id: "dadi",
    name: "Dadi",
    tagline: "Hindi कहानियाँ",
    emoji: "👵",
    description: "प्यारी हिंदी दादी। A warm Hindi grandmother who knows every Panchatantra tale.",
    cardGradient: "from-teal-100 to-cyan-200",
    bgColor: "#B2EBF2",
    accentColor: "#0E7490",
    textColor: "#164E63",
    greeting: "आओ बेटा! दादी के पास बहुत सारी कहानियाँ हैं। सुनोगे ना?",
  },
];

export const getCharacter = (id: string) => CHARACTERS.find((c) => c.id === id);
