import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const items = [
  { label: "Cartomante / Místico", type: "Viral", src: "/videos/showcase-1.mp4", isVideo: true },
  { label: "Fazendeiro / Rural", type: "Viral", src: "/videos/showcase-2.mp4", isVideo: true },
  { label: "Frutas Falantes", type: "Viral", src: "/videos/showcase-3.mp4", isVideo: true },
  { label: "Notícias & Fatos", type: "Viral", src: "/videos/showcase-4.mp4", isVideo: true },
  { label: "Review de Produto", type: "UGC", src: "/videos/showcase-5.mp4", isVideo: true },
  { label: "Depoimento UGC", type: "UGC", src: "/videos/showcase-6.png", isVideo: false },
];

function CarouselCard({ item }: { item: typeof items[0] }) {
  return (
    <div className="relative w-[220px] sm:w-[260px] flex-shrink-0 aspect-[9/16] rounded-2xl border border-white/[0.06] overflow-hidden group">
      {item.isVideo ? (
        <video
          src={item.src}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <img
          src={item.src}
          alt={item.label}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
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
  // Duplicate items for seamless infinite loop
  const duplicated = [...items, ...items];
  const trackRef = useRef<HTMLDivElement>(null);
  const [trackWidth, setTrackWidth] = useState(0);

  useEffect(() => {
    if (trackRef.current) {
      // Half width = one set of items
      setTrackWidth(trackRef.current.scrollWidth / 2);
    }
  }, []);

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

      <div className="relative w-full">
        <motion.div
          ref={trackRef}
          className="flex gap-4 sm:gap-6"
          animate={trackWidth > 0 ? { x: [0, -trackWidth] } : undefined}
          transition={{
            x: {
              duration: items.length * 5,
              repeat: Infinity,
              ease: "linear",
              repeatType: "loop",
            },
          }}
          style={{ paddingLeft: "2rem" }}
        >
          {duplicated.map((item, i) => (
            <CarouselCard key={`${item.label}-${i}`} item={item} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
