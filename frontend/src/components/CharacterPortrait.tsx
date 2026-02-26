import { Character } from "@/characters";

interface Props {
  character: Character;
  size?: "card" | "story";
}

/* ─── Grandma Rose ─── warmth, round softness, reading glasses, cozy shawl */
const GrandmaRose = ({ size }: { size: string }) => {
  const w = size === "story" ? 260 : 135;
  return (
    <svg viewBox="0 0 200 250" width={w} height={w * 1.25} aria-label="Grandma Rose">
      <defs>
        <radialGradient id="gr-cheek" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFB3C6" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#FFB3C6" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="gr-shawl" cx="50%" cy="0%" r="100%">
          <stop offset="0%" stopColor="#FF85C8" />
          <stop offset="100%" stopColor="#FF69B4" />
        </radialGradient>
      </defs>

      {/* Shawl / body */}
      <path d="M 40 160 Q 42 148 58 138 Q 78 152 100 158 Q 122 152 142 138 Q 158 148 160 160 L 168 250 L 32 250 Z" fill="url(#gr-shawl)" />
      {/* Shawl pattern – wavy knit lines */}
      <path d="M 55 175 Q 70 182 85 175 Q 100 168 115 175 Q 130 182 145 175" fill="none" stroke="#FFD1DC" strokeWidth="2" opacity="0.6" />
      <path d="M 52 190 Q 67 197 82 190 Q 97 183 112 190 Q 127 197 148 190" fill="none" stroke="#FFD1DC" strokeWidth="2" opacity="0.5" />
      <path d="M 50 205 Q 65 212 80 205 Q 95 198 110 205 Q 125 212 150 205" fill="none" stroke="#FFD1DC" strokeWidth="2" opacity="0.4" />
      {/* Brooch on shawl */}
      <circle cx="100" cy="158" r="6" fill="#FBBF24" />
      <circle cx="100" cy="158" r="3.5" fill="#FDE68A" />

      {/* Hair – soft white bun with volume */}
      <ellipse cx="100" cy="62" rx="60" ry="50" fill="#F0EAE2" />
      <circle cx="100" cy="30" r="28" fill="#E8E0D4" />
      <ellipse cx="68" cy="42" rx="20" ry="18" fill="#F0EAE2" />
      <ellipse cx="132" cy="42" rx="20" ry="18" fill="#F0EAE2" />
      {/* Hair pin */}
      <circle cx="120" cy="22" r="4" fill="#FF69B4" opacity="0.8" />

      {/* Face */}
      <ellipse cx="100" cy="100" rx="50" ry="54" fill="#FDDCB5" />

      {/* Rosy cheeks */}
      <circle cx="68" cy="112" r="14" fill="url(#gr-cheek)" />
      <circle cx="132" cy="112" r="14" fill="url(#gr-cheek)" />

      {/* Eyes – warm, slightly closed/happy */}
      <ellipse cx="80" cy="94" rx="7" ry="8" fill="#4A3728" />
      <ellipse cx="120" cy="94" rx="7" ry="8" fill="#4A3728" />
      <circle cx="82" cy="91" r="2.5" fill="white" opacity="0.9" />
      <circle cx="122" cy="91" r="2.5" fill="white" opacity="0.9" />
      {/* Crow's feet / smile lines */}
      <path d="M 62 90 Q 60 94 62 98" fill="none" stroke="#D4A574" strokeWidth="1" opacity="0.4" />
      <path d="M 138 90 Q 140 94 138 98" fill="none" stroke="#D4A574" strokeWidth="1" opacity="0.4" />

      {/* Glasses */}
      <circle cx="80" cy="96" r="16" fill="none" stroke="#9D174D" strokeWidth="2.5" />
      <circle cx="120" cy="96" r="16" fill="none" stroke="#9D174D" strokeWidth="2.5" />
      <line x1="96" y1="96" x2="104" y2="96" stroke="#9D174D" strokeWidth="2.5" />
      <line x1="64" y1="92" x2="54" y2="86" stroke="#9D174D" strokeWidth="2" />
      <line x1="136" y1="92" x2="146" y2="86" stroke="#9D174D" strokeWidth="2" />
      {/* Lens shine */}
      <path d="M 72 88 Q 74 85 78 86" fill="none" stroke="white" strokeWidth="1.5" opacity="0.4" />
      <path d="M 112 88 Q 114 85 118 86" fill="none" stroke="white" strokeWidth="1.5" opacity="0.4" />

      {/* Warm, loving smile */}
      <path d="M 82 120 Q 100 138 118 120" fill="none" stroke="#9D174D" strokeWidth="2.5" strokeLinecap="round" />
      {/* Smile dimples */}
      <circle cx="78" cy="118" r="2" fill="#E8A080" opacity="0.3" />
      <circle cx="122" cy="118" r="2" fill="#E8A080" opacity="0.3" />

      {/* Nose */}
      <path d="M 98 104 Q 100 110 102 104" fill="none" stroke="#D4A574" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
};

/* ─── Captain Leo ─── bold, confident, captain's hat, epaulettes */
const CaptainLeo = ({ size }: { size: string }) => {
  const w = size === "story" ? 260 : 135;
  return (
    <svg viewBox="0 0 200 250" width={w} height={w * 1.25} aria-label="Captain Leo">
      <defs>
        <linearGradient id="cl-hat" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1E3A8A" />
          <stop offset="100%" stopColor="#1E40AF" />
        </linearGradient>
        <linearGradient id="cl-uniform" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
      </defs>

      {/* Uniform body */}
      <path d="M 45 155 L 60 142 L 100 160 L 140 142 L 155 155 L 165 250 L 35 250 Z" fill="url(#cl-uniform)" />
      {/* V-neck collar */}
      <path d="M 60 142 L 100 165 L 140 142 L 136 152 L 100 172 L 64 152 Z" fill="#1E3A8A" />
      {/* Buttons – gold */}
      <circle cx="100" cy="185" r="4.5" fill="#FBBF24" />
      <circle cx="100" cy="200" r="4.5" fill="#FBBF24" />
      <circle cx="100" cy="215" r="4.5" fill="#FBBF24" />
      {/* Epaulettes */}
      <ellipse cx="50" cy="155" rx="12" ry="5" fill="#FBBF24" />
      <ellipse cx="150" cy="155" rx="12" ry="5" fill="#FBBF24" />
      {/* Gold fringe on epaulettes */}
      <line x1="42" y1="158" x2="42" y2="165" stroke="#FBBF24" strokeWidth="1.5" />
      <line x1="46" y1="159" x2="46" y2="167" stroke="#FBBF24" strokeWidth="1.5" />
      <line x1="50" y1="159" x2="50" y2="168" stroke="#FBBF24" strokeWidth="1.5" />
      <line x1="54" y1="159" x2="54" y2="167" stroke="#FBBF24" strokeWidth="1.5" />
      <line x1="146" y1="159" x2="146" y2="167" stroke="#FBBF24" strokeWidth="1.5" />
      <line x1="150" y1="159" x2="150" y2="168" stroke="#FBBF24" strokeWidth="1.5" />
      <line x1="154" y1="159" x2="154" y2="167" stroke="#FBBF24" strokeWidth="1.5" />
      <line x1="158" y1="158" x2="158" y2="165" stroke="#FBBF24" strokeWidth="1.5" />

      {/* Face – warm skin, strong jaw */}
      <ellipse cx="100" cy="100" rx="46" ry="50" fill="#E8C49A" />
      <path d="M 62 108 Q 68 148 100 154 Q 132 148 138 108" fill="#E8C49A" />

      {/* Captain hat */}
      <ellipse cx="100" cy="56" rx="56" ry="14" fill="url(#cl-hat)" />
      <path d="M 48 56 L 54 22 Q 100 6 146 22 L 152 56 Z" fill="url(#cl-hat)" />
      {/* Hat band */}
      <rect x="48" y="50" width="104" height="10" rx="2" fill="#2563EB" />
      {/* Hat badge – anchor */}
      <circle cx="100" cy="36" r="10" fill="#FBBF24" />
      <path d="M 100 28 L 100 42 M 94 38 L 106 38 M 96 34 Q 100 30 104 34" fill="none" stroke="#92400E" strokeWidth="2" strokeLinecap="round" />
      {/* Hat brim shine */}
      <path d="M 60 54 Q 80 50 100 52" fill="none" stroke="#3B82F6" strokeWidth="1.5" opacity="0.3" />

      {/* Eyes – confident, bright */}
      <ellipse cx="82" cy="96" rx="6" ry="7" fill="#1E3A8A" />
      <ellipse cx="118" cy="96" rx="6" ry="7" fill="#1E3A8A" />
      <circle cx="84" cy="93" r="2.5" fill="white" opacity="0.9" />
      <circle cx="120" cy="93" r="2.5" fill="white" opacity="0.9" />

      {/* Bold eyebrows */}
      <path d="M 70 84 Q 82 76 94 84" fill="none" stroke="#3B2507" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M 106 84 Q 118 76 130 84" fill="none" stroke="#3B2507" strokeWidth="3.5" strokeLinecap="round" />

      {/* Confident grin */}
      <path d="M 82 118 Q 100 132 118 118" fill="white" stroke="#1E3A8A" strokeWidth="2" strokeLinecap="round" />
      <path d="M 84 118 Q 100 126 116 118" fill="#1E3A8A" opacity="0.08" />

      {/* Nose */}
      <path d="M 97 102 Q 100 108 103 102" fill="none" stroke="#C9A068" strokeWidth="1.5" strokeLinecap="round" />

      {/* Telescope hint tucked by shoulder */}
      <rect x="152" y="170" width="8" height="40" rx="4" fill="#1E3A8A" opacity="0.5" />
      <rect x="150" y="168" width="12" height="8" rx="3" fill="#FBBF24" opacity="0.6" />
    </svg>
  );
};

/* ─── Fairy Sparkle ─── ethereal, wings, flowing hair, wand */
const FairySparkle = ({ size }: { size: string }) => {
  const w = size === "story" ? 260 : 135;
  return (
    <svg viewBox="0 0 220 260" width={w} height={w * 1.18} aria-label="Fairy Sparkle">
      <defs>
        <radialGradient id="fs-glow" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#E9D5FF" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#E9D5FF" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="fs-wing" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E9D5FF" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#C084FC" stopOpacity="0.3" />
        </linearGradient>
        <linearGradient id="fs-dress" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#A855F7" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
      </defs>

      {/* Magical glow behind */}
      <circle cx="110" cy="120" r="90" fill="url(#fs-glow)" />

      {/* Wings – delicate, layered */}
      <ellipse cx="42" cy="130" rx="32" ry="50" fill="url(#fs-wing)" transform="rotate(-12 42 130)" />
      <ellipse cx="178" cy="130" rx="32" ry="50" fill="url(#fs-wing)" transform="rotate(12 178 130)" />
      <ellipse cx="48" cy="135" rx="22" ry="36" fill="#D8B4FE" opacity="0.35" transform="rotate(-12 48 135)" />
      <ellipse cx="172" cy="135" rx="22" ry="36" fill="#D8B4FE" opacity="0.35" transform="rotate(12 172 135)" />
      {/* Wing veins */}
      <path d="M 58 110 Q 40 120 35 145" fill="none" stroke="#C084FC" strokeWidth="0.8" opacity="0.4" />
      <path d="M 162 110 Q 180 120 185 145" fill="none" stroke="#C084FC" strokeWidth="0.8" opacity="0.4" />

      {/* Hair – flowing, lavender */}
      <path d="M 60 70 Q 42 95 40 145 Q 42 170 58 185" fill="#C084FC" opacity="0.85" />
      <path d="M 160 70 Q 178 95 180 145 Q 178 170 162 185" fill="#C084FC" opacity="0.85" />
      <ellipse cx="110" cy="62" rx="52" ry="38" fill="#C084FC" />
      {/* Hair highlights */}
      <path d="M 75 48 Q 80 35 90 42" fill="none" stroke="#DDD6FE" strokeWidth="2.5" opacity="0.5" />
      <path d="M 130 50 Q 138 38 145 48" fill="none" stroke="#DDD6FE" strokeWidth="2.5" opacity="0.5" />
      {/* Hair flowers */}
      <circle cx="140" cy="52" r="5" fill="#F9A8D4" opacity="0.7" />
      <circle cx="140" cy="52" r="2.5" fill="#FBBF24" opacity="0.6" />

      {/* Pointed ears */}
      <path d="M 62 88 L 42 68 L 66 82" fill="#FDE8F0" />
      <path d="M 158 88 L 178 68 L 154 82" fill="#FDE8F0" />

      {/* Face */}
      <ellipse cx="110" cy="100" rx="42" ry="46" fill="#FDE8F0" />

      {/* Eyes – huge, sparkly */}
      <ellipse cx="94" cy="96" rx="9" ry="10" fill="#7C3AED" />
      <ellipse cx="126" cy="96" rx="9" ry="10" fill="#7C3AED" />
      <circle cx="97" cy="92" r="3.5" fill="white" opacity="0.9" />
      <circle cx="129" cy="92" r="3.5" fill="white" opacity="0.9" />
      <circle cx="92" cy="97" r="1.5" fill="white" opacity="0.5" />
      <circle cx="124" cy="97" r="1.5" fill="white" opacity="0.5" />
      {/* Eyelashes */}
      <path d="M 84 90 Q 86 86 89 88" fill="none" stroke="#7C3AED" strokeWidth="1" />
      <path d="M 136 90 Q 134 86 131 88" fill="none" stroke="#7C3AED" strokeWidth="1" />

      {/* Delicate nose */}
      <path d="M 108 104 Q 110 108 112 104" fill="none" stroke="#E8B4D4" strokeWidth="1" strokeLinecap="round" />

      {/* Sweet smile */}
      <path d="M 100 114 Q 110 122 120 114" fill="none" stroke="#A855F7" strokeWidth="2" strokeLinecap="round" />

      {/* Dress */}
      <path d="M 72 142 Q 90 148 110 152 Q 130 148 148 142 L 160 250 Q 130 260 110 260 Q 90 260 60 250 Z" fill="url(#fs-dress)" opacity="0.75" />
      {/* Dress sparkle details */}
      <circle cx="95" cy="180" r="2" fill="#FBBF24" opacity="0.5" />
      <circle cx="125" cy="195" r="1.5" fill="#FBBF24" opacity="0.4" />
      <circle cx="108" cy="210" r="2" fill="#E9D5FF" opacity="0.6" />

      {/* Wand */}
      <line x1="165" y1="108" x2="195" y2="42" stroke="#FBBF24" strokeWidth="3" strokeLinecap="round" />
      {/* Star on wand */}
      <polygon points="195,25 198,37 210,37 200,44 204,56 195,48 186,56 190,44 180,37 192,37" fill="#FBBF24" />
      {/* Star glow */}
      <circle cx="195" cy="40" r="15" fill="#FBBF24" opacity="0.12" />

      {/* Floating sparkle particles */}
      <circle cx="180" cy="65" r="2" fill="#E9D5FF" opacity="0.8">
        <animate attributeName="opacity" values="0.8;0.2;0.8" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx="40" cy="100" r="1.5" fill="#FBBF24" opacity="0.6">
        <animate attributeName="opacity" values="0.6;0.1;0.6" dur="2.5s" repeatCount="indefinite" />
      </circle>
      <circle cx="190" cy="80" r="1.5" fill="#C084FC" opacity="0.7">
        <animate attributeName="opacity" values="0.7;0.2;0.7" dur="1.8s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
};

/* ─── Professor Whiz ─── wild hair, huge glasses, lab coat, flask */
const ProfessorWhiz = ({ size }: { size: string }) => {
  const w = size === "story" ? 260 : 135;
  return (
    <svg viewBox="0 0 200 250" width={w} height={w * 1.25} aria-label="Professor Whiz">
      <defs>
        <linearGradient id="pw-coat" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F3F4F6" />
        </linearGradient>
        <linearGradient id="pw-flask" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#6EE7B7" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
      </defs>

      {/* Lab coat body */}
      <path d="M 42 152 L 58 140 L 100 158 L 142 140 L 158 152 L 168 250 L 32 250 Z" fill="url(#pw-coat)" />
      {/* Coat lapels */}
      <path d="M 58 140 L 84 165 L 78 250" fill="#E5E7EB" />
      <path d="M 142 140 L 116 165 L 122 250" fill="#E5E7EB" />
      {/* Coat line */}
      <line x1="100" y1="165" x2="100" y2="250" stroke="#D1D5DB" strokeWidth="1" />
      {/* Pocket */}
      <rect x="112" y="178" width="20" height="22" rx="3" fill="none" stroke="#D1D5DB" strokeWidth="1.5" />
      {/* Pens in pocket */}
      <line x1="118" y1="172" x2="118" y2="180" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="124" y1="174" x2="124" y2="180" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
      {/* Name badge */}
      <rect x="62" y="168" width="22" height="14" rx="2" fill="#DBEAFE" stroke="#93C5FD" strokeWidth="1" />
      <line x1="66" y1="174" x2="80" y2="174" stroke="#93C5FD" strokeWidth="1.5" />
      <line x1="66" y1="178" x2="76" y2="178" stroke="#93C5FD" strokeWidth="1" />

      {/* Wild hair – spiky in all directions */}
      <path d="M 42 78 Q 22 55 38 30 Q 44 18 62 22" fill="#5B4A3F" />
      <path d="M 158 78 Q 178 55 162 30 Q 156 18 138 22" fill="#5B4A3F" />
      <path d="M 62 22 Q 55 5 68 0 Q 78 -2 85 12" fill="#5B4A3F" />
      <path d="M 138 22 Q 145 5 132 0 Q 122 -2 115 12" fill="#5B4A3F" />
      <path d="M 85 12 Q 92 -5 100 0 Q 108 -5 115 12" fill="#5B4A3F" />
      <ellipse cx="100" cy="55" rx="55" ry="40" fill="#5B4A3F" />
      {/* Hair flyaway strands */}
      <path d="M 35 45 Q 25 35 30 22" fill="none" stroke="#5B4A3F" strokeWidth="5" strokeLinecap="round" />
      <path d="M 165 45 Q 175 32 172 20" fill="none" stroke="#5B4A3F" strokeWidth="5" strokeLinecap="round" />
      <path d="M 50 25 Q 42 10 48 0" fill="none" stroke="#5B4A3F" strokeWidth="4" strokeLinecap="round" />

      {/* Face */}
      <ellipse cx="100" cy="100" rx="48" ry="52" fill="#F0D5A8" />

      {/* Big round glasses */}
      <circle cx="78" cy="96" r="20" fill="rgba(255,255,255,0.15)" stroke="#065F46" strokeWidth="3" />
      <circle cx="122" cy="96" r="20" fill="rgba(255,255,255,0.15)" stroke="#065F46" strokeWidth="3" />
      <line x1="98" y1="96" x2="102" y2="96" stroke="#065F46" strokeWidth="3" />
      <line x1="58" y1="90" x2="46" y2="82" stroke="#065F46" strokeWidth="2.5" />
      <line x1="142" y1="90" x2="154" y2="82" stroke="#065F46" strokeWidth="2.5" />
      {/* Lens glare */}
      <path d="M 68 86 Q 72 82 76 84" fill="none" stroke="white" strokeWidth="2" opacity="0.35" />
      <path d="M 112 86 Q 116 82 120 84" fill="none" stroke="white" strokeWidth="2" opacity="0.35" />

      {/* Eyes – wide with wonder, pupils up-looking */}
      <ellipse cx="78" cy="94" rx="7" ry="8" fill="#065F46" />
      <ellipse cx="122" cy="94" rx="7" ry="8" fill="#065F46" />
      <circle cx="80" cy="90" r="3" fill="white" opacity="0.9" />
      <circle cx="124" cy="90" r="3" fill="white" opacity="0.9" />

      {/* Eyebrows – raised high in excitement */}
      <path d="M 62 72 Q 78 62 94 72" fill="none" stroke="#5B4A3F" strokeWidth="3" strokeLinecap="round" />
      <path d="M 106 72 Q 122 62 138 72" fill="none" stroke="#5B4A3F" strokeWidth="3" strokeLinecap="round" />

      {/* Big delighted open-mouth grin */}
      <path d="M 78 120 Q 100 140 122 120" fill="white" stroke="#065F46" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M 82 120 Q 100 130 118 120" fill="#065F46" opacity="0.08" />

      {/* Nose */}
      <path d="M 98 105 Q 100 112 102 105" fill="none" stroke="#C9A068" strokeWidth="1.5" strokeLinecap="round" />

      {/* Flask held up in excitement */}
      <g transform="translate(155, 130) rotate(-15)">
        <path d="M -6 0 L -8 -20 L 8 -20 L 6 0 Z" fill="rgba(255,255,255,0.6)" stroke="#D1D5DB" strokeWidth="1.5" />
        <rect x="-5" y="-24" width="10" height="6" rx="2" fill="#D1D5DB" />
        <ellipse cx="0" cy="-8" rx="5" ry="8" fill="url(#pw-flask)" opacity="0.7" />
        {/* Bubbles in flask */}
        <circle cx="-2" cy="-5" r="1.5" fill="white" opacity="0.5" />
        <circle cx="2" cy="-10" r="1" fill="white" opacity="0.4" />
        <circle cx="0" cy="-14" r="1.2" fill="white" opacity="0.3" />
      </g>
    </svg>
  );
};

/* ─── Paati ─── warm Tamil grandmother, silk saree, jasmine bun, bindi, gold jewellery */
const Paati = ({ size }: { size: string }) => {
  const w = size === "story" ? 260 : 135;
  return (
    <svg viewBox="0 0 200 250" width={w} height={w * 1.25} aria-label="Paati">
      <defs>
        <linearGradient id="pt-saree" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#C2410C" />
          <stop offset="100%" stopColor="#9A3412" />
        </linearGradient>
        <linearGradient id="pt-border" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
        <radialGradient id="pt-cheek" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#C2410C" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#C2410C" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Saree body */}
      <path d="M 38 158 Q 55 144 72 140 Q 86 152 100 156 Q 114 152 128 140 Q 145 144 162 158 L 170 250 L 30 250 Z" fill="url(#pt-saree)" />
      {/* Saree gold border */}
      <path d="M 38 158 Q 55 144 72 140 Q 86 152 100 156 Q 114 152 128 140 Q 145 144 162 158" fill="none" stroke="url(#pt-border)" strokeWidth="4" />
      {/* Saree pallu drape across shoulder */}
      <path d="M 128 140 Q 148 130 162 138 L 168 170 Q 148 158 132 162 Z" fill="#EA580C" opacity="0.7" />
      {/* Saree gold trim details */}
      <path d="M 55 178 Q 72 185 88 178 Q 100 172 112 178 Q 128 185 145 178" fill="none" stroke="#FBBF24" strokeWidth="1.5" opacity="0.5" />
      <path d="M 50 196 Q 68 203 86 196 Q 100 190 114 196 Q 132 203 150 196" fill="none" stroke="#FBBF24" strokeWidth="1.2" opacity="0.35" />

      {/* White/silver hair – neat bun */}
      <ellipse cx="100" cy="58" rx="52" ry="42" fill="#E8E2DC" />
      <circle cx="100" cy="32" r="24" fill="#DDD6CE" />
      {/* Bun at back */}
      <circle cx="100" cy="22" r="16" fill="#E8E2DC" />
      <ellipse cx="100" cy="20" rx="12" ry="8" fill="#D6CFC8" />
      {/* Jasmine flowers in bun */}
      <circle cx="88" cy="16" r="4" fill="white" opacity="0.9" />
      <circle cx="96" cy="11" r="3.5" fill="white" opacity="0.85" />
      <circle cx="104" cy="11" r="3.5" fill="white" opacity="0.85" />
      <circle cx="112" cy="16" r="4" fill="white" opacity="0.9" />
      <circle cx="88" cy="16" r="2" fill="#FEF9C3" opacity="0.6" />
      <circle cx="96" cy="11" r="1.8" fill="#FEF9C3" opacity="0.6" />
      <circle cx="104" cy="11" r="1.8" fill="#FEF9C3" opacity="0.6" />
      <circle cx="112" cy="16" r="2" fill="#FEF9C3" opacity="0.6" />

      {/* Face – warm brown skin */}
      <ellipse cx="100" cy="100" rx="48" ry="52" fill="#C8825A" />
      <path d="M 62 110 Q 68 148 100 154 Q 132 148 138 110" fill="#C8825A" />

      {/* Warm rosy cheeks */}
      <circle cx="68" cy="112" r="14" fill="url(#pt-cheek)" />
      <circle cx="132" cy="112" r="14" fill="url(#pt-cheek)" />

      {/* Bindi – bright red dot */}
      <circle cx="100" cy="80" r="5" fill="#DC2626" />
      <circle cx="100" cy="80" r="3" fill="#EF4444" />

      {/* Eyes – warm, kind, slightly crinkled */}
      <ellipse cx="80" cy="96" rx="7" ry="7.5" fill="#3B1F0A" />
      <ellipse cx="120" cy="96" rx="7" ry="7.5" fill="#3B1F0A" />
      <circle cx="82" cy="93" r="2.5" fill="white" opacity="0.85" />
      <circle cx="122" cy="93" r="2.5" fill="white" opacity="0.85" />
      {/* Smile lines around eyes */}
      <path d="M 62 92 Q 60 96 62 100" fill="none" stroke="#A0622A" strokeWidth="1" opacity="0.5" />
      <path d="M 138 92 Q 140 96 138 100" fill="none" stroke="#A0622A" strokeWidth="1" opacity="0.5" />

      {/* Eyebrows – gentle, slightly arched */}
      <path d="M 70 84 Q 80 78 90 83" fill="none" stroke="#3B1F0A" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M 110 83 Q 120 78 130 84" fill="none" stroke="#3B1F0A" strokeWidth="2.5" strokeLinecap="round" />

      {/* Nose */}
      <path d="M 97 106 Q 100 112 103 106" fill="none" stroke="#A0622A" strokeWidth="1.5" strokeLinecap="round" />
      {/* Small nose stud */}
      <circle cx="108" cy="108" r="2.5" fill="#FBBF24" opacity="0.8" />

      {/* Warm, wide smile */}
      <path d="M 80 122 Q 100 140 120 122" fill="none" stroke="#7C2D12" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="76" cy="120" r="2" fill="#A0622A" opacity="0.3" />
      <circle cx="124" cy="120" r="2" fill="#A0622A" opacity="0.3" />

      {/* Gold earrings – jhumka style */}
      <circle cx="54" cy="108" r="6" fill="#FBBF24" />
      <path d="M 51 113 Q 54 124 57 113" fill="#F59E0B" />
      <circle cx="54" cy="125" r="3" fill="#FBBF24" />
      <circle cx="146" cy="108" r="6" fill="#FBBF24" />
      <path d="M 143 113 Q 146 124 149 113" fill="#F59E0B" />
      <circle cx="146" cy="125" r="3" fill="#FBBF24" />

      {/* Gold necklace */}
      <path d="M 68 144 Q 100 155 132 144" fill="none" stroke="#FBBF24" strokeWidth="2.5" opacity="0.75" />
      <circle cx="100" cy="155" r="4" fill="#FBBF24" opacity="0.8" />
    </svg>
  );
};

/* ─── Dadi ─── warm Hindi grandmother, teal saree, dupatta, maang tikka, sindoor */
const Dadi = ({ size }: { size: string }) => {
  const w = size === "story" ? 260 : 135;
  return (
    <svg viewBox="0 0 200 250" width={w} height={w * 1.25} aria-label="Dadi">
      <defs>
        <linearGradient id="dd-saree" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0E7490" />
          <stop offset="100%" stopColor="#164E63" />
        </linearGradient>
        <linearGradient id="dd-dupatta" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#0891B2" stopOpacity="0.5" />
        </linearGradient>
        <radialGradient id="dd-cheek" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#0E7490" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#0E7490" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Saree body */}
      <path d="M 36 158 Q 54 144 70 140 Q 84 152 100 156 Q 116 152 130 140 Q 146 144 164 158 L 172 250 L 28 250 Z" fill="url(#dd-saree)" />
      {/* Gold saree border */}
      <path d="M 36 158 Q 54 144 70 140 Q 84 152 100 156 Q 116 152 130 140 Q 146 144 164 158" fill="none" stroke="#FBBF24" strokeWidth="3.5" />
      {/* Saree fold lines */}
      <path d="M 52 176 Q 68 182 84 176 Q 100 170 116 176 Q 132 182 148 176" fill="none" stroke="#FBBF24" strokeWidth="1.2" opacity="0.4" />
      <path d="M 48 194 Q 66 200 84 194 Q 100 188 116 194 Q 134 200 152 194" fill="none" stroke="#FBBF24" strokeWidth="1" opacity="0.3" />

      {/* Dupatta draped over head */}
      <path d="M 48 68 Q 30 80 28 110 Q 30 140 40 155 L 36 158 Q 24 138 22 108 Q 20 78 44 60 Z" fill="url(#dd-dupatta)" />
      <path d="M 152 68 Q 170 80 172 110 Q 170 140 160 155 L 164 158 Q 176 138 178 108 Q 180 78 156 60 Z" fill="url(#dd-dupatta)" />
      <path d="M 44 60 Q 100 44 156 60 Q 160 68 155 72 Q 100 56 45 72 Z" fill="url(#dd-dupatta)" />

      {/* Hair — silver, parted in centre, bun at back */}
      <ellipse cx="100" cy="66" rx="50" ry="36" fill="#D1D5DB" />
      <path d="M 100 30 Q 98 45 100 66" fill="none" stroke="#9CA3AF" strokeWidth="3" />
      {/* Sindoor at parting */}
      <path d="M 100 30 Q 100 38 100 46" fill="none" stroke="#DC2626" strokeWidth="3" strokeLinecap="round" />
      {/* Bun */}
      <circle cx="100" cy="52" r="18" fill="#9CA3AF" />
      <ellipse cx="100" cy="50" rx="13" ry="9" fill="#D1D5DB" />

      {/* Face — warm North Indian complexion */}
      <ellipse cx="100" cy="102" rx="46" ry="50" fill="#D4A574" />
      <path d="M 64 112 Q 70 148 100 154 Q 130 148 136 112" fill="#D4A574" />

      {/* Cheeks */}
      <circle cx="68" cy="114" r="13" fill="url(#dd-cheek)" />
      <circle cx="132" cy="114" r="13" fill="url(#dd-cheek)" />

      {/* Bindi */}
      <circle cx="100" cy="82" r="5" fill="#DC2626" />
      <circle cx="100" cy="82" r="3" fill="#F87171" />

      {/* Maang tikka */}
      <circle cx="100" cy="70" r="4" fill="#FBBF24" />
      <circle cx="100" cy="70" r="2.5" fill="#FEF3C7" />
      <line x1="100" y1="70" x2="100" y2="78" stroke="#FBBF24" strokeWidth="1.5" />

      {/* Eyes — warm, kind, slightly hooded */}
      <ellipse cx="80" cy="98" rx="7" ry="7" fill="#3B1F0A" />
      <ellipse cx="120" cy="98" rx="7" ry="7" fill="#3B1F0A" />
      <circle cx="82" cy="95" r="2.5" fill="white" opacity="0.85" />
      <circle cx="122" cy="95" r="2.5" fill="white" opacity="0.85" />
      {/* Hooded upper lids */}
      <path d="M 73 95 Q 80 90 87 95" fill="none" stroke="#3B1F0A" strokeWidth="1.5" />
      <path d="M 113 95 Q 120 90 127 95" fill="none" stroke="#3B1F0A" strokeWidth="1.5" />

      {/* Eyebrows */}
      <path d="M 70 86 Q 80 80 90 85" fill="none" stroke="#3B1F0A" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M 110 85 Q 120 80 130 86" fill="none" stroke="#3B1F0A" strokeWidth="2.5" strokeLinecap="round" />

      {/* Nose */}
      <path d="M 97 108 Q 100 114 103 108" fill="none" stroke="#A0622A" strokeWidth="1.5" strokeLinecap="round" />

      {/* Warm smile — slightly reserved, deeply loving */}
      <path d="M 82 124 Q 100 138 118 124" fill="none" stroke="#7C2D12" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="78" cy="122" r="2" fill="#A0622A" opacity="0.25" />
      <circle cx="122" cy="122" r="2" fill="#A0622A" opacity="0.25" />

      {/* Earrings — long dangling style */}
      <circle cx="55" cy="106" r="5" fill="#FBBF24" />
      <rect x="52.5" y="110" width="5" height="14" rx="2.5" fill="#F59E0B" />
      <ellipse cx="55" cy="125" rx="5" ry="3.5" fill="#FBBF24" />
      <circle cx="145" cy="106" r="5" fill="#FBBF24" />
      <rect x="142.5" y="110" width="5" height="14" rx="2.5" fill="#F59E0B" />
      <ellipse cx="145" cy="125" rx="5" ry="3.5" fill="#FBBF24" />

      {/* Gold necklace with pendant */}
      <path d="M 66 144 Q 100 156 134 144" fill="none" stroke="#FBBF24" strokeWidth="2" opacity="0.7" />
      <path d="M 90 152 Q 100 160 110 152" fill="none" stroke="#FBBF24" strokeWidth="2" opacity="0.7" />
      <circle cx="100" cy="162" r="5" fill="#FBBF24" opacity="0.85" />
      <circle cx="100" cy="162" r="2.5" fill="#FEF3C7" />
    </svg>
  );
};

/* ─── Dragon Blaze ─── round, friendly, huge eyes, tiny wings, big grin */
const DragonBlaze = ({ size }: { size: string }) => {
  const w = size === "story" ? 260 : 135;
  return (
    <svg viewBox="0 0 200 240" width={w} height={w * 1.2} aria-label="Dragon Blaze">
      <defs>
        <radialGradient id="db-belly" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#FEF3C7" />
          <stop offset="100%" stopColor="#FED7AA" />
        </radialGradient>
        <linearGradient id="db-scale" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FB923C" />
          <stop offset="100%" stopColor="#EA580C" />
        </linearGradient>
      </defs>

      {/* Tiny wings – comically small */}
      <g transform="translate(22, 105)">
        <path d="M 8 15 Q -8 -15 8 -25 Q 18 -10 20 0 Q 14 -8 8 -5 Q 16 2 18 12 Z" fill="#F97316" opacity="0.75" />
        <path d="M 10 10 Q 2 -5 10 -15 Q 16 -5 16 5 Z" fill="#FDBA74" opacity="0.5" />
      </g>
      <g transform="translate(178, 105) scale(-1, 1)">
        <path d="M 8 15 Q -8 -15 8 -25 Q 18 -10 20 0 Q 14 -8 8 -5 Q 16 2 18 12 Z" fill="#F97316" opacity="0.75" />
        <path d="M 10 10 Q 2 -5 10 -15 Q 16 -5 16 5 Z" fill="#FDBA74" opacity="0.5" />
      </g>

      {/* Horns */}
      <path d="M 62 52 Q 50 20 58 5" fill="#EA580C" stroke="#C2410C" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M 138 52 Q 150 20 142 5" fill="#EA580C" stroke="#C2410C" strokeWidth="1.5" strokeLinecap="round" />

      {/* Head spikes */}
      <path d="M 82 38 L 86 12 L 92 38" fill="#FB923C" />
      <path d="M 96 34 L 100 6 L 104 34" fill="#F97316" />
      <path d="M 108 38 L 114 14 L 118 40" fill="#FB923C" />

      {/* Big round head */}
      <ellipse cx="100" cy="95" rx="60" ry="62" fill="url(#db-scale)" />

      {/* Belly/chin – lighter cream */}
      <ellipse cx="100" cy="112" rx="40" ry="38" fill="url(#db-belly)" />

      {/* Scale texture on forehead */}
      <path d="M 75 60 Q 80 55 85 60" fill="none" stroke="#EA580C" strokeWidth="1.2" opacity="0.4" />
      <path d="M 90 55 Q 95 50 100 55" fill="none" stroke="#EA580C" strokeWidth="1.2" opacity="0.4" />
      <path d="M 105 58 Q 110 53 115 58" fill="none" stroke="#EA580C" strokeWidth="1.2" opacity="0.4" />

      {/* HUGE eyes */}
      <ellipse cx="74" cy="85" rx="18" ry="20" fill="white" />
      <ellipse cx="126" cy="85" rx="18" ry="20" fill="white" />
      {/* Irises */}
      <ellipse cx="78" cy="88" rx="10" ry="12" fill="#9A3412" />
      <ellipse cx="122" cy="88" rx="10" ry="12" fill="#9A3412" />
      {/* Pupils */}
      <ellipse cx="80" cy="86" rx="5" ry="6" fill="#451A03" />
      <ellipse cx="120" cy="86" rx="5" ry="6" fill="#451A03" />
      {/* Eye highlights */}
      <circle cx="83" cy="81" r="4.5" fill="white" opacity="0.9" />
      <circle cx="123" cy="81" r="4.5" fill="white" opacity="0.9" />
      <circle cx="76" cy="90" r="2" fill="white" opacity="0.4" />
      <circle cx="118" cy="90" r="2" fill="white" opacity="0.4" />

      {/* Nostrils */}
      <ellipse cx="90" cy="106" rx="5" ry="4" fill="#C2410C" />
      <ellipse cx="110" cy="106" rx="5" ry="4" fill="#C2410C" />
      {/* Smoke puffs */}
      <circle cx="84" cy="99" r="3.5" fill="#E5E7EB" opacity="0.35">
        <animate attributeName="cy" values="99;94;99" dur="3s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.35;0.1;0.35" dur="3s" repeatCount="indefinite" />
      </circle>
      <circle cx="116" cy="99" r="3" fill="#E5E7EB" opacity="0.3">
        <animate attributeName="cy" values="99;95;99" dur="2.5s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.3;0.08;0.3" dur="2.5s" repeatCount="indefinite" />
      </circle>

      {/* Wide grin */}
      <path d="M 68 122 Q 100 155 132 122" fill="#FDE68A" stroke="#9A3412" strokeWidth="2.5" strokeLinecap="round" />
      {/* Teeth – big friendly fangs */}
      <path d="M 74 122 L 80 133 L 86 122" fill="white" />
      <path d="M 114 122 L 120 133 L 126 122" fill="white" />
      {/* Tongue */}
      <ellipse cx="100" cy="140" rx="12" ry="8" fill="#F87171" opacity="0.6" />

      {/* Body */}
      <path d="M 48 152 Q 60 148 100 158 Q 140 148 152 152 L 162 240 L 38 240 Z" fill="url(#db-scale)" />
      {/* Belly */}
      <path d="M 62 158 Q 80 165 100 168 Q 120 165 138 158 L 142 240 L 58 240 Z" fill="url(#db-belly)" />
      {/* Belly scale lines */}
      <path d="M 72 180 Q 86 186 100 180 Q 114 186 128 180" fill="none" stroke="#F97316" strokeWidth="1.2" opacity="0.25" />
      <path d="M 70 195 Q 84 201 100 195 Q 116 201 130 195" fill="none" stroke="#F97316" strokeWidth="1.2" opacity="0.2" />
      <path d="M 68 210 Q 82 216 100 210 Q 118 216 132 210" fill="none" stroke="#F97316" strokeWidth="1.2" opacity="0.15" />
    </svg>
  );
};

/* ─── Ammamma ─── warm Telugu grandmother, red/gold sari, bindi, jasmine bun */
const Ammamma = ({ size }: { size: string }) => {
  const w = size === "story" ? 260 : 135;
  return (
    <svg viewBox="0 0 200 250" width={w} height={w * 1.25} aria-label="Ammamma">
      <defs>
        <linearGradient id="am-saree" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#DC2626" />
          <stop offset="100%" stopColor="#9B1C1C" />
        </linearGradient>
        <linearGradient id="am-border" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
        <radialGradient id="am-cheek" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#DC2626" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#DC2626" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Saree body */}
      <path d="M 38 158 Q 55 144 72 140 Q 86 152 100 156 Q 114 152 128 140 Q 145 144 162 158 L 170 250 L 30 250 Z" fill="url(#am-saree)" />
      {/* Gold border */}
      <path d="M 38 158 Q 55 144 72 140 Q 86 152 100 156 Q 114 152 128 140 Q 145 144 162 158" fill="none" stroke="url(#am-border)" strokeWidth="4" />
      {/* Pallu drape */}
      <path d="M 128 140 Q 148 130 162 138 L 168 170 Q 148 158 132 162 Z" fill="#EF4444" opacity="0.7" />
      {/* Gold trim lines */}
      <path d="M 55 178 Q 72 185 88 178 Q 100 172 112 178 Q 128 185 145 178" fill="none" stroke="#FBBF24" strokeWidth="1.5" opacity="0.5" />
      <path d="M 50 196 Q 68 203 86 196 Q 100 190 114 196 Q 132 203 150 196" fill="none" stroke="#FBBF24" strokeWidth="1.2" opacity="0.35" />
      {/* White hair neat bun */}
      <ellipse cx="100" cy="58" rx="52" ry="42" fill="#E8E2DC" />
      <circle cx="100" cy="32" r="24" fill="#DDD6CE" />
      <circle cx="100" cy="22" r="16" fill="#E8E2DC" />
      <ellipse cx="100" cy="20" rx="12" ry="8" fill="#D6CFC8" />
      {/* Lotus flowers in bun */}
      <circle cx="88" cy="16" r="4" fill="#FCA5A5" opacity="0.9" />
      <circle cx="96" cy="11" r="3.5" fill="#FCA5A5" opacity="0.85" />
      <circle cx="104" cy="11" r="3.5" fill="#FCA5A5" opacity="0.85" />
      <circle cx="112" cy="16" r="4" fill="#FCA5A5" opacity="0.9" />
      <circle cx="88" cy="16" r="2" fill="#FBBF24" opacity="0.6" />
      <circle cx="104" cy="11" r="1.8" fill="#FBBF24" opacity="0.6" />
      {/* Face warm brown */}
      <ellipse cx="100" cy="100" rx="48" ry="52" fill="#C8825A" />
      <path d="M 62 110 Q 68 148 100 154 Q 132 148 138 110" fill="#C8825A" />
      {/* Cheeks */}
      <circle cx="68" cy="112" r="14" fill="url(#am-cheek)" />
      <circle cx="132" cy="112" r="14" fill="url(#am-cheek)" />
      {/* Bindi red */}
      <circle cx="100" cy="80" r="5" fill="#DC2626" />
      <circle cx="100" cy="80" r="3" fill="#FCA5A5" />
      {/* Eyes kind */}
      <ellipse cx="80" cy="96" rx="7" ry="7.5" fill="#3B1F0A" />
      <ellipse cx="120" cy="96" rx="7" ry="7.5" fill="#3B1F0A" />
      <circle cx="82" cy="93" r="2.5" fill="white" opacity="0.85" />
      <circle cx="122" cy="93" r="2.5" fill="white" opacity="0.85" />
      {/* Smile lines */}
      <path d="M 62 92 Q 60 96 62 100" fill="none" stroke="#A0622A" strokeWidth="1" opacity="0.5" />
      <path d="M 138 92 Q 140 96 138 100" fill="none" stroke="#A0622A" strokeWidth="1" opacity="0.5" />
      {/* Eyebrows */}
      <path d="M 70 84 Q 80 78 90 83" fill="none" stroke="#3B1F0A" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M 110 83 Q 120 78 130 84" fill="none" stroke="#3B1F0A" strokeWidth="2.5" strokeLinecap="round" />
      {/* Nose + stud */}
      <path d="M 97 106 Q 100 112 103 106" fill="none" stroke="#A0622A" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="108" cy="108" r="2.5" fill="#FBBF24" opacity="0.8" />
      {/* Warm wide smile */}
      <path d="M 80 122 Q 100 140 120 122" fill="none" stroke="#7C2D12" strokeWidth="2.5" strokeLinecap="round" />
      {/* Gold jhumka earrings */}
      <circle cx="54" cy="108" r="6" fill="#FBBF24" />
      <path d="M 51 113 Q 54 124 57 113" fill="#F59E0B" />
      <circle cx="54" cy="125" r="3" fill="#FBBF24" />
      <circle cx="146" cy="108" r="6" fill="#FBBF24" />
      <path d="M 143 113 Q 146 124 149 113" fill="#F59E0B" />
      <circle cx="146" cy="125" r="3" fill="#FBBF24" />
      {/* Necklace */}
      <path d="M 68 144 Q 100 155 132 144" fill="none" stroke="#FBBF24" strokeWidth="2.5" opacity="0.75" />
      <circle cx="100" cy="155" r="4" fill="#FBBF24" opacity="0.8" />
    </svg>
  );
};

/* ─── Aaji ─── Marathi grandmother, green/gold sari, gentle expression */
const Aaji = ({ size }: { size: string }) => {
  const w = size === "story" ? 260 : 135;
  return (
    <svg viewBox="0 0 200 250" width={w} height={w * 1.25} aria-label="Aaji">
      <defs>
        <linearGradient id="aj-saree" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#15803D" />
          <stop offset="100%" stopColor="#14532D" />
        </linearGradient>
        <linearGradient id="aj-border" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
        <radialGradient id="aj-cheek" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#15803D" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#15803D" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Saree body */}
      <path d="M 38 158 Q 55 144 72 140 Q 86 152 100 156 Q 114 152 128 140 Q 145 144 162 158 L 170 250 L 30 250 Z" fill="url(#aj-saree)" />
      <path d="M 38 158 Q 55 144 72 140 Q 86 152 100 156 Q 114 152 128 140 Q 145 144 162 158" fill="none" stroke="url(#aj-border)" strokeWidth="4" />
      {/* Nauvari-style extra drape across front */}
      <path d="M 62 160 Q 80 170 100 172 Q 120 170 138 160 L 140 185 Q 120 178 100 180 Q 80 178 60 185 Z" fill="#16A34A" opacity="0.5" />
      <path d="M 55 178 Q 72 185 88 178 Q 100 172 112 178 Q 128 185 145 178" fill="none" stroke="#FBBF24" strokeWidth="1.5" opacity="0.45" />
      {/* White silver hair bun */}
      <ellipse cx="100" cy="58" rx="52" ry="42" fill="#E8E2DC" />
      <circle cx="100" cy="32" r="24" fill="#DDD6CE" />
      <circle cx="100" cy="22" r="16" fill="#E8E2DC" />
      <ellipse cx="100" cy="20" rx="12" ry="8" fill="#D6CFC8" />
      {/* Marigold flowers */}
      <circle cx="88" cy="16" r="4" fill="#FCD34D" opacity="0.9" />
      <circle cx="96" cy="11" r="3.5" fill="#FCD34D" opacity="0.85" />
      <circle cx="104" cy="11" r="3.5" fill="#FBBF24" opacity="0.85" />
      <circle cx="112" cy="16" r="4" fill="#FCD34D" opacity="0.9" />
      <circle cx="88" cy="16" r="2" fill="#F59E0B" opacity="0.6" />
      {/* Face warm */}
      <ellipse cx="100" cy="100" rx="48" ry="52" fill="#C8825A" />
      <path d="M 62 110 Q 68 148 100 154 Q 132 148 138 110" fill="#C8825A" />
      <circle cx="68" cy="112" r="14" fill="url(#aj-cheek)" />
      <circle cx="132" cy="112" r="14" fill="url(#aj-cheek)" />
      {/* Bindi small green */}
      <circle cx="100" cy="80" r="4.5" fill="#15803D" />
      <circle cx="100" cy="80" r="2.5" fill="#86EFAC" />
      {/* Eyes gentle */}
      <ellipse cx="80" cy="96" rx="7" ry="7.5" fill="#3B1F0A" />
      <ellipse cx="120" cy="96" rx="7" ry="7.5" fill="#3B1F0A" />
      <circle cx="82" cy="93" r="2.5" fill="white" opacity="0.85" />
      <circle cx="122" cy="93" r="2.5" fill="white" opacity="0.85" />
      <path d="M 62 92 Q 60 96 62 100" fill="none" stroke="#A0622A" strokeWidth="1" opacity="0.5" />
      <path d="M 138 92 Q 140 96 138 100" fill="none" stroke="#A0622A" strokeWidth="1" opacity="0.5" />
      <path d="M 70 84 Q 80 78 90 83" fill="none" stroke="#3B1F0A" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M 110 83 Q 120 78 130 84" fill="none" stroke="#3B1F0A" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M 97 106 Q 100 112 103 106" fill="none" stroke="#A0622A" strokeWidth="1.5" strokeLinecap="round" />
      {/* Gentle smile */}
      <path d="M 82 122 Q 100 138 118 122" fill="none" stroke="#14532D" strokeWidth="2.5" strokeLinecap="round" />
      {/* Earrings */}
      <circle cx="54" cy="108" r="6" fill="#FBBF24" />
      <path d="M 51 113 Q 54 122 57 113" fill="#F59E0B" />
      <circle cx="54" cy="123" r="3" fill="#FBBF24" />
      <circle cx="146" cy="108" r="6" fill="#FBBF24" />
      <path d="M 143 113 Q 146 122 149 113" fill="#F59E0B" />
      <circle cx="146" cy="123" r="3" fill="#FBBF24" />
      <path d="M 68 144 Q 100 155 132 144" fill="none" stroke="#FBBF24" strokeWidth="2.5" opacity="0.7" />
      <circle cx="100" cy="155" r="4" fill="#FBBF24" opacity="0.8" />
    </svg>
  );
};

/* ─── Dida ─── Bengali grandmother, white sari with blue border, bun, kind eyes */
const Dida = ({ size }: { size: string }) => {
  const w = size === "story" ? 260 : 135;
  return (
    <svg viewBox="0 0 200 250" width={w} height={w * 1.25} aria-label="Dida">
      <defs>
        <linearGradient id="di-saree" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#F8FAFC" />
          <stop offset="100%" stopColor="#E2E8F0" />
        </linearGradient>
        <radialGradient id="di-cheek" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#1D4ED8" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#1D4ED8" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* White saree body */}
      <path d="M 38 158 Q 55 144 72 140 Q 86 152 100 156 Q 114 152 128 140 Q 145 144 162 158 L 170 250 L 30 250 Z" fill="url(#di-saree)" />
      {/* Blue border */}
      <path d="M 38 158 Q 55 144 72 140 Q 86 152 100 156 Q 114 152 128 140 Q 145 144 162 158" fill="none" stroke="#1D4ED8" strokeWidth="5" />
      <path d="M 38 158 Q 55 144 72 140 Q 86 152 100 156 Q 114 152 128 140 Q 145 144 162 158" fill="none" stroke="#93C5FD" strokeWidth="2" opacity="0.6" />
      {/* Blue trim lines on white saree */}
      <path d="M 55 178 Q 72 185 88 178 Q 100 172 112 178 Q 128 185 145 178" fill="none" stroke="#1D4ED8" strokeWidth="1.5" opacity="0.4" />
      <path d="M 50 196 Q 68 203 86 196 Q 100 190 114 196 Q 132 203 150 196" fill="none" stroke="#1D4ED8" strokeWidth="1.2" opacity="0.3" />
      {/* White/silver hair tight bun */}
      <ellipse cx="100" cy="60" rx="50" ry="40" fill="#E8E2DC" />
      <circle cx="100" cy="36" r="22" fill="#DDD6CE" />
      <circle cx="100" cy="25" r="15" fill="#E8E2DC" />
      <ellipse cx="100" cy="23" rx="11" ry="7" fill="#D6CFC8" />
      {/* Earthen lamp / sindoor dot */}
      <circle cx="88" cy="18" r="3" fill="#FCA5A5" opacity="0.7" />
      <circle cx="100" cy="13" r="3" fill="#FCA5A5" opacity="0.7" />
      <circle cx="112" cy="18" r="3" fill="#FCA5A5" opacity="0.7" />
      {/* Face light warm */}
      <ellipse cx="100" cy="100" rx="48" ry="52" fill="#D4A574" />
      <path d="M 62 110 Q 68 148 100 154 Q 132 148 138 110" fill="#D4A574" />
      <circle cx="68" cy="112" r="13" fill="url(#di-cheek)" />
      <circle cx="132" cy="112" r="13" fill="url(#di-cheek)" />
      {/* Bindi blue */}
      <circle cx="100" cy="80" r="4.5" fill="#1D4ED8" />
      <circle cx="100" cy="80" r="2.5" fill="#93C5FD" />
      {/* Kind eyes */}
      <ellipse cx="80" cy="96" rx="7" ry="7.5" fill="#3B1F0A" />
      <ellipse cx="120" cy="96" rx="7" ry="7.5" fill="#3B1F0A" />
      <circle cx="82" cy="93" r="2.5" fill="white" opacity="0.85" />
      <circle cx="122" cy="93" r="2.5" fill="white" opacity="0.85" />
      {/* Crow's feet */}
      <path d="M 62 92 Q 60 96 62 100" fill="none" stroke="#A0622A" strokeWidth="1" opacity="0.5" />
      <path d="M 138 92 Q 140 96 138 100" fill="none" stroke="#A0622A" strokeWidth="1" opacity="0.5" />
      <path d="M 70 84 Q 80 78 90 83" fill="none" stroke="#3B1F0A" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M 110 83 Q 120 78 130 84" fill="none" stroke="#3B1F0A" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M 97 106 Q 100 112 103 106" fill="none" stroke="#A0622A" strokeWidth="1.5" strokeLinecap="round" />
      {/* Warm smile */}
      <path d="M 82 122 Q 100 138 118 122" fill="none" stroke="#1E3A8A" strokeWidth="2.5" strokeLinecap="round" />
      {/* Simple silver earrings */}
      <circle cx="54" cy="108" r="5" fill="#93C5FD" />
      <circle cx="54" cy="108" r="3" fill="#1D4ED8" />
      <circle cx="146" cy="108" r="5" fill="#93C5FD" />
      <circle cx="146" cy="108" r="3" fill="#1D4ED8" />
      {/* Thin blue-gold necklace */}
      <path d="M 68 144 Q 100 154 132 144" fill="none" stroke="#1D4ED8" strokeWidth="2" opacity="0.6" />
      <circle cx="100" cy="154" r="4" fill="#1D4ED8" opacity="0.7" />
    </svg>
  );
};

/* ─── Count Cosmo ─── friendly astronaut, helmet, stars, numbers */
const CountCosmo = ({ size }: { size: string }) => {
  const w = size === "story" ? 260 : 135;
  return (
    <svg viewBox="0 0 200 250" width={w} height={w * 1.25} aria-label="Count Cosmo">
      <defs>
        <linearGradient id="cc-suit" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#6D28D9" />
          <stop offset="100%" stopColor="#4C1D95" />
        </linearGradient>
        <radialGradient id="cc-visor" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#BFDBFE" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.4" />
        </radialGradient>
        <linearGradient id="cc-helmet" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#E0E7FF" />
          <stop offset="100%" stopColor="#C7D2FE" />
        </linearGradient>
      </defs>
      {/* Suit body */}
      <path d="M 42 158 L 60 145 L 100 162 L 140 145 L 158 158 L 166 250 L 34 250 Z" fill="url(#cc-suit)" />
      {/* Suit collar ring */}
      <ellipse cx="100" cy="155" rx="42" ry="12" fill="#7C3AED" />
      <ellipse cx="100" cy="155" rx="38" ry="9" fill="#8B5CF6" />
      {/* Number patch on suit */}
      <rect x="62" y="170" width="24" height="18" rx="4" fill="#FBBF24" />
      <text x="74" y="183" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#4C1D95">123</text>
      {/* Stars on suit */}
      <text x="120" y="185" fontSize="12" fill="#FCD34D">★</text>
      <text x="134" y="200" fontSize="9" fill="#A5B4FC">✦</text>
      <text x="55" y="200" fontSize="9" fill="#A5B4FC">✦</text>
      {/* Gloves */}
      <ellipse cx="38" cy="172" rx="14" ry="10" fill="#7C3AED" />
      <ellipse cx="162" cy="172" rx="14" ry="10" fill="#7C3AED" />
      {/* Helmet outer */}
      <ellipse cx="100" cy="88" rx="62" ry="66" fill="url(#cc-helmet)" />
      {/* Visor */}
      <ellipse cx="100" cy="92" rx="44" ry="46" fill="url(#cc-visor)" />
      {/* Face inside visor */}
      <ellipse cx="100" cy="98" rx="30" ry="32" fill="#FDDCB5" />
      {/* Big happy eyes */}
      <ellipse cx="88" cy="92" rx="8" ry="9" fill="#1E3A8A" />
      <ellipse cx="112" cy="92" rx="8" ry="9" fill="#1E3A8A" />
      <circle cx="91" cy="88" r="3.5" fill="white" opacity="0.9" />
      <circle cx="115" cy="88" r="3.5" fill="white" opacity="0.9" />
      {/* Big smile */}
      <path d="M 84 108 Q 100 122 116 108" fill="white" stroke="#1E3A8A" strokeWidth="2" strokeLinecap="round" />
      {/* Nose */}
      <path d="M 98 100 Q 100 104 102 100" fill="none" stroke="#D4A574" strokeWidth="1.5" strokeLinecap="round" />
      {/* Helmet star badge */}
      <text x="94" y="52" fontSize="16" fill="#FBBF24">★</text>
      {/* Floating numbers around */}
      <text x="22" y="80" fontSize="14" fill="#7C3AED" opacity="0.6">3</text>
      <text x="164" y="75" fontSize="14" fill="#7C3AED" opacity="0.6">7</text>
      <text x="28" y="115" fontSize="12" fill="#A5B4FC" opacity="0.5">+</text>
      <text x="160" y="112" fontSize="12" fill="#A5B4FC" opacity="0.5">2</text>
      {/* Antenna on helmet */}
      <line x1="100" y1="24" x2="100" y2="10" stroke="#8B5CF6" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="100" cy="8" r="5" fill="#FBBF24" />
    </svg>
  );
};

/* ─── Dr. Luna ─── scientist, lab coat, sunflower, magnifying glass */
const DrLuna = ({ size }: { size: string }) => {
  const w = size === "story" ? 260 : 135;
  return (
    <svg viewBox="0 0 200 250" width={w} height={w * 1.25} aria-label="Dr. Luna">
      <defs>
        <linearGradient id="dl-coat" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F0FDF4" />
        </linearGradient>
        <linearGradient id="dl-hair" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#5B21B6" />
        </linearGradient>
      </defs>
      {/* Lab coat body */}
      <path d="M 42 152 L 58 140 L 100 158 L 142 140 L 158 152 L 168 250 L 32 250 Z" fill="url(#dl-coat)" />
      {/* Coat lapels */}
      <path d="M 58 140 L 82 165 L 78 250" fill="#E2E8F0" />
      <path d="M 142 140 L 118 165 L 122 250" fill="#E2E8F0" />
      <line x1="100" y1="165" x2="100" y2="250" stroke="#D1D5DB" strokeWidth="1" />
      {/* Pocket with leaf/flower */}
      <rect x="112" y="175" width="20" height="22" rx="3" fill="none" stroke="#D1D5DB" strokeWidth="1.5" />
      <text x="116" y="191" fontSize="14">🌿</text>
      {/* Name badge */}
      <rect x="60" y="165" width="26" height="16" rx="3" fill="#DCFCE7" stroke="#86EFAC" strokeWidth="1" />
      <text x="73" y="177" textAnchor="middle" fontSize="7" fill="#14532D" fontWeight="bold">DR. LUNA</text>
      {/* Hair — curly lavender */}
      <ellipse cx="100" cy="55" rx="56" ry="44" fill="url(#dl-hair)" />
      <circle cx="56" cy="62" rx="18" ry="20" r="18" fill="#7C3AED" />
      <circle cx="144" cy="62" r="18" fill="#7C3AED" />
      <ellipse cx="100" cy="30" rx="38" ry="22" fill="#8B5CF6" />
      {/* Curls */}
      <circle cx="58" cy="58" r="10" fill="none" stroke="#A78BFA" strokeWidth="3" opacity="0.5" />
      <circle cx="142" cy="58" r="10" fill="none" stroke="#A78BFA" strokeWidth="3" opacity="0.5" />
      {/* Face */}
      <ellipse cx="100" cy="100" rx="46" ry="50" fill="#FDDCB5" />
      {/* Round glasses */}
      <circle cx="82" cy="96" r="14" fill="rgba(220,252,231,0.4)" stroke="#0D9488" strokeWidth="2.5" />
      <circle cx="118" cy="96" r="14" fill="rgba(220,252,231,0.4)" stroke="#0D9488" strokeWidth="2.5" />
      <line x1="96" y1="96" x2="104" y2="96" stroke="#0D9488" strokeWidth="2.5" />
      <line x1="68" y1="90" x2="56" y2="84" stroke="#0D9488" strokeWidth="2" />
      <line x1="132" y1="90" x2="144" y2="84" stroke="#0D9488" strokeWidth="2" />
      {/* Curious eyes */}
      <ellipse cx="82" cy="95" rx="6" ry="7" fill="#065F46" />
      <ellipse cx="118" cy="95" rx="6" ry="7" fill="#065F46" />
      <circle cx="84" cy="92" r="2.5" fill="white" opacity="0.9" />
      <circle cx="120" cy="92" r="2.5" fill="white" opacity="0.9" />
      {/* Eyebrows raised */}
      <path d="M 68 82 Q 82 74 96 82" fill="none" stroke="#5B21B6" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M 104 82 Q 118 74 132 82" fill="none" stroke="#5B21B6" strokeWidth="2.5" strokeLinecap="round" />
      {/* Nose */}
      <path d="M 98 104 Q 100 110 102 104" fill="none" stroke="#C9A068" strokeWidth="1.5" strokeLinecap="round" />
      {/* Wonder smile */}
      <path d="M 82 116 Q 100 132 118 116" fill="none" stroke="#0D9488" strokeWidth="2.5" strokeLinecap="round" />
      {/* Magnifying glass */}
      <circle cx="158" cy="135" r="16" fill="none" stroke="#0D9488" strokeWidth="3" />
      <circle cx="158" cy="135" r="14" fill="rgba(220,252,231,0.3)" />
      <line x1="169" y1="146" x2="178" y2="160" stroke="#0D9488" strokeWidth="4" strokeLinecap="round" />
      {/* Sunflower in hair */}
      <circle cx="140" cy="40" r="8" fill="#FBBF24" />
      <circle cx="140" cy="40" r="4" fill="#92400E" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a, i) => (
        <ellipse
          key={i}
          cx={140 + Math.cos((a * Math.PI) / 180) * 10}
          cy={40 + Math.sin((a * Math.PI) / 180) * 10}
          rx="3.5"
          ry="5"
          fill="#FCD34D"
          transform={`rotate(${a} ${140 + Math.cos((a * Math.PI) / 180) * 10} ${40 + Math.sin((a * Math.PI) / 180) * 10})`}
        />
      ))}
    </svg>
  );
};

