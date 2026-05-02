import { motion } from "framer-motion";
import { Eye, TrendingUp, Sparkles } from "lucide-react";

const profiles = [
  {
    handle: "@cartomante.dark",
    niche: "Cartomante IA",
    views: "1.2M",
    sales: "R$ 4.380",
    color: "from-purple-ai/40 to-purple-ai/10",
    initials: "CD",
  },
  {
    handle: "@review.invisivel",
    niche: "Review sem rosto",
    views: "843k",
    sales: "R$ 2.910",
    color: "from-cyan/40 to-cyan/10",
    initials: "RI",
  },
  {
    handle: "@ana.ugc.ai",
    niche: "UGC feminino IA",
    views: "612k",
    sales: "R$ 1.760",
    color: "from-money/40 to-money/10",
    initials: "AU",
  },
];

export function ProfilesDashboardMock() {
  return (
    <div className="relative w-full max-w-md">
      {/* Glow background */}
      <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-purple-ai/10 via-transparent to-money/10 blur-2xl" />

      <motion.div
        className="glass-premium relative overflow-hidden p-5 sm:p-6"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
              Painel de Perfis
            </p>
            <h3 className="mt-1 text-base font-bold text-foreground">
              Marca Fantasma · ao vivo
            </h3>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-money/30 bg-money/10 px-2.5 py-1">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-money opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-money" />
            </span>
            <span className="text-[11px] font-semibold text-money">3 ativos</span>
          </div>
        </div>

        {/* Profiles list */}
        <div className="space-y-2.5">
          {profiles.map((p, i) => (
            <motion.div
              key={p.handle}
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5 + i * 0.12 }}
              className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"
            >
              <div
                className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${p.color} text-sm font-bold text-foreground`}
              >
                {p.initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {p.handle}
                </p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {p.niche}
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center justify-end gap-1 text-[11px] text-muted-foreground">
                  <Eye className="h-3 w-3" />
                  {p.views}
                </div>
                <div className="text-xs font-bold text-money">{p.sales}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Mini chart */}
        <div className="mt-5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5 text-money" />
              <span className="text-xs text-muted-foreground">Receita 7d</span>
            </div>
            <span className="text-sm font-bold text-gradient-money">
              R$ 9.050
            </span>
          </div>
          <div className="flex items-end gap-1.5 h-16">
            {[35, 50, 42, 68, 55, 80, 100].map((h, i) => (
              <motion.div
                key={i}
                className="flex-1 rounded-t bg-gradient-to-t from-cyan/40 to-money/80"
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                transition={{ delay: 0.9 + i * 0.06, duration: 0.5 }}
              />
            ))}
          </div>
        </div>

        {/* Status line */}
        <div className="mt-4 flex items-center gap-2 text-[11px] text-muted-foreground">
          <Sparkles className="h-3 w-3 text-purple-ai" />
          <span>IA gerando conteúdo agora · 12 vídeos na fila</span>
        </div>
      </motion.div>
    </div>
  );
}
