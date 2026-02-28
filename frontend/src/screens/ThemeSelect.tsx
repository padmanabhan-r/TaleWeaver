import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Character } from "@/characters";
import FloatingElements from "@/components/FloatingElements";

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "";

interface Props {
  character: Character;
  onBack: () => void;
  onConfirm: (theme: string, propImage?: string) => void;
}

/* ── Theme tiles ── */
const THEMES = [
  { emoji: "🦁", label: "Animals",   gradient: "from-amber-500/30 to-orange-600/30" },
  { emoji: "🚀", label: "Space",     gradient: "from-indigo-500/30 to-purple-600/30" },
  { emoji: "🏰", label: "Kingdoms",  gradient: "from-yellow-500/30 to-amber-600/30" },
  { emoji: "🌊", label: "Ocean",     gradient: "from-cyan-500/30 to-blue-600/30" },
  { emoji: "🍕", label: "Food",      gradient: "from-red-400/30 to-yellow-500/30" },
  { emoji: "🌳", label: "Jungle",    gradient: "from-green-500/30 to-emerald-600/30" },
  { emoji: "🦄", label: "Magic",     gradient: "from-pink-500/30 to-purple-500/30" },
  { emoji: "🤖", label: "Robots",    gradient: "from-slate-400/30 to-cyan-500/30" },
  { emoji: "🎃", label: "Spooky",    gradient: "from-orange-500/30 to-violet-600/30" },
  { emoji: "🏔️", label: "Adventure", gradient: "from-sky-400/30 to-teal-500/30" },
  { emoji: "🎪", label: "Circus",    gradient: "from-rose-500/30 to-yellow-400/30" },
  { emoji: "🦕", label: "Dinosaurs", gradient: "from-lime-500/30 to-green-600/30" },
];

type OptionId = "pick" | "camera" | "sketch";

/* ── Theme tile grid ── */
const ThemeTileGrid = ({
  selected,
  onSelect,
}: {
  selected: string | null;
  onSelect: (label: string) => void;
}) => (
  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
    {THEMES.map((t) => {
      const active = selected === t.label;
      return (
        <motion.button
          key={t.label}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelect(t.label)}
          className={`relative flex flex-col items-center justify-center gap-1 rounded-2xl p-4 border-2 transition-all duration-300 bg-gradient-to-br ${t.gradient} ${
            active
              ? "border-primary ring-4 ring-primary/40 scale-105 magic-glow"
              : "border-border/40 hover:border-primary/50"
          }`}
        >
          <span className="text-4xl">{t.emoji}</span>
          <span className="font-display text-sm font-bold text-foreground">{t.label}</span>
          {active && (
            <motion.div
              className="absolute -top-1 -right-1 text-lg"
              initial={{ scale: 0 }}
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 0.4 }}
            >
              ✨
            </motion.div>
          )}
        </motion.button>
      );
    })}
  </div>
);

/* ── Custom theme input ── */
const CustomThemeInput = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) => (
  <div className="mt-6">
    <p className="font-display text-lg font-bold text-foreground mb-2">Or dream up your own! 💭</p>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Type anything… a dragon chef? A moon princess?"
      className="w-full rounded-2xl border-2 border-border/40 bg-card/60 px-5 py-4 font-body text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/30 outline-none transition-all"
    />
  </div>
);

/* ── Sketch canvas ── */
const SKETCH_COLORS = [
  { hex: "#111827", label: "Black" },
  { hex: "#ef4444", label: "Red" },
  { hex: "#f97316", label: "Orange" },
  { hex: "#eab308", label: "Yellow" },
  { hex: "#22c55e", label: "Green" },
  { hex: "#06b6d4", label: "Teal" },
  { hex: "#3b82f6", label: "Blue" },
  { hex: "#a855f7", label: "Purple" },
  { hex: "#ec4899", label: "Pink" },
];

