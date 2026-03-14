import { motion } from "framer-motion";

const items = [
  { label: "Comercial de Produto", type: "Vídeo", color: "from-purple-500/20 to-primary/20", video: "/videos/showcase-comercial-produto.mp4" },
  { label: "Vídeo Institucional", type: "Vídeo", color: "from-orange-500/20 to-primary/20" },
  { label: "Comercial de Moda", type: "Vídeo", color: "from-pink-500/20 to-primary/20" },
  { label: "Animação Abstrata", type: "Vídeo", color: "from-green-500/20 to-primary/20" },
  { label: "Vídeo para Redes Sociais", type: "Vídeo", color: "from-blue-500/20 to-primary/20" },
  { label: "Trailer Cinematográfico", type: "Vídeo", color: "from-red-500/20 to-primary/20" },
];

export function ShowcaseSection() {
  return (
    <section className="relative py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          className="mb-10 sm:mb-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl md:text-4xl">
            Criado com <span className="text-gradient-cyan">PH Studio</span>
          </h2>
          <p className="mt-4 text-muted-foreground">Explore o potencial criativo da plataforma.</p>
        </motion.div>

        <motion.div
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
        >
          {items.map((item) => (
            <motion.div
              key={item.label}
              variants={{ hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1 } }}
              whileHover={{ scale: 1.02 }}
              className="group relative aspect-video overflow-hidden rounded-2xl border border-white/[0.06]"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${item.color}`} />
              {/* Play icon */}
              <div className="absolute inset-0 flex items-center justify-center opacity-30 group-hover:opacity-60 transition-opacity">
                <div className="h-10 w-10 rounded-full border-2 border-foreground/30 flex items-center justify-center">
                  <div className="h-0 w-0 border-t-[6px] border-b-[6px] border-l-[10px] border-transparent border-l-foreground/40 ml-0.5" />
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-4 opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">
                <span className="inline-block rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-medium text-primary mb-1">{item.type}</span>
                <p className="text-sm font-medium text-foreground">{item.label}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
