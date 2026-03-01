import { useEffect } from "react";
import { motion } from "framer-motion";
import type { BadgeAward } from "@/hooks/useLiveAPI";

interface Props {
  badge: BadgeAward;
  onDismiss: () => void;
}

const BadgePopup = ({ badge, onDismiss }: Props) => {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 flex flex-col items-center gap-2 px-8 py-5 rounded-3xl bg-card border-2 border-primary shadow-2xl magic-glow"
    >
      <motion.div
        animate={{ rotate: [0, -15, 15, -10, 10, 0], scale: [1, 1.3, 1] }}
        transition={{ duration: 0.8 }}
        className="text-6xl select-none"
      >
        {badge.emoji}
      </motion.div>
      <p className="font-display text-xl font-extrabold text-primary">{badge.name}</p>
      <p className="font-body text-sm text-muted-foreground text-center">{badge.reason}</p>
      <button
        onClick={onDismiss}
        className="mt-1 font-body text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        Tap to close
      </button>
    </motion.div>
  );
};

export default BadgePopup;
