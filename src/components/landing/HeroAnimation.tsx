import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

const HERO_VIDEOS = [
  "/videos/showcase-1.mp4",
  "/videos/showcase-3.mp4",
  "/videos/showcase-4.mp4",
  "/videos/showcase-5.mp4",
  "/videos/showcase-6.mp4",
  "/videos/hero-extra-1.mp4",
  "/videos/hero-extra-2.mp4",
];
const CYCLE_MS = 8000;

function Particle({ delay, x, y }: { delay: number; x: string; y: string }) {
  return (
    <motion.div
      className="absolute h-1 w-1 rounded-full bg-primary"
      style={{ left: x, top: y }}
      animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5], y: [0, -20, 0] }}
      transition={{ duration: 3, delay, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

function Frame({ delay }: { delay: number }) {
  return (
    <motion.div
      className="h-10 w-16 rounded-md bg-muted/50 overflow-hidden border border-white/[0.06]"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: [0, 1, 1, 0], scale: [0.8, 1, 1, 0.9] }}
      transition={{ duration: 5, delay, repeat: Infinity, ease: "easeInOut" }}
    >
      <div className="h-full w-full bg-gradient-to-br from-primary/20 to-transparent" />
    </motion.div>
  );
}

export function HeroAnimation() {
  const [videoIndex, setVideoIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setVideoIndex((i) => (i + 1) % HERO_VIDEOS.length);
    }, CYCLE_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative w-full max-w-lg mx-auto">
      <motion.div
        className="absolute -inset-8 rounded-3xl bg-primary/10 blur-3xl"
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="glass-card relative overflow-hidden p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="h-3 w-3 rounded-full bg-primary animate-pulse-glow" />
          <span className="text-xs font-medium text-muted-foreground">Gerando vídeo com IA...</span>
        </div>

        <div className="relative aspect-[9/16] w-48 mx-auto rounded-xl bg-muted/30 border border-white/[0.06] overflow-hidden mb-4">
          <AnimatePresence mode="wait">
            <motion.video
              key={videoIndex}
              src={HERO_VIDEOS[videoIndex]}
              autoPlay
              loop
              muted
              playsInline
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 w-full h-full object-cover"
            />
          </AnimatePresence>
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent"
            style={{ backgroundSize: "200% 100%" }}
            animate={{ backgroundPosition: ["200% 0", "-200% 0"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
          <Particle delay={0} x="20%" y="30%" />
          <Particle delay={0.5} x="70%" y="20%" />
          <Particle delay={1} x="50%" y="60%" />
          <Particle delay={1.5} x="80%" y="70%" />
          <Particle delay={2} x="30%" y="80%" />
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-muted-foreground">Processando frames</span>
            <motion.span
              className="text-[10px] text-primary font-medium"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              73%
            </motion.span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted/50 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-primary to-cyan-light"
              animate={{ width: ["30%", "73%", "45%", "88%", "30%"] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Frame delay={0} />
          <Frame delay={0.8} />
          <Frame delay={1.6} />
          <Frame delay={2.4} />
          <div className="flex-1" />
          <motion.div
            className="text-[10px] text-primary/70 font-mono"
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            HD
          </motion.div>
        </div>
      </div>

      <motion.div
        className="absolute -top-4 -right-4 h-20 w-20 rounded-2xl glass-card p-3 flex items-center justify-center"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="text-center">
          <div className="text-lg font-bold text-primary">∞</div>
          <div className="text-[8px] text-muted-foreground">Ilimitado</div>
        </div>
      </motion.div>

      <motion.div
        className="absolute -bottom-3 -left-3 h-16 w-24 rounded-xl glass-card p-2 flex items-center gap-2"
        animate={{ y: [0, 6, 0] }}
        transition={{ duration: 5, delay: 1, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="h-3 w-3 rounded-full bg-green-400" />
        <div className="text-[9px] text-muted-foreground leading-tight">
          Veo 3.1<br />
          <span className="text-foreground font-medium">Ativo</span>
        </div>
      </motion.div>
    </div>
  );
}
