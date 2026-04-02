import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X } from "lucide-react";

const items = [
  { label: "Cartomante / Místico", type: "Viral", src: "/videos/showcase-1.mp4", isVideo: true },
  { label: "Fazendeiro / Rural", type: "Viral", src: "/videos/showcase-2.mp4", isVideo: true },
  { label: "Frutas Falantes", type: "Viral", src: "/videos/showcase-3.mp4", isVideo: true },
  { label: "Notícias & Fatos", type: "Viral", src: "/videos/showcase-4.mp4", isVideo: true },
  { label: "Review de Produto", type: "UGC", src: "/videos/showcase-5.mp4", isVideo: true },
  { label: "Depoimento UGC", type: "UGC", src: "/videos/showcase-6.png", isVideo: false },
];

function CarouselCard({ item, onClick }: { item: typeof items[0]; onClick: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Only play video when card is visible in viewport
  useEffect(() => {
    if (!item.isVideo || !cardRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (videoRef.current) {
          if (entry.isIntersecting) {
            videoRef.current.play().catch(() => {});
          } else {
            videoRef.current.pause();
          }
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [item.isVideo]);

  return (
    <div
      ref={cardRef}
      className="showcase-card relative w-[220px] sm:w-[260px] flex-shrink-0 aspect-[9/16] rounded-2xl border border-white/[0.06] overflow-hidden group cursor-pointer"
      onClick={onClick}
    >
      {item.isVideo ? (
        <video
          ref={videoRef}
          src={item.src}
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
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="w-12 h-12 rounded-full bg-primary/80 flex items-center justify-center">
          <svg className="w-5 h-5 text-primary-foreground ml-0.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <span className="inline-block rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-medium text-primary mb-1">
          {item.type}
        </span>
        <p className="text-sm font-medium text-foreground">{item.label}</p>
      </div>
    </div>
  );
}

export function ShowcaseSection() {
  const [selectedItem, setSelectedItem] = useState<typeof items[0] | null>(null);

  // Repeat items enough times for seamless CSS scroll
  const repeated = [...items, ...items, ...items, ...items];

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

      <div className="relative w-full overflow-hidden">
        <div className="showcase-track flex gap-4 sm:gap-6 pl-8">
          {repeated.map((item, i) => (
            <CarouselCard
              key={`${item.label}-${i}`}
              item={item}
              onClick={() => setSelectedItem(item)}
            />
          ))}
        </div>
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
