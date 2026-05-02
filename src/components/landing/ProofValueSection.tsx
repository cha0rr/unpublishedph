import { motion } from "framer-motion";
import { Sparkles, Eye, TerminalSquare, Megaphone } from "lucide-react";

const items = [
  {
    icon: Sparkles,
    label: "Influencer IA",
    description: "Mulher fictícia vendendo produto no TikTok",
    gradient: "from-purple-ai/30 via-purple-ai/10 to-transparent",
    accent: "text-purple-ai",
    tag: "AI Avatar",
  },
  {
    icon: Eye,
    label: "Review sem rosto",
    description: "Mãos + produto, voz IA, zero exposição",
    gradient: "from-cyan/30 via-cyan/10 to-transparent",
    accent: "text-cyan",
    tag: "Faceless",
  },
  {
    icon: TerminalSquare,
    label: "Canal dark",
    description: "Conteúdo automatizado, totalmente passivo",
    gradient: "from-money/25 via-money/8 to-transparent",
    accent: "text-money",
    tag: "Auto-pilot",
  },
  {
    icon: Megaphone,
    label: "UGC fake IA",
    description: "Depoimentos virais que parecem orgânicos",
    gradient: "from-purple-ai/25 via-cyan/10 to-transparent",
    accent: "text-foreground",
    tag: "Viral",
  },
];

export function ProofValueSection() {
  return (
    <section className="relative py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          className="mb-10 sm:mb-14 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <span className="text-xs uppercase tracking-[0.3em] text-purple-ai">
            Possibilidades
          </span>
          <h2 className="mt-3 text-2xl font-bold text-foreground sm:text-3xl md:text-4xl">
            O que você pode criar em <span className="text-gradient-money">minutos</span>
          </h2>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
            Quatro tipos de máquinas de receita rodando enquanto você dorme.
          </p>
        </motion.div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((it, i) => (
            <motion.div
              key={it.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              whileHover={{ y: -6 }}
              className="glass-premium group relative overflow-hidden p-5"
            >
              {/* 9:16 mock thumbnail */}
              <div
                className={`relative mb-4 aspect-[9/16] w-full overflow-hidden rounded-xl bg-gradient-to-b ${it.gradient}`}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,hsl(0_0%_100%/0.06),transparent_60%)]" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <it.icon className={`h-12 w-12 ${it.accent} opacity-80`} />
                </div>
                <div className="absolute left-3 top-3 rounded-full border border-white/10 bg-black/40 px-2 py-0.5 text-[10px] font-medium text-foreground backdrop-blur">
                  {it.tag}
                </div>
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>● ao vivo</span>
                  <span>9:16</span>
                </div>
              </div>
              <h3 className="text-base font-semibold text-foreground">
                {it.label}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {it.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
