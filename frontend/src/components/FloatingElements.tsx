import { motion } from "framer-motion";
import { useMemo } from "react";

const Star = ({ delay, x, y, size }: { delay: number; x: number; y: number; size: number }) => (
  <motion.div
    className="absolute text-star-glow pointer-events-none"
    style={{ left: `${x}%`, top: `${y}%`, fontSize: `${size}px` }}
    animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
    transition={{ duration: 2 + Math.random() * 2, repeat: Infinity, delay }}
  >
    ✦
  </motion.div>
);

const Sparkle = ({ delay, x, y }: { delay: number; x: number; y: number }) => (
  <motion.div
    className="absolute text-sparkle pointer-events-none"
    style={{ left: `${x}%`, top: `${y}%` }}
    animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0], rotate: [0, 180, 360] }}
    transition={{ duration: 3, repeat: Infinity, delay }}
  >
    ✨
  </motion.div>
);

const Cloud = ({ delay, y, direction }: { delay: number; y: number; direction: 1 | -1 }) => (
  <motion.div
    className="absolute text-cloud/20 text-6xl select-none pointer-events-none"
    style={{ top: `${y}%` }}
    initial={{ x: direction === 1 ? "-200px" : "calc(100vw + 200px)" }}
    animate={{ x: direction === 1 ? "calc(100vw + 200px)" : "-200px" }}
    transition={{ duration: 40 + Math.random() * 20, repeat: Infinity, delay, ease: "linear" }}
  >
    ☁️
  </motion.div>
);

export default function FloatingElements() {
  const stars = useMemo(
    () =>
      Array.from({ length: 25 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 60,
        size: 8 + Math.random() * 16,
        delay: Math.random() * 4,
      })),
    []
  );

  const sparkles = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 80,
        delay: Math.random() * 5,
      })),
    []
  );

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {stars.map((s) => (
        <Star key={s.id} delay={s.delay} x={s.x} y={s.y} size={s.size} />
      ))}
      {sparkles.map((s) => (
        <Sparkle key={`sp-${s.id}`} delay={s.delay} x={s.x} y={s.y} />
      ))}
      <Cloud delay={0} y={10} direction={1} />
      <Cloud delay={8} y={25} direction={-1} />
      <Cloud delay={15} y={5} direction={1} />
    </div>
  );
}
