import { motion } from "framer-motion";

interface Props {
  muted: boolean;
  onToggle: () => void;
}

const MuteButton = ({ muted, onToggle }: Props) => (
  <motion.button
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: 1.8 }}
    onClick={onToggle}
    title={muted ? "Unmute" : "Mute"}
    className="fixed bottom-5 right-5 z-50 w-10 h-10 rounded-full bg-card/60 backdrop-blur-sm border border-border/50 flex items-center justify-center text-lg text-foreground/70 hover:text-foreground hover:border-border transition-colors shadow-md"
  >
    {muted ? "🔇" : "🔊"}
  </motion.button>
);

export default MuteButton;
