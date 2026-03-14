import { motion } from "framer-motion";

const items = [
  { label: "Paisagem Cyberpunk", type: "Imagem", color: "from-purple-500/20 to-primary/20" },
  { label: "Produto 3D", type: "Imagem", color: "from-orange-500/20 to-primary/20" },
  { label: "Comercial de Moda", type: "Vídeo", color: "from-pink-500/20 to-primary/20" },
  { label: "Arte Abstrata", type: "Imagem", color: "from-green-500/20 to-primary/20" },
  { label: "Vídeo Institucional", type: "Vídeo", color: "from-blue-500/20 to-primary/20" },
  { label: "Retrato Realista", type: "Imagem", color: "from-red-500/20 to-primary/20" },
];

export function ShowcaseSection() {
  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          className="mb-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
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
              variants={{
                hidden: { opacity: 0, scale: 0.95 },
                visible: { opacity: 1, scale: 1 },
              }}
              whileHover={{ scale: 1.02 }}
              className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/[0.06]"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${item.color}`} />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-4 opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">
                <span className="inline-block rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-medium text-primary mb-1">
                  {item.type}
                </span>
                <p className="text-sm font-medium text-foreground">{item.label}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
