import { motion } from "framer-motion";
import { Target, Wand2, Rocket, DollarSign } from "lucide-react";

const steps = [
  {
    num: "01",
    icon: Target,
    title: "Escolha o nicho",
    description: "Dark, UGC, influencer IA, review sem rosto, cartomante, rural, notícias — você decide.",
  },
  {
    num: "02",
    icon: Wand2,
    title: "Gere vídeos + avatar IA",
    description: "Em escala, com 1 clique. Sem aparecer, sem gravar, sem editar.",
  },
  {
    num: "03",
    icon: Rocket,
    title: "Poste e escale múltiplas contas",
    description: "Replique para 5, 10, 50 perfis em automático. Sem rastros, sem duplicidade.",
  },
];

export function HowItWorks() {
  return (
    <section id="como-funciona" className="relative py-16 sm:py-24 bg-navy-light/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          className="mb-10 sm:mb-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl md:text-4xl">
            Como <span className="text-gradient-cyan">funciona</span>
          </h2>
          <p className="mt-4 text-muted-foreground">Três passos para escalar suas contas no TikTok.</p>
        </motion.div>

        <div className="relative grid gap-6 sm:gap-8 md:grid-cols-3">
          <div className="absolute top-16 left-[16.66%] right-[16.66%] hidden h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent md:block" />

          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="relative text-center"
            >
              <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl glass-card">
                <step.icon className="h-6 w-6 text-primary" />
              </div>
              <span className="mb-2 block text-3xl font-bold text-primary/30">{step.num}</span>
              <h3 className="mb-2 text-lg font-semibold text-foreground">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">{step.description}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-10 sm:mt-14 max-w-2xl mx-auto"
        >
          <div className="glass-card border-primary/30 glow-cyan p-6 flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/15">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-foreground">
                Monetize com afiliados, TikTok Shop ou produtos digitais
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Você só foca em vender. A criação de conteúdo roda no automático.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
