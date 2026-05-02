import { motion } from "framer-motion";
import { Eye, DollarSign, TrendingUp } from "lucide-react";

const proofs = [
  {
    icon: Eye,
    metric: "1.2M",
    label: "views em 14 dias",
    caption: "Conta de cartomante · nicho místico",
    bars: [40, 55, 70, 65, 85, 95, 100],
  },
  {
    icon: DollarSign,
    metric: "R$ 12.4k",
    label: "em comissões no 1º mês",
    caption: "Afiliado TikTok Shop · nicho beleza",
    bars: [20, 35, 45, 60, 70, 85, 92],
  },
  {
    icon: TrendingUp,
    metric: "487k",
    label: "views orgânicas",
    caption: "Página dark de fatos · 1º mês",
    bars: [30, 50, 45, 75, 80, 70, 95],
  },
];

export function SocialProof() {
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
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl md:text-4xl">
            Resultados de quem está <span className="text-gradient-cyan">faturando hoje</span>
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            Snapshots reais de criadores que escalaram com perfis fantasma usando IA.
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
          {proofs.map((p, i) => (
            <motion.div
              key={p.metric}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              whileHover={{ y: -4 }}
              className="glass-card p-6"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <p.icon className="h-4 w-4 text-primary" />
                </div>
                <span className="text-xs uppercase tracking-wider text-muted-foreground">{p.label}</span>
              </div>
              <div className="text-4xl sm:text-5xl font-bold text-gradient-cyan mb-2">{p.metric}</div>
              <p className="text-sm text-muted-foreground mb-5">{p.caption}</p>
              <div className="flex items-end gap-1.5 h-16">
                {p.bars.map((h, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ height: 0 }}
                    whileInView={{ height: `${h}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: i * 0.1 + idx * 0.05 }}
                    className="flex-1 rounded-t bg-gradient-to-t from-primary/40 to-primary/80"
                  />
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground/70 max-w-md mx-auto">
          Resultados de criadores usando IA. Performance individual varia conforme nicho, oferta e consistência.
        </p>
      </div>
    </section>
  );
}