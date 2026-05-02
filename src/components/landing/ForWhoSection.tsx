import { motion } from "framer-motion";
import { Ghost, ShoppingBag, LayoutGrid, Bot, Package } from "lucide-react";

const personas = [
  {
    icon: Ghost,
    title: "Criadores dark",
    description: "Quer escalar conteúdo sem mostrar a cara nem a voz.",
  },
  {
    icon: ShoppingBag,
    title: "Afiliados TikTok Shop",
    description: "Vende produtos físicos com vídeos que convertem.",
  },
  {
    icon: LayoutGrid,
    title: "Donos de páginas de nicho",
    description: "Gerencia múltiplas contas e precisa de volume diário.",
  },
  {
    icon: Bot,
    title: "Criadores de influencers IA",
    description: "Constrói marcas digitais 100% sintéticas.",
  },
  {
    icon: Package,
    title: "Vendedores PLR / digital",
    description: "Escala distribuição de produtos digitais e infoprodutos.",
  },
];

export function ForWhoSection() {
  return (
    <section id="para-quem" className="relative py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          className="mb-10 sm:mb-14 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <span className="text-xs uppercase tracking-[0.3em] text-cyan">
            Posicionamento
          </span>
          <h2 className="mt-3 text-2xl font-bold text-foreground sm:text-3xl md:text-4xl">
            Para quem é <span className="text-gradient-cyan">isso?</span>
          </h2>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {personas.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.45, delay: i * 0.07 }}
              whileHover={{ y: -4 }}
              className="glass-card p-5"
            >
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-purple-ai/10 ring-1 ring-purple-ai/30">
                <p.icon className="h-5 w-5 text-purple-ai" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">
                {p.title}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {p.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
