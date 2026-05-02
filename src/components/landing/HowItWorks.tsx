import { motion } from "framer-motion";
import { PenLine, Sparkles, Download } from "lucide-react";

const steps = [
  {
    num: "01",
    icon: PenLine,
    title: "Escreva sua ideia (ou nem isso)",
    description: "Envie a imagem do produto ou tema — a IA cuida do resto.",
  },
  {
    num: "02",
    icon: Sparkles,
    title: "A IA cria tudo",
    description: "Roteiro + imagens + vídeo, em um único fluxo automático.",
  },
  {
    num: "03",
    icon: Download,
    title: "Baixe e poste",
    description: "Pronto para vender. Sem edição, sem marca d'água.",
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
      </div>
    </section>
  );
}
