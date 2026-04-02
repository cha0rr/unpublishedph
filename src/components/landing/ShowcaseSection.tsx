import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

const items = [
  { label: "Cartomante / Místico", type: "Viral", src: "/videos/showcase-1.mp4", isVideo: true },
  { label: "Fazendeiro / Rural", type: "Viral", src: "/videos/showcase-2.mp4", isVideo: true },
  { label: "Frutas Falantes", type: "Viral", src: "/videos/showcase-3.mp4", isVideo: true },
  { label: "Notícias & Fatos", type: "Viral", src: "/videos/showcase-4.mp4", isVideo: true },
  { label: "Review de Produto", type: "UGC", src: "/videos/showcase-5.mp4", isVideo: true },
  { label: "Depoimento UGC", type: "UGC", src: "/videos/showcase-6.png", isVideo: false },
];

function getCardStyle(position: number, total: number) {
  // position: 0 = front, 1 = right-behind, -1 = left-behind, etc.
  const absPos = Math.abs(position);
  const sign = position >= 0 ? 1 : -1;

  if (absPos === 0) {
    return {
      x: 0,
      scale: 1,
      z: 50,
      opacity: 1,
      rotateY: 0,
    };
  }

  const maxVisible = Math.floor(total / 2);
  if (absPos > maxVisible) {
    return {
      x: sign * 120,
      scale: 0.6,
      z: -200,
      opacity: 0,
      rotateY: sign * 15,
    };
  }

  return {
    x: sign * absPos * 180,
    scale: 1 - absPos * 0.12,
    z: -absPos * 80,
    opacity: Math.max(0.3, 1 - absPos * 0.25),
    rotateY: sign * absPos * 5,
  };
}

export function ShowcaseSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedItem, setSelectedItem] = useState<typeof items[0] | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const total = items.length;

  const next = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % total);
  }, [total]);

  const prev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  // Auto-advance
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(next, 3000);
    return () => clearInterval(interval);
  }, [next, isPaused]);

  function getPosition(index: number) {
    let diff = index - activeIndex;
    if (diff > total / 2) diff -= total;
    if (diff < -total / 2) diff += total;
    return diff;
  }

  return (
    <section className="relative py-16 sm:py-24 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          className="mb-10 sm:mb-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl md:text-4xl">
            Exemplos de <span className="text-gradient-cyan">vídeos para TikTok</span>
          </h2>
          <p className="mt-4 text-muted-foreground">UGC, virais, nichos criativos — veja o que você pode criar.</p>
        </motion.div>
      </div>

      <div
        className="relative w-full flex items-center justify-center"
        style={{ height: 480, perspective: 1200 }}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {items.map((item, index) => {
          const position = getPosition(index);
          const style = getCardStyle(position, total);
          const isFront = position === 0;

          return (
            <motion.div
              key={item.label}
              className="absolute cursor-pointer"
              animate={{
                x: style.x,
                scale: style.scale,
                rotateY: style.rotateY,
                opacity: style.opacity,
              }}
              transition={{
                duration: 0.6,
                ease: [0.4, 0, 0.2, 1],
              }}
              style={{
                zIndex: 50 - Math.abs(position) * 10,
                transformStyle: "preserve-3d",
              }}
              onClick={() => {
                if (isFront) {
                  setSelectedItem(item);
                } else {
                  setActiveIndex(index);
                }
              }}
            >
              <div
                className={`relative w-[200px] sm:w-[240px] aspect-[9/16] rounded-2xl border overflow-hidden transition-shadow duration-300 ${
                  isFront
                    ? "border-primary/30 shadow-[0_0_40px_rgba(56,189,248,0.15)]"
                    : "border-white/[0.06]"
                }`}
              >
                {item.isVideo ? (
                  <video
                    src={item.src}
                    autoPlay={isFront}
                    loop
                    muted
                    playsInline
                    preload="metadata"
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                  />
                ) : (
                  <img
                    src={item.src}
                    alt={item.label}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                {isFront && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <div className="w-12 h-12 rounded-full bg-primary/80 flex items-center justify-center">
                      <svg className="w-5 h-5 text-primary-foreground ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <span className="inline-block rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-medium text-primary mb-1">
                    {item.type}
                  </span>
                  <p className="text-xs sm:text-sm font-medium text-foreground">{item.label}</p>
                </div>
              </div>
            </motion.div>
          );
        })}

        {/* Navigation arrows */}
        <button
          onClick={prev}
          className="absolute left-4 sm:left-1/4 z-[60] w-10 h-10 rounded-full bg-card/80 border border-white/10 flex items-center justify-center text-foreground hover:bg-card transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={next}
          className="absolute right-4 sm:right-1/4 z-[60] w-10 h-10 rounded-full bg-card/80 border border-white/10 flex items-center justify-center text-foreground hover:bg-card transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-2 mt-6">
        {items.map((_, i) => (
          <button
            key={i}
            onClick={() => setActiveIndex(i)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              i === activeIndex ? "bg-primary w-6" : "bg-muted-foreground/30"
            }`}
          />
        ))}
      </div>

      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-sm p-0 bg-background border-white/10 overflow-hidden [&>button]:hidden">
          <button
            onClick={() => setSelectedItem(null)}
            className="absolute top-3 right-3 z-50 w-8 h-8 rounded-full bg-background/80 flex items-center justify-center text-foreground hover:bg-background transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          {selectedItem && (
            <div className="aspect-[9/16] w-full">
              {selectedItem.isVideo ? (
                <video
                  src={selectedItem.src}
                  autoPlay
                  loop
                  controls
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={selectedItem.src}
                  alt={selectedItem.label}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
