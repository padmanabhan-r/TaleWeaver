import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Character } from "@/characters";
import FloatingElements from "@/components/FloatingElements";

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "";

interface Props {
  character: Character;
  onBack: () => void;
  onHome: () => void;
  onConfirm: (theme: string, propImage?: string, propDescription?: string, propImageMimeType?: string) => void;
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

const LIFE_SKILLS_THEMES = [
  { emoji: "🤝", label: "Sharing",    gradient: "from-rose-400/30 to-pink-500/30" },
  { emoji: "💪", label: "Courage",    gradient: "from-orange-500/30 to-red-500/30" },
  { emoji: "🙏", label: "Gratitude",  gradient: "from-amber-400/30 to-yellow-500/30" },
  { emoji: "🎨", label: "Creativity", gradient: "from-purple-500/30 to-pink-500/30" },
  { emoji: "🌍", label: "Kindness",   gradient: "from-green-400/30 to-teal-500/30" },
];

type OptionId = "pick" | "camera" | "sketch";

/* ── Reusable tile ── */
const ThemeTile = ({
  emoji, label, gradient, selected, onSelect,
}: { emoji: string; label: string; gradient: string; selected: boolean; onSelect: (l: string) => void }) => (
  <motion.button
    whileHover={{ scale: 1.06 }}
    whileTap={{ scale: 0.95 }}
    onClick={() => onSelect(label)}
    className={`relative flex flex-col items-center justify-center gap-0.5 rounded-xl p-2 border-2 transition-all duration-300 bg-gradient-to-br ${gradient} ${
      selected
        ? "border-primary ring-2 ring-primary/40 scale-105 magic-glow"
        : "border-border/40 hover:border-primary/50"
    }`}
  >
    <span className="text-3xl">{emoji}</span>
    <span className="font-display text-xs font-bold text-foreground leading-tight">{label}</span>
    {selected && (
      <motion.div
        className="absolute -top-1 -right-1 text-sm"
        initial={{ scale: 0 }}
        animate={{ scale: [1, 1.3, 1] }}
        transition={{ duration: 0.4 }}
      >
        ✨
      </motion.div>
    )}
  </motion.button>
);

/* ── Theme tile grid ── */
const ThemeTileGrid = ({
  selected,
  onSelect,
}: {
  selected: string | null;
  onSelect: (label: string) => void;
}) => (
  <div className="flex flex-col gap-3">
    <div className="grid grid-cols-6 gap-2">
      {THEMES.map((t) => (
        <ThemeTile key={t.label} {...t} selected={selected === t.label} onSelect={onSelect} />
      ))}
    </div>

    {/* Life Skills row */}
    <div>
      <p className="font-display text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wide">
        🌱 Teach Me Something
      </p>
      <div className="grid grid-cols-5 gap-2">
        {LIFE_SKILLS_THEMES.map((t) => (
          <ThemeTile key={t.label} {...t} selected={selected === t.label} onSelect={onSelect} />
        ))}
      </div>
    </div>
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
  <div className="mt-3">
    <p className="font-display text-sm font-bold text-foreground mb-1.5">Or dream up your own! 💭</p>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Type anything… a dragon chef? A moon princess?"
      className="w-full rounded-xl border-2 border-border/40 bg-card/60 px-4 py-2.5 font-body text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/30 outline-none transition-all"
    />
  </div>
);

/* ── Sketch canvas ── */
const SKETCH_COLORS = [
  { hex: "#111827", label: "Black" },
  { hex: "#6b7280", label: "Gray" },
  { hex: "#ffffff", label: "White", border: true },
  { hex: "#7c2d12", label: "Brown" },
  { hex: "#ef4444", label: "Red" },
  { hex: "#f97316", label: "Orange" },
  { hex: "#fb923c", label: "Peach" },
  { hex: "#eab308", label: "Yellow" },
  { hex: "#facc15", label: "Light Yellow" },
  { hex: "#84cc16", label: "Lime" },
  { hex: "#22c55e", label: "Green" },
  { hex: "#10b981", label: "Emerald" },
  { hex: "#06b6d4", label: "Teal" },
  { hex: "#38bdf8", label: "Sky" },
  { hex: "#3b82f6", label: "Blue" },
  { hex: "#6366f1", label: "Indigo" },
  { hex: "#a855f7", label: "Purple" },
  { hex: "#ec4899", label: "Pink" },
  { hex: "#f43f5e", label: "Rose" },
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
          width={1200}
          height={600}
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
            className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 flex-shrink-0"
            style={{
              backgroundColor: c.hex,
              borderColor: !isEraser && color === c.hex ? "hsl(42 100% 62%)" : c.border ? "rgba(0,0,0,0.25)" : "rgba(0,0,0,0.15)",
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
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");

  const startCamera = useCallback(async (facing: "environment" | "user") => {
    // Stop any existing stream before starting a new one
    streamRef.current?.getTracks().forEach((t) => t.stop());
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setDenied(false);
    } catch {
      setDenied(true);
    }
  }, []);

  useEffect(() => {
    startCamera(facingMode);
    return () => { streamRef.current?.getTracks().forEach((t) => t.stop()); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const flipCamera = () => {
    const next = facingMode === "environment" ? "user" : "environment";
    setFacingMode(next);
    startCamera(next);
  };

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const v = videoRef.current;
    const c = canvasRef.current;
    // Resize to max 512px on longest side to keep payload small
    const MAX = 512;
    const scale = Math.min(1, MAX / Math.max(v.videoWidth, v.videoHeight));
    c.width  = Math.round(v.videoWidth  * scale);
    c.height = Math.round(v.videoHeight * scale);
    const ctx = c.getContext("2d");
    if (ctx) {
      if (facingMode === "user") {
        ctx.translate(c.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(v, 0, 0, c.width, c.height);
    }
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
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" style={{ transform: facingMode === "user" ? "scaleX(-1)" : undefined }} />
            </div>
            {/* Flip camera button */}
            <button
              onClick={flipCamera}
              className="absolute top-3 right-3 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full w-10 h-10 flex items-center justify-center text-xl transition-colors"
              title={facingMode === "environment" ? "Switch to front camera" : "Switch to back camera"}
            >
              🔄
            </button>
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

/* ── Character voice announcement via Gemini TTS ── */
async function playCharacterTTS(text: string, characterId: string) {
  try {
    const res = await fetch(`${API_BASE}/api/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, character_id: characterId }),
    });
    if (!res.ok) return;
    const data: { audio_data: string; mime_type: string } = await res.json();

    // Decode PCM16 → Float32 and play via AudioContext (same path as story playback)
    const audioCtx = new AudioContext({ sampleRate: 24000 });
    await audioCtx.resume();
    const binary = atob(data.audio_data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const int16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) float32[i] = int16[i] / 32768;
    const audioBuffer = audioCtx.createBuffer(1, float32.length, 24000);
    audioBuffer.getChannelData(0).set(float32);
    const source = audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioCtx.destination);
    source.start();
    source.onended = () => audioCtx.close();
  } catch {
    // TTS failed — silently continue, image is already showing
  }
}

/* ── Main screen ── */
const ThemeSelect = ({ character, onBack, onHome, onConfirm }: Props) => {
  const [expanded, setExpanded] = useState<OptionId | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [customText, setCustomText] = useState("");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [sketchImage, setSketchImage] = useState<string | null>(null);

  type Preview = { loading: boolean; label: string | null; imageData: string | null; mimeType: string; unsafe?: boolean };
  const [sketchPreview, setSketchPreview] = useState<Preview | null>(null);
  const [cameraPreview, setCameraPreview] = useState<Preview | null>(null);
  const [contentWarning, setContentWarning] = useState<string | null>(null);
  const [goLoading, setGoLoading] = useState(false);

  const toggleExpand = (id: OptionId) => {
    setExpanded(id);
    setContentWarning(null);
    if (id === "pick")   { setCapturedImage(null); setCameraPreview(null); setSketchImage(null); setSketchPreview(null); }
    if (id === "camera") { setSelectedTheme(null); setCustomText(""); setSketchImage(null); setSketchPreview(null); }
    if (id === "sketch") { setSelectedTheme(null); setCustomText(""); setCapturedImage(null); setCameraPreview(null); }
  };

  const handleBack = () => {
    if (expanded) {
      setExpanded(null);
      setSketchPreview(null);
      setSketchImage(null);
      setCapturedImage(null);
      setCameraPreview(null);
    } else {
      onBack();
    }
  };

  const canConfirmPick   = !!(selectedTheme || customText.trim());
  const canConfirmSketch = !!sketchImage && !sketchPreview?.loading;

  async function callPreviewAPI(imageData: string, setter: (p: Preview | null) => void, mode: "camera" | "sketch") {
    setter({ loading: true, label: null, imageData: null, mimeType: "" });
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 50_000);
    try {
      const res = await fetch(`${API_BASE}/api/sketch-preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sketch_data: imageData, image_style: character.imageStyle }),
        signal: controller.signal,
      });
      if (!res.ok) {
        if (res.status === 400) {
          const body = await res.json().catch(() => ({}));
          if (body.detail === "unsafe_content") {
            setter({ loading: false, label: null, imageData: null, mimeType: "", unsafe: true });
            return;
          }
        }
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      setter({ loading: false, label: data.label, imageData: data.image_data, mimeType: data.mime_type });
      // Speak out loud in the character's voice as soon as the object is identified
      if (data.label) {
        const action = mode === "camera" ? "brought" : "drew";
        playCharacterTTS(
          `Oh wow, you ${action} ${data.label}! Let me bring it to life in your story!`,
          character.id,
        );
      }
    } catch (err) {
      console.error("[preview] failed:", err);
      setter({ loading: false, label: null, imageData: null, mimeType: "" });
    } finally {
      clearTimeout(timeout);
    }
  }

  const handleSketchPreview = () => sketchImage && callPreviewAPI(sketchImage, setSketchPreview, "sketch");
  const handleCameraCapture = (base64: string) => { setCapturedImage(base64); callPreviewAPI(base64, setCameraPreview, "camera"); };

  const handleGo = async () => {
    if (expanded === "pick") {
      const text = customText.trim();
      if (text) {
        setGoLoading(true);
        try {
          const res = await fetch(`${API_BASE}/api/check-theme`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ theme: text }),
          });
          if (res.ok) {
            const data = await res.json();
            if (!data.safe) {
              setContentWarning("Oops! That theme isn't right for our stories. Try something fun like animals, magic, or space! 🌟");
              setGoLoading(false);
              return;
            }
          }
        } catch {
          // fail open — don't block on network error
        }
        setGoLoading(false);
      }
      setContentWarning(null);
      onConfirm(text || selectedTheme || "");
    } else if (expanded === "camera" && cameraPreview?.imageData) {
      onConfirm("camera_prop", cameraPreview.imageData, cameraPreview.label ?? undefined, cameraPreview.mimeType || "image/jpeg");
    } else if (expanded === "sketch" && sketchPreview?.imageData) {
      onConfirm("sketch", sketchPreview.imageData, sketchPreview.label ?? undefined, sketchPreview.mimeType || "image/jpeg");
    }
  };

  return (
    <div className="relative h-screen bg-sky-gradient overflow-hidden">
      <FloatingElements />

      <div className="relative z-10 h-full flex flex-col container mx-auto px-4 py-4 sm:py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-4"
        >
          <div className="flex-1 flex items-center gap-4">
            <button
              onClick={handleBack}
              className="text-muted-foreground hover:text-foreground font-body transition-colors"
            >
              ← Back
            </button>
            <button
              onClick={onHome}
              className="text-muted-foreground hover:text-foreground font-body transition-colors"
            >
              Home
            </button>
          </div>
          <h1 className="font-display text-lg sm:text-xl font-bold text-primary">TaleWeaver</h1>
          {/* Character chip */}
          <div className="flex-1 flex items-center justify-end gap-3">
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
          className="text-center mb-4"
        >
          <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-primary mb-1">
            {expanded ? OPTION_CARDS.find(c => c.id === expanded)?.title : "What's Your Story About?"}
          </h2>
          {!expanded && (
            <p className="text-foreground/70 font-body text-base sm:text-lg">
              Choose how you want to spark your adventure ✨
            </p>
          )}
        </motion.div>

        {/* Option cards */}
        <div className={`max-w-2xl w-full mx-auto flex flex-col flex-1 gap-4 overflow-y-auto min-h-0 pb-2 ${expanded ? "justify-start pt-2" : "justify-center"}`}>
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
                    className={`w-full flex items-center text-left bg-card/70 backdrop-blur-sm transition-all ${isExpanded ? "gap-3 p-3" : "gap-5 p-6"}`}
                  >
                    <span className={isExpanded ? "text-3xl" : "text-5xl"}>{card.emoji}</span>
                    <div>
                      <h3 className={`font-display font-bold text-foreground ${isExpanded ? "text-lg" : "text-2xl"}`}>
                        {card.title}
                      </h3>
                      {!isExpanded && (
                        <p className="font-body text-sm text-muted-foreground mt-1">
                          {card.description}
                        </p>
                      )}
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
                        <div className="px-5 sm:px-6 pb-4 sm:pb-5 bg-card/50 border-t border-border/30">

                          {card.id === "pick" && (
                            <div className="pt-4">
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
                                  setContentWarning(null);
                                }}
                              />
                              {contentWarning && (
                                <motion.div
                                  initial={{ opacity: 0, y: -8 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="mt-2 px-4 py-2.5 rounded-xl bg-destructive/10 border border-destructive/30 text-center"
                                >
                                  <p className="font-body text-sm text-destructive font-semibold">{contentWarning}</p>
                                </motion.div>
                              )}
                              <div className="mt-3 flex justify-center">
                                <motion.button
                                  whileHover={canConfirmPick && !goLoading ? { scale: 1.05 } : {}}
                                  whileTap={canConfirmPick && !goLoading ? { scale: 0.95 } : {}}
                                  onClick={handleGo}
                                  disabled={!canConfirmPick || goLoading}
                                  className={`px-8 py-3 rounded-full font-display text-lg font-bold transition-all ${
                                    canConfirmPick && !goLoading
                                      ? "bg-primary text-primary-foreground magic-glow animate-glow-pulse hover:brightness-110"
                                      : "bg-muted text-muted-foreground cursor-not-allowed"
                                  }`}
                                >
                                  {goLoading ? "Checking… ✨" : "Let's Go! 🪄"}
                                </motion.button>
                              </div>
                            </div>
                          )}

                          {card.id === "camera" && (
                            <div className="pt-4">
                              {/* Phase 1 — viewfinder */}
                              {!capturedImage && (
                                <CameraViewfinder onCapture={handleCameraCapture} />
                              )}

                              {/* Phase 2 — loading */}
                              {capturedImage && cameraPreview?.loading && (
                                <div className="flex flex-col items-center gap-4 py-10">
                                  <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                    className="text-5xl"
                                  >
                                    📷
                                  </motion.div>
                                  <p className="font-display text-xl font-bold text-foreground">Ooh, what did you bring? ✨</p>
                                </div>
                              )}

                              {/* Error / unsafe state */}
                              {cameraPreview && !cameraPreview.loading && !cameraPreview.label && (
                                <div className="flex flex-col items-center gap-4 py-6 text-center">
                                  <span className="text-4xl">{cameraPreview.unsafe ? "🚫" : "😕"}</span>
                                  <p className="font-display text-lg font-bold text-foreground">
                                    {cameraPreview.unsafe
                                      ? "That's not okay for our stories!"
                                      : "Hmm, something went wrong!"}
                                  </p>
                                  {cameraPreview.unsafe && (
                                    <p className="font-body text-sm text-muted-foreground max-w-xs">
                                      Please show me something else — like a toy, a book, or anything fun and friendly! 🌟
                                    </p>
                                  )}
                                  <button
                                    onClick={() => { setCapturedImage(null); setCameraPreview(null); }}
                                    className="px-6 py-2 rounded-full font-body text-sm border border-border/60 text-muted-foreground hover:text-foreground hover:border-border transition-colors"
                                  >
                                    📷 Try again
                                  </button>
                                </div>
                              )}

                              {/* Phase 3 — generated illustration + label */}
                              {cameraPreview && !cameraPreview.loading && cameraPreview.label && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  className="flex flex-col items-center gap-3 py-2"
                                >
                                  {cameraPreview.imageData && (
                                    <div className="w-full rounded-2xl overflow-hidden border-2 border-primary/50 shadow-xl">
                                      <img
                                        src={`data:${cameraPreview.mimeType};base64,${cameraPreview.imageData}`}
                                        alt={cameraPreview.label}
                                        className="w-full object-contain max-h-72"
                                      />
                                    </div>
                                  )}
                                  <div className="text-center">
                                    <p className="font-display text-xl font-bold text-foreground">
                                      I see {cameraPreview.label}! 🌟
                                    </p>
                                    <p className="font-body text-sm text-muted-foreground mt-0.5">
                                      Your story will be all about this!
                                    </p>
                                  </div>
                                  <div className="flex gap-3">
                                    <button
                                      onClick={() => { setCapturedImage(null); setCameraPreview(null); }}
                                      className="px-5 py-2 rounded-full font-body text-sm border border-border/60 text-muted-foreground hover:text-foreground hover:border-border transition-colors"
                                    >
                                      📷 Retake
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
                                </div>
                              )}

                              {/* Error / unsafe state */}
                              {sketchPreview && !sketchPreview.loading && !sketchPreview.label && (
                                <div className="flex flex-col items-center gap-4 py-6 text-center">
                                  <span className="text-4xl">{sketchPreview.unsafe ? "🚫" : "😕"}</span>
                                  <p className="font-display text-lg font-bold text-foreground">
                                    {sketchPreview.unsafe
                                      ? "That's not okay for our stories!"
                                      : "Hmm, something went wrong!"}
                                  </p>
                                  {sketchPreview.unsafe && (
                                    <p className="font-body text-sm text-muted-foreground max-w-xs">
                                      Please draw something else — like a friendly animal, a magical place, or anything fun! 🌟
                                    </p>
                                  )}
                                  <button
                                    onClick={() => { setSketchPreview(null); setSketchImage(null); }}
                                    className="px-6 py-2 rounded-full font-body text-sm border border-border/60 text-muted-foreground hover:text-foreground hover:border-border transition-colors"
                                  >
                                    ✏️ Try again
                                  </button>
                                </div>
                              )}

                              {/* Phase 3 — generated illustration of the sketch */}
                              {sketchPreview && !sketchPreview.loading && sketchPreview.label && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  className="flex flex-col items-center gap-3 py-2"
                                >
                                  {sketchPreview.imageData && (
                                    <div className="w-full rounded-2xl overflow-hidden border-2 border-primary/50 shadow-xl">
                                      <img
                                        src={`data:${sketchPreview.mimeType};base64,${sketchPreview.imageData}`}
                                        alt={sketchPreview.label}
                                        className="w-full object-contain max-h-72"
                                      />
                                    </div>
                                  )}
                                  <div className="text-center">
                                    <p className="font-display text-xl font-bold text-foreground">
                                      I see {sketchPreview.label}! 🌟
                                    </p>
                                    <p className="font-body text-sm text-muted-foreground mt-0.5">
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
