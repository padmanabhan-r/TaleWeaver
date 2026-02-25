const StorybookEmpty = () => (
  <div className="flex flex-col items-center justify-center gap-8">
    <svg viewBox="0 0 300 220" width={300} height={220} className="drop-shadow-lg" aria-label="Open storybook">
      <defs>
        <linearGradient id="sb-page-l" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FFF7ED" />
          <stop offset="100%" stopColor="#FFFBF5" />
        </linearGradient>
        <linearGradient id="sb-page-r" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FFFBF5" />
          <stop offset="100%" stopColor="#FFF7ED" />
        </linearGradient>
        <filter id="sb-shadow" x="-10%" y="-10%" width="120%" height="130%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#C084FC" floodOpacity="0.15" />
        </filter>
      </defs>

      <g filter="url(#sb-shadow)">
        {/* Book cover back */}
        <rect x="22" y="28" width="256" height="170" rx="6" fill="#DDD6FE" />

        {/* Spine */}
        <rect x="143" y="22" width="14" height="178" rx="3" fill="#C084FC" />

        {/* Left page */}
        <path d="M 143 26 Q 75 20 28 32 L 28 192 Q 75 182 143 186 Z" fill="url(#sb-page-l)" />
        {/* Right page */}
        <path d="M 157 26 Q 225 20 272 32 L 272 192 Q 225 182 157 186 Z" fill="url(#sb-page-r)" />

        {/* Left page – text lines fading */}
        <line x1="48" y1="60" x2="125" y2="57" stroke="#E9D5FF" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
        <line x1="52" y1="78" x2="120" y2="76" stroke="#E9D5FF" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
        <line x1="50" y1="96" x2="118" y2="94" stroke="#E9D5FF" strokeWidth="3" strokeLinecap="round" opacity="0.4" />
        <line x1="52" y1="114" x2="108" y2="112" stroke="#E9D5FF" strokeWidth="3" strokeLinecap="round" opacity="0.3" />
        <line x1="50" y1="132" x2="100" y2="130" stroke="#E9D5FF" strokeWidth="3" strokeLinecap="round" opacity="0.2" />

        {/* Right page – picture frame placeholder */}
        <rect x="175" y="48" width="75" height="60" rx="8" fill="#F5F3FF" stroke="#DDD6FE" strokeWidth="2" strokeDasharray="6 4" />
        {/* Little landscape inside frame */}
        <path d="M 185 98 Q 200 78 215 90 Q 230 75 240 98 Z" fill="#DDD6FE" opacity="0.4" />
        <circle cx="230" cy="60" r="6" fill="#FBBF24" opacity="0.25" />

        {/* Right page text lines */}
        <line x1="175" y1="122" x2="252" y2="120" stroke="#E9D5FF" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
        <line x1="178" y1="140" x2="245" y2="138" stroke="#E9D5FF" strokeWidth="3" strokeLinecap="round" opacity="0.4" />
        <line x1="176" y1="158" x2="235" y2="156" stroke="#E9D5FF" strokeWidth="3" strokeLinecap="round" opacity="0.3" />

        {/* Page curl hint – bottom right */}
        <path d="M 268 188 Q 262 196 252 198 Q 258 192 262 184" fill="#FFF7ED" stroke="#DDD6FE" strokeWidth="1" />
      </g>

      {/* Floating sparkle dots around the book */}
      <circle cx="16" cy="45" r="3" fill="#FBBF24" opacity="0.35">
        <animate attributeName="opacity" values="0.35;0.1;0.35" dur="3s" repeatCount="indefinite" />
      </circle>
      <circle cx="284" cy="40" r="2.5" fill="#C084FC" opacity="0.3">
        <animate attributeName="opacity" values="0.3;0.08;0.3" dur="2.5s" repeatCount="indefinite" />
      </circle>
      <circle cx="12" cy="180" r="2" fill="#C084FC" opacity="0.25">
        <animate attributeName="opacity" values="0.25;0.05;0.25" dur="3.5s" repeatCount="indefinite" />
      </circle>
      <circle cx="290" cy="175" r="2.5" fill="#FBBF24" opacity="0.3">
        <animate attributeName="opacity" values="0.3;0.08;0.3" dur="2.8s" repeatCount="indefinite" />
      </circle>
    </svg>

    <p className="font-comic-neue text-lg md:text-xl text-purple-400/80 text-center leading-relaxed">
      Story pictures will appear here...
    </p>
  </div>
);

export default StorybookEmpty;
