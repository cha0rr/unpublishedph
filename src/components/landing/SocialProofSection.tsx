import { motion } from "framer-motion";
import { TrendingUp, DollarSign, Users } from "lucide-react";

const results = [
  {
    icon: TrendingUp,
    handle: "@nicho.dark",
    metric: "1.2M views",
    detail: "em 14 dias",
    accent: "text-cyan",
    bar: "from-cyan/60 to-cyan/20",
  },
  {
    icon: DollarSign,
    handle: "@ugc.ia",
    metric: "R$ 8.430",
    detail: "em vendas afiliadas",
    accent: "text-money",
    bar: "from-money/70 to-money/20",
  },
  {
    icon: Users,
    handle: "@influencer.ai",
    metric: "32k seguidores",
    detail: "em 30 dias",
    accent: "text-purple-ai",
    bar: "from-purple-ai/70 to-purple-ai/20",
  },
];

const platforms = ["TikTok", "Instagram", "YouTube Shorts", "Kwai"];

export function SocialProofSection() {
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
          <span className="text-xs uppercase tracking-[0.3em] text-money">
            Casos de uso
          </span>
          <h2 className="mt-3 text-2xl font-bold text-foreground sm:text-3xl md:text-4xl">
            Resultados que perfis fantasmas estão entregando
          </h2>
        </motion.div>

        <div className="grid gap-5 md:grid-cols-3">
          {results.map((r, i) => (
            <motion.div
              key={r.handle}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -4 }}
              className="glass-premium relative overflow-hidden p-6"
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                  Exemplo de uso
                </span>
                <r.icon className={`h-5 w-5 ${r.accent}`} />
              </div>
              <p className="text-sm text-muted-foreground">{r.handle}</p>
              <p className={`mt-2 text-3xl font-bold ${r.accent}`}>{r.metric}</p>
              <p className="mt-1 text-xs text-muted-foreground">{r.detail}</p>
              <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: "85%" }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 + i * 0.1, duration: 0.9 }}
                  className={`h-full rounded-full bg-gradient-to-r ${r.bar}`}
                />
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm font-semibold text-muted-foreground"
        >
          <span className="text-xs uppercase tracking-widest opacity-60">
            Plataformas suportadas
          </span>
          {platforms.map((p) => (
            <span key={p} className="text-foreground/70">
              {p}
            </span>
          ))}
        </motion.div>

        <p className="mt-6 text-center text-[11px] text-muted-foreground/70">
          Resultados ilustrativos baseados em casos de uso reais da plataforma. O
          desempenho varia conforme nicho, oferta e consistência.
        </p>
      </div>
    </section>
  );
}