/* ─── Professor Pip ─── owl, graduation cap, glasses, book */
const ProfessorPip = ({ size }: { size: string }) => {
  const w = size === "story" ? 260 : 135;
  return (
    <svg viewBox="0 0 200 250" width={w} height={w * 1.25} aria-label="Professor Pip">
      <defs>
        <linearGradient id="pp-body" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#92400E" />
        </linearGradient>
        <linearGradient id="pp-book" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
      </defs>
      {/* Owl body */}
      <ellipse cx="100" cy="170" rx="55" ry="65" fill="url(#pp-body)" />
      {/* Belly */}
      <ellipse cx="100" cy="178" rx="35" ry="45" fill="#FEF3C7" />
      {/* Feather texture on belly */}
      <path d="M 76 160 Q 88 168 100 162 Q 112 168 124 160" fill="none" stroke="#FBBF24" strokeWidth="1.5" opacity="0.5" />
      <path d="M 74 175 Q 87 183 100 177 Q 113 183 126 175" fill="none" stroke="#FBBF24" strokeWidth="1.5" opacity="0.4" />
      {/* Wings */}
      <path d="M 46 150 Q 24 135 28 105 Q 36 90 52 100 Q 48 120 55 140 Z" fill="#B45309" />
      <path d="M 154 150 Q 176 135 172 105 Q 164 90 148 100 Q 152 120 145 140 Z" fill="#B45309" />
      {/* Tail feathers */}
      <path d="M 80 230 Q 85 250 100 245 Q 115 250 120 230" fill="#92400E" />
      <path d="M 72 225 Q 72 248 80 245" fill="#B45309" />
      <path d="M 128 225 Q 128 248 120 245" fill="#B45309" />
      {/* Head */}
      <ellipse cx="100" cy="92" rx="52" ry="54" fill="url(#pp-body)" />
      {/* Face disc */}
      <ellipse cx="100" cy="96" rx="38" ry="38" fill="#FEF3C7" />
      {/* Ear tufts */}
      <path d="M 72 48 L 62 22 L 82 42" fill="#B45309" />
      <path d="M 128 48 L 138 22 L 118 42" fill="#B45309" />
      {/* BIG round eyes with glasses */}
      <circle cx="82" cy="92" r="18" fill="white" stroke="#78350F" strokeWidth="2" />
      <circle cx="118" cy="92" r="18" fill="white" stroke="#78350F" strokeWidth="2" />
      <line x1="100" y1="92" x2="100" y2="92" stroke="#78350F" strokeWidth="2" />
      <line x1="64" y1="86" x2="54" y2="80" stroke="#78350F" strokeWidth="2" />
      <line x1="136" y1="86" x2="146" y2="80" stroke="#78350F" strokeWidth="2" />
      {/* Amber irises */}
      <circle cx="82" cy="92" r="12" fill="#D97706" />
      <circle cx="118" cy="92" r="12" fill="#D97706" />
      <circle cx="82" cy="92" r="7" fill="#451A03" />
      <circle cx="118" cy="92" r="7" fill="#451A03" />
      <circle cx="86" cy="87" r="4" fill="white" opacity="0.9" />
      <circle cx="122" cy="87" r="4" fill="white" opacity="0.9" />
      {/* Beak */}
      <path d="M 94 106 L 100 118 L 106 106" fill="#FBBF24" />
      {/* Graduation cap */}
      <rect x="66" y="42" width="68" height="12" rx="2" fill="#1E3A8A" />
      <path d="M 75 42 L 100 18 L 125 42" fill="#1E3A8A" />
      <line x1="125" y1="42" x2="138" y2="56" stroke="#1E3A8A" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="138" cy="58" r="5" fill="#FBBF24" />
      {/* Book held in wing */}
      <rect x="136" y="155" width="28" height="36" rx="3" fill="url(#pp-book)" />
      <rect x="138" y="157" width="24" height="32" rx="2" fill="#FFFBEB" />
      <line x1="141" y1="163" x2="159" y2="163" stroke="#D97706" strokeWidth="1.5" opacity="0.6" />
      <line x1="141" y1="169" x2="159" y2="169" stroke="#D97706" strokeWidth="1.5" opacity="0.5" />
      <line x1="141" y1="175" x2="155" y2="175" stroke="#D97706" strokeWidth="1.5" opacity="0.4" />
      {/* Floating letters */}
      <text x="18" y="100" fontSize="16" fill="#D97706" opacity="0.5">A</text>
      <text x="168" y="95" fontSize="16" fill="#D97706" opacity="0.5">B</text>
      <text x="24" y="140" fontSize="13" fill="#FBBF24" opacity="0.4">c</text>
    </svg>
  );
};

