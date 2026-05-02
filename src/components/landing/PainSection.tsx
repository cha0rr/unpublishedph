import { motion } from "framer-motion";
import { MessageSquare, Image as ImageIcon, Scissors, Captions, Sparkles, X } from "lucide-react";

const oldTools = [
  { icon: MessageSquare, name: "ChatGPT", role: "pra roteiro" },
  { icon: ImageIcon, name: "Midjourney", role: "pra imagem" },
  { icon: Scissors, name: "Editor", role: "pra vídeo" },
  { icon: Captions, name: "Outro app", role: "pra legenda" },
];

export function PainSection() {
  return (
    <section className="relative py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          className="mb-10 sm:mb-14 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl md:text-4xl">
            Cansado de usar <span className="text-gradient-cyan">várias ferramentas</span> pra criar um único vídeo?
          </h2>
          <p className="mt-3 sm:mt-4 text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
            No final, você perde horas pra criar algo simples.
          </p>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-2 items-stretch">
          {/* ANTES */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="glass-card p-6 sm:p-8"
          >
            <span className="inline-block mb-4 rounded-full bg-destructive/10 px-3 py-1 text-xs font-semibold text-destructive">
              Antes
            </span>
            <h3 className="text-lg font-semibold text-foreground mb-5">O quebra-cabeça das ferramentas</h3>
            <ul className="space-y-3">
              {oldTools.map((t) => (
                <li
                  key={t.name}
                  className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.04]">
                    <t.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <span className="flex-1 text-sm text-muted-foreground line-through">
                    <strong className="text-foreground/70 font-medium">{t.name}</strong> {t.role}
                  </span>
                  <X className="h-4 w-4 text-destructive/70" />
                </li>
              ))}
            </ul>
            <p className="mt-5 text-xs text-muted-foreground">
              Resultado: horas perdidas, fluxo travado e custo somando.
            </p>
          </motion.div>

          {/* AGORA */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="glass-card glow-cyan p-6 sm:p-8 border-primary/30 relative overflow-hidden"
          >
            <span className="inline-block mb-4 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              Agora com PH Studio
            </span>
            <div className="flex items-center gap-3 mb-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Tudo em um único fluxo</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Roteiro, prompt, imagem, vídeo e legenda — um sistema, um clique, pronto pra postar.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-2 text-xs">
              {["Roteiro", "Prompt", "Imagem", "Vídeo"].map((step) => (
                <div
                  key={step}
                  className="rounded-lg border border-primary/20 bg-primary/[0.06] py-2 text-center text-primary"
                >
                  {step}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
