import { motion } from "framer-motion";

interface Props {
  options: string[];
  onChoice: (option: string) => void;
}

const ChoiceOverlay = ({ options, onChoice }: Props) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 24 }}
    transition={{ type: "spring", stiffness: 260, damping: 22 }}
    className="absolute inset-x-0 top-4 flex flex-col items-center gap-3 px-6 z-20 pointer-events-auto"
  >
    <div className="px-4 py-1.5 rounded-full bg-card/80 backdrop-blur-sm border border-border/50">
      <p className="font-display text-base font-bold text-foreground">What happens next? 🤔</p>
    </div>
    <div className="flex flex-wrap justify-center gap-3">
      {options.map((opt, i) => (
        <motion.button
          key={i}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.08 }}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => onChoice(opt)}
          className="px-5 py-3 rounded-full bg-primary text-primary-foreground font-display text-sm font-bold magic-glow shadow-lg hover:brightness-110 transition-all"
        >
          {opt}
        </motion.button>
      ))}
    </div>
  </motion.div>
);

export default ChoiceOverlay;