/* ─── Arty ─── colorful child artist, paint-covered overalls, big smile */
const Arty = ({ size }: { size: string }) => {
  const w = size === "story" ? 260 : 135;
  return (
    <svg viewBox="0 0 200 250" width={w} height={w * 1.25} aria-label="Arty">
      <defs>
        <linearGradient id="ar-overalls" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#5B21B6" />
        </linearGradient>
        <radialGradient id="ar-palette" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stopColor="#FEF3C7" />
          <stop offset="100%" stopColor="#FDE68A" />
        </radialGradient>
      </defs>
      {/* Overalls body */}
      <path d="M 44 152 L 62 140 L 100 158 L 138 140 L 156 152 L 164 250 L 36 250 Z" fill="url(#ar-overalls)" />
      {/* Paint splats on overalls */}
      <ellipse cx="70" cy="180" rx="8" ry="5" fill="#EF4444" opacity="0.7" transform="rotate(-15 70 180)" />
      <ellipse cx="130" cy="175" rx="6" ry="4" fill="#FBBF24" opacity="0.8" transform="rotate(10 130 175)" />
      <ellipse cx="82" cy="205" rx="7" ry="4" fill="#10B981" opacity="0.6" transform="rotate(5 82 205)" />
      <ellipse cx="120" cy="210" rx="5" ry="3" fill="#3B82F6" opacity="0.7" transform="rotate(-20 120 210)" />
      <ellipse cx="100" cy="195" rx="4" ry="3" fill="#F59E0B" opacity="0.6" />
      {/* Overalls straps */}
      <rect x="80" y="138" width="12" height="25" rx="5" fill="#6D28D9" />
      <rect x="108" y="138" width="12" height="25" rx="5" fill="#6D28D9" />
      {/* Shirt under */}
      <path d="M 62 140 L 80 138 L 80 150 L 62 148 Z" fill="#FCD34D" />
      <path d="M 120 138 L 138 140 L 138 148 L 120 150 Z" fill="#FCD34D" />
      {/* Hair — wild colorful curls */}
      <ellipse cx="100" cy="55" rx="56" ry="46" fill="#F97316" />
      <circle cx="55" cy="62" r="20" fill="#F97316" />
      <circle cx="145" cy="62" r="20" fill="#F97316" />
      <ellipse cx="100" cy="30" rx="42" ry="28" fill="#FB923C" />
      {/* Paint in hair */}
      <ellipse cx="68" cy="40" rx="8" ry="5" fill="#A855F7" opacity="0.6" transform="rotate(-20 68 40)" />
      <ellipse cx="132" cy="38" rx="7" ry="4" fill="#3B82F6" opacity="0.5" transform="rotate(15 132 38)" />
      <ellipse cx="100" cy="18" rx="6" ry="4" fill="#EF4444" opacity="0.5" />
      {/* Face */}
      <ellipse cx="100" cy="100" rx="46" ry="50" fill="#FDDCB5" />
      {/* Paint smudge on face */}
      <ellipse cx="72" cy="110" rx="8" ry="5" fill="#A855F7" opacity="0.3" transform="rotate(-10 72 110)" />
      <ellipse cx="130" cy="106" rx="6" ry="4" fill="#3B82F6" opacity="0.25" transform="rotate(5 130 106)" />
      {/* Big happy eyes */}
      <ellipse cx="82" cy="94" rx="8" ry="9" fill="#1E3A8A" />
      <ellipse cx="118" cy="94" rx="8" ry="9" fill="#1E3A8A" />
      <circle cx="85" cy="90" r="3.5" fill="white" opacity="0.9" />
      <circle cx="121" cy="90" r="3.5" fill="white" opacity="0.9" />
      {/* Eyebrows expressive */}
      <path d="M 70 82 Q 82 74 94 80" fill="none" stroke="#9A3412" strokeWidth="3" strokeLinecap="round" />
      <path d="M 106 80 Q 118 74 130 82" fill="none" stroke="#9A3412" strokeWidth="3" strokeLinecap="round" />
      {/* Nose */}
      <path d="M 97 102 Q 100 108 103 102" fill="none" stroke="#D4A574" strokeWidth="1.5" strokeLinecap="round" />
      {/* Big grin */}
      <path d="M 78 116 Q 100 138 122 116" fill="white" stroke="#9A3412" strokeWidth="2.5" strokeLinecap="round" />
      {/* Paint palette held up */}
      <ellipse cx="158" cy="140" rx="22" ry="18" fill="url(#ar-palette)" />
      <circle cx="148" cy="134" r="5" fill="#EF4444" />
      <circle cx="162" cy="130" r="5" fill="#FBBF24" />
      <circle cx="172" cy="140" r="5" fill="#10B981" />
      <circle cx="168" cy="152" r="5" fill="#3B82F6" />
      <circle cx="152" cy="154" r="5" fill="#A855F7" />
      <circle cx="158" cy="142" r="8" fill="#92400E" opacity="0.6" />
      {/* Paintbrush */}
      <line x1="38" y1="155" x2="28" y2="125" stroke="#92400E" strokeWidth="3" strokeLinecap="round" />
      <rect x="22" y="112" width="12" height="16" rx="2" fill="#EF4444" />
      <path d="M 25 112 Q 28 104 31 112" fill="#EF4444" />
      {/* Rainbow splash above */}
      <path d="M 58 28 Q 100 5 142 28" fill="none" stroke="#EF4444" strokeWidth="3" opacity="0.4" strokeLinecap="round" />
      <path d="M 62 34 Q 100 12 138 34" fill="none" stroke="#F97316" strokeWidth="3" opacity="0.35" strokeLinecap="round" />
      <path d="M 66 40 Q 100 20 134 40" fill="none" stroke="#FBBF24" strokeWidth="3" opacity="0.3" strokeLinecap="round" />
    </svg>
  );
};

const CharacterPortrait = ({ character, size = "card" }: Props) => {
  switch (character.id) {
    case "grandma-rose":
      return <GrandmaRose size={size} />;
    case "captain-leo":
      return <CaptainLeo size={size} />;
    case "fairy-sparkle":
      return <FairySparkle size={size} />;
    case "professor-whiz":
      return <ProfessorWhiz size={size} />;
    case "dragon-blaze":
      return <DragonBlaze size={size} />;
    case "paati":
      return <Paati size={size} />;
    case "dadi":
      return <Dadi size={size} />;
    case "ammamma":
      return <Ammamma size={size} />;
    case "aaji":
      return <Aaji size={size} />;
    case "dida":
      return <Dida size={size} />;
    case "count-cosmo":
      return <CountCosmo size={size} />;
    case "dr-luna":
      return <DrLuna size={size} />;
    case "professor-pip":
      return <ProfessorPip size={size} />;
    case "arty":
      return <Arty size={size} />;
    default:
      return null;
  }
};

export default CharacterPortrait;