const SketchCanvas = ({ onSketch }: { onSketch: (base64: string) => void }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [color, setColor] = useState("#111827");
  const [isEraser, setIsEraser] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

  // Fill white background on mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    e.preventDefault();
    isDrawingRef.current = true;
    lastPosRef.current = getPos(e, canvas);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawingRef.current || !lastPosRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    e.preventDefault();
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = isEraser ? "#ffffff" : color;
    ctx.lineWidth = isEraser ? 28 : 7;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    lastPosRef.current = pos;
  };

  const stopDraw = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    lastPosRef.current = null;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const base64 = canvas.toDataURL("image/jpeg", 0.85).split(",")[1];
    if (base64) onSketch(base64);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    onSketch("");
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Drawing surface */}
      <div className="relative rounded-2xl overflow-hidden border-2 border-border/40 bg-white shadow-inner" style={{ touchAction: "none" }}>
        <canvas
          ref={canvasRef}
          width={800}
          height={380}
          className="w-full block"
          style={{ cursor: isEraser ? "cell" : "crosshair", touchAction: "none" }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={stopDraw}
        />
        {!hasDrawn && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
            <p className="font-display text-2xl text-gray-300">Draw anything! ✏️</p>
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        {SKETCH_COLORS.map((c) => (
          <button
            key={c.hex}
            onClick={() => { setColor(c.hex); setIsEraser(false); }}
            title={c.label}
            className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 flex-shrink-0"
            style={{
              backgroundColor: c.hex,
              borderColor: !isEraser && color === c.hex ? "hsl(42 100% 62%)" : "rgba(0,0,0,0.15)",
              boxShadow: !isEraser && color === c.hex ? "0 0 0 2px hsl(42 100% 62% / 0.4)" : undefined,
            }}
          />
        ))}
        <button
          onClick={() => setIsEraser((v) => !v)}
          className={`ml-1 px-3 py-1 rounded-full font-body text-xs border transition-colors ${
            isEraser ? "border-primary bg-primary/20 text-primary" : "border-border/60 text-muted-foreground hover:border-border"
          }`}
        >
          🧹 Erase
        </button>
        <button
          onClick={clearCanvas}
          className="ml-auto px-3 py-1 rounded-full font-body text-xs border border-border/60 text-muted-foreground hover:text-foreground hover:border-border transition-colors"
        >
          🗑 Clear
        </button>
      </div>
    </div>
  );
};

/* ── Camera viewfinder ── */
const CameraViewfinder = ({ onCapture }: { onCapture: (dataUrl: string) => void }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [denied, setDenied] = useState(false);
  const [captured, setCaptured] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setDenied(false);
    } catch {
      setDenied(true);
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => { streamRef.current?.getTracks().forEach((t) => t.stop()); };
  }, [startCamera]);

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const v = videoRef.current;
    const c = canvasRef.current;
    // Resize to max 512px on longest side to keep payload small
    const MAX = 512;
    const scale = Math.min(1, MAX / Math.max(v.videoWidth, v.videoHeight));
    c.width  = Math.round(v.videoWidth  * scale);
    c.height = Math.round(v.videoHeight * scale);
    c.getContext("2d")?.drawImage(v, 0, 0, c.width, c.height);
    const dataUrl = c.toDataURL("image/jpeg", 0.75);
    // Strip "data:image/jpeg;base64," prefix — backend needs raw base64
    const base64 = dataUrl.split(",")[1];
    setCaptured(dataUrl);   // keep full dataUrl for preview
    onCapture(base64);      // pass raw base64 to parent
    streamRef.current?.getTracks().forEach((t) => t.stop());
  };

  if (denied) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <span className="text-4xl">📷</span>
        <p className="font-body text-muted-foreground">Please allow camera access so we can see your prop! 🙏</p>
        <button onClick={startCamera} className="font-body text-primary underline">Try again</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {!captured ? (
        <>
          <div className="relative w-full max-w-md aspect-[4/3] rounded-2xl overflow-hidden border-2 border-dashed border-primary/50 bg-card/40">
            <div className="absolute inset-0 rounded-2xl overflow-hidden">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            </div>
            {/* Scan line */}
            <motion.div
              className="absolute left-0 right-0 h-1 rounded-full pointer-events-none"
              style={{ background: "linear-gradient(90deg, transparent, hsl(42 100% 62% / 0.6), transparent)" }}
              animate={{ top: ["10%", "90%", "10%"] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            {/* Corner reticles */}
            {(["top-2 left-2", "top-2 right-2", "bottom-2 left-2", "bottom-2 right-2"] as const).map((pos) => (
              <motion.div
                key={pos}
                className={`absolute ${pos} w-6 h-6 border-2 border-primary/70 rounded-sm pointer-events-none`}
                style={{
                  borderRight:  pos.includes("left")   ? "none" : undefined,
                  borderLeft:   pos.includes("right")  ? "none" : undefined,
                  borderBottom: pos.includes("top")    ? "none" : undefined,
                  borderTop:    pos.includes("bottom") ? "none" : undefined,
                }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            ))}
          </div>
          <canvas ref={canvasRef} className="hidden" />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCapture}
            className="px-8 py-3 rounded-full bg-primary text-primary-foreground font-display text-lg font-bold magic-glow"
          >
            ✨ Use This!
          </motion.button>
        </>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <div className="w-32 h-32 rounded-2xl overflow-hidden border-2 border-primary shadow-lg">
            <img src={captured} alt="Captured prop" className="w-full h-full object-cover" />
          </div>
          <p className="font-body text-foreground/80 text-center">
            Got it! Your story will be all about what you're holding! 🌟
          </p>
        </div>
      )}
    </div>
  );
};

