import { motion } from "framer-motion";
import { Target, Wand2, Rocket, Banknote } from "lucide-react";

const steps = [
  {
    num: "01",
    icon: Target,
    title: "Escolha o nicho",
    description: "Dark, UGC, influencer IA, review sem rosto, cartomante, notícias…",
    accent: "text-cyan",
    bg: "bg-cyan/10",
  },
  {
    num: "02",
    icon: Wand2,
    title: "Gere vídeos + avatar IA",
    description: "Em segundos. Roteiros, voz, imagem e vídeo prontos pra postar.",
    accent: "text-purple-ai",
    bg: "bg-purple-ai/10",
  },
  {
    num: "03",
    icon: Rocket,
    title: "Poste e escale múltiplas contas",
    description: "Conteúdo único por perfil. Sem repetição, sem aparecer.",
    accent: "text-cyan",
    bg: "bg-cyan/10",
  },
  {
    num: "04",
    icon: Banknote,
    title: "Monetize",
    description: "Afiliados, produtos digitais ou tráfego. Receita em piloto automático.",
    accent: "text-money",
    bg: "bg-money/10",
    highlight: true,
  },
];

export function HowItWorks() {
  return (
    <section
      id="como-funciona"
      className="relative py-16 sm:py-24 bg-navy/30"
    >
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
          <p className="mt-4 text-muted-foreground">
            Quatro passos para transformar IA em receita recorrente.
          </p>
        </motion.div>

        <div className="relative grid gap-6 sm:gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div className="absolute top-16 left-[12.5%] right-[12.5%] hidden h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent md:block" />

          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              className={`relative text-center ${step.highlight ? "" : ""}`}
            >
              <div
                className={`mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl ${step.bg} ring-1 ring-white/10 ${
                  step.highlight ? "glow-money" : ""
                }`}
              >
                <step.icon className={`h-6 w-6 ${step.accent}`} />
              </div>
              <span
                className={`mb-2 block text-3xl font-bold ${
                  step.highlight ? "text-money/40" : "text-primary/30"
                }`}
              >
                {step.num}
              </span>
              <h3 className="mb-2 text-lg font-semibold text-foreground">
                {step.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