/* ── Option card config ── */
const OPTION_CARDS: { id: OptionId; emoji: string; title: string; description: string; locked?: boolean }[] = [
  { id: "pick",   emoji: "🎨", title: "Pick a Theme",    description: "Choose from magical worlds or make up your own!" },
  { id: "camera", emoji: "📷", title: "Magic Camera",    description: "Hold up a toy or anything — I'll look at it and build the story around it!" },
  { id: "sketch", emoji: "✏️", title: "Sketch a Theme",  description: "Draw whatever's in your head — I'll bring it to life as your story!" },
];

/* ── Main screen ── */
const ThemeSelect = ({ character, onBack, onConfirm }: Props) => {
  const [expanded, setExpanded] = useState<OptionId | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [customText, setCustomText] = useState("");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [sketchImage, setSketchImage] = useState<string | null>(null);
  const [sketchPreview, setSketchPreview] = useState<{
    loading: boolean;
    label: string | null;
    imageData: string | null;
    mimeType: string;
  } | null>(null);

  const toggleExpand = (id: OptionId) => {
    setExpanded(id);
    if (id === "pick") { setCapturedImage(null); setSketchImage(null); setSketchPreview(null); }
    if (id === "camera") { setSelectedTheme(null); setCustomText(""); setSketchImage(null); setSketchPreview(null); }
    if (id === "sketch") { setSelectedTheme(null); setCustomText(""); setCapturedImage(null); }
  };

  const handleBack = () => {
    if (expanded) {
      setExpanded(null);
      setSketchPreview(null);
      setSketchImage(null);
      setCapturedImage(null);
    } else {
      onBack();
    }
  };

  const canConfirmPick   = !!(selectedTheme || customText.trim());
  const canConfirmSketch = !!sketchImage && !sketchPreview;

  const handleSketchPreview = async () => {
    if (!sketchImage) return;
    setSketchPreview({ loading: true, label: null, imageData: null, mimeType: "" });
    try {
      const res = await fetch(`${API_BASE}/api/sketch-preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sketch_data: sketchImage, image_style: character.imageStyle }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setSketchPreview({ loading: false, label: data.label, imageData: data.image_data, mimeType: data.mime_type });
    } catch (err) {
      console.error("[sketch-preview] failed:", err);
      setSketchPreview(null);
    }
  };

  const handleGo = () => {
    if (expanded === "pick") {
      onConfirm(customText.trim() || selectedTheme || "");
    } else if (expanded === "camera") {
      onConfirm("camera_prop", capturedImage ?? undefined);
    } else if (expanded === "sketch" && sketchPreview?.imageData) {
      onConfirm("sketch", sketchPreview.imageData);
    }
  };

  return (
    <div className="relative min-h-screen bg-sky-gradient overflow-hidden">
      <FloatingElements />

      <div className="relative z-10 container mx-auto px-4 py-6 sm:py-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <button
            onClick={handleBack}
            className="text-muted-foreground hover:text-foreground font-body transition-colors"
          >
            ← Back
          </button>
          <h1 className="font-display text-lg sm:text-xl font-bold text-primary">TaleWeaver</h1>
          {/* Character chip */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/50 flex-shrink-0">
              <img src={character.image} alt={character.name} className="w-full h-full object-cover" />
            </div>
            <span className="font-body text-sm text-foreground hidden sm:inline">{character.name}</span>
          </div>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-8"
        >
          <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-primary mb-2">
            {expanded ? OPTION_CARDS.find(c => c.id === expanded)?.title : "What's Your Story About?"}
          </h2>
          <p className="text-foreground/70 font-body text-base sm:text-lg">
            {expanded ? "← Back to change your choice" : "Choose how you want to spark your adventure ✨"}
          </p>
        </motion.div>

        {/* Option cards */}
        <div className="max-w-3xl mx-auto flex flex-col gap-5">
          {(expanded ? OPTION_CARDS.filter(c => c.id === expanded) : OPTION_CARDS).map((card, i) => {
            const isExpanded = expanded === card.id;
            const isLocked = !!card.locked;

            return (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.12, type: "spring", stiffness: 120 }}
              >
                <motion.div
                  whileHover={isLocked ? {} : { scale: 1.01 }}
                  className={`relative rounded-3xl border-2 overflow-hidden transition-all duration-500 ${
                    isLocked
                      ? "border-border/30 opacity-60 cursor-default"
                      : isExpanded
                      ? "border-primary magic-glow"
                      : "border-border/40 hover:border-primary/50 cursor-pointer character-glow"
                  }`}
                >
                  {/* Coming Soon badge */}
                  {isLocked && (
                    <div className="absolute top-3 right-3 z-20">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-display font-bold bg-secondary/30 text-secondary border border-secondary/40">
                        Coming Soon ✨
                      </span>
                    </div>
                  )}

                  {/* Shimmer overlay for locked */}
                  {isLocked && <div className="absolute inset-0 shimmer-wave z-10 pointer-events-none" />}

                  {/* Card header — always visible */}
                  <button
                    onClick={() => toggleExpand(card.id)}
                    disabled={isLocked}
                    className="w-full flex items-center gap-5 p-6 sm:p-8 text-left bg-card/70 backdrop-blur-sm"
                  >
                    <span className="text-5xl sm:text-6xl">{card.emoji}</span>
                    <div>
                      <h3 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
                        {card.title}
                      </h3>
                      <p className="font-body text-sm sm:text-base text-muted-foreground mt-1">
                        {card.description}
                      </p>
                    </div>
                    {!isLocked && (
                      <motion.span
                        className="ml-auto text-muted-foreground text-xl"
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        ▾
                      </motion.span>
                    )}
                  </button>

                  {/* Expanded content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.4, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 sm:px-8 pb-6 sm:pb-8 bg-card/50 border-t border-border/30">

                          {card.id === "pick" && (
                            <div className="pt-5">
                              <ThemeTileGrid
                                selected={selectedTheme}
                                onSelect={(label) => {
                                  setSelectedTheme((prev) => (prev === label ? null : label));
                                  setCustomText("");
                                }}
                              />
                              <CustomThemeInput
                                value={customText}
                                onChange={(v) => {
                                  setCustomText(v);
                                  if (v.trim()) setSelectedTheme(null);
                                }}
                              />
                              <div className="mt-5 flex justify-center">
                                <motion.button
                                  whileHover={canConfirmPick ? { scale: 1.05 } : {}}
                                  whileTap={canConfirmPick ? { scale: 0.95 } : {}}
                                  onClick={handleGo}
                                  disabled={!canConfirmPick}
                                  className={`px-10 py-4 rounded-full font-display text-xl font-bold transition-all ${
                                    canConfirmPick
                                      ? "bg-primary text-primary-foreground magic-glow animate-glow-pulse hover:brightness-110"
                                      : "bg-muted text-muted-foreground cursor-not-allowed"
                                  }`}
                                >
                                  Let's Go! 🪄
                                </motion.button>
                              </div>
                            </div>
                          )}

                          {card.id === "camera" && (
                            <div className="pt-5">
                              <CameraViewfinder onCapture={setCapturedImage} />
                              {capturedImage && (
                                <div className="mt-5 flex justify-center">
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleGo}
                                    className="px-10 py-4 rounded-full bg-primary text-primary-foreground font-display text-xl font-bold magic-glow animate-glow-pulse hover:brightness-110"
                                  >
                                    🪄 Start the Story!
                                  </motion.button>
                                </div>
                              )}
                            </div>
                          )}

                          {card.id === "sketch" && (
                            <div className="pt-5">

                              {/* Phase 1 — draw */}
                              {!sketchPreview && (
                                <>
                                  <SketchCanvas onSketch={(b64) => setSketchImage(b64 || null)} />
                                  <div className="mt-5 flex justify-center">
                                    <motion.button
                                      whileHover={canConfirmSketch ? { scale: 1.05 } : {}}
                                      whileTap={canConfirmSketch ? { scale: 0.95 } : {}}
                                      onClick={handleSketchPreview}
                                      disabled={!canConfirmSketch}
                                      className={`px-10 py-4 rounded-full font-display text-xl font-bold transition-all ${
                                        canConfirmSketch
                                          ? "bg-primary text-primary-foreground magic-glow animate-glow-pulse hover:brightness-110"
                                          : "bg-muted text-muted-foreground cursor-not-allowed"
                                      }`}
                                    >
                                      🔍 See What I Drew!
                                    </motion.button>
                                  </div>
                                </>
                              )}

                              {/* Phase 2 — loading */}
                              {sketchPreview?.loading && (
                                <div className="flex flex-col items-center gap-4 py-10">
                                  <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                    className="text-5xl"
                                  >
                                    🎨
                                  </motion.div>
                                  <p className="font-display text-xl font-bold text-foreground">Looking at your drawing...</p>
                                  <p className="font-body text-sm text-muted-foreground">Bringing it to life ✨</p>
                                </div>
                              )}

                              {/* Phase 3 — preview */}
                              {sketchPreview && !sketchPreview.loading && sketchPreview.imageData && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  className="flex flex-col items-center gap-5"
                                >
                                  <div className="w-full max-w-sm rounded-2xl overflow-hidden border-2 border-primary/50 shadow-xl">
                                    <img
                                      src={`data:${sketchPreview.mimeType};base64,${sketchPreview.imageData}`}
                                      alt={sketchPreview.label ?? "Your drawing"}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div className="text-center">
                                    <p className="font-display text-2xl font-bold text-foreground">
                                      I see {sketchPreview.label}! 🌟
                                    </p>
                                    <p className="font-body text-sm text-muted-foreground mt-1">
                                      Your story will be all about this!
                                    </p>
                                  </div>
                                  <div className="flex gap-3">
                                    <button
                                      onClick={() => { setSketchPreview(null); setSketchImage(null); }}
                                      className="px-5 py-2 rounded-full font-body text-sm border border-border/60 text-muted-foreground hover:text-foreground hover:border-border transition-colors"
                                    >
                                      ✏️ Draw Again
                                    </button>
                                    <motion.button
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      onClick={handleGo}
                                      className="px-10 py-3 rounded-full bg-primary text-primary-foreground font-display text-lg font-bold magic-glow animate-glow-pulse hover:brightness-110"
                                    >
                                      🪄 Start the Story!
                                    </motion.button>
                                  </div>
                                </motion.div>
                              )}

                            </div>
                          )}

                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ThemeSelect;
