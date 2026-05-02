import { motion } from "framer-motion";
import { Banknote, Layers, EyeOff, Ghost } from "lucide-react";

const benefits = [
  {
    icon: Banknote,
    title: "Automatize vendas",
    description:
      "Afiliados e ofertas rodando 24/7. A IA produz, posta e converte enquanto você dorme.",
    accent: "text-money",
    ring: "ring-money/30",
    bg: "bg-money/10",
  },
  {
    icon: Layers,
    title: "Escala de perfis",
    description:
      "Múltiplas contas com conteúdo único em cada uma. Sem repetição, sem shadowban.",
    accent: "text-cyan",
    ring: "ring-cyan/30",
    bg: "bg-cyan/10",
  },
  {
    icon: EyeOff,
    title: "Conteúdo invisível",
    description:
      "Você nunca aparece. A IA é o rosto, a voz e o roteiro. 100% anônimo.",
    accent: "text-purple-ai",
    ring: "ring-purple-ai/30",
    bg: "bg-purple-ai/10",
  },
  {
    icon: Ghost,
    title: "Marca fantasma",
    description:
      "Branding de nicho sem identidade real. Construa império digital sem expor sua vida.",
    accent: "text-foreground",
    ring: "ring-white/15",
    bg: "bg-white/[0.04]",
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export function BenefitsSection() {
  return (
    <section className="relative py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          className="mb-10 sm:mb-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl md:text-4xl">
            Tudo o que uma equipe de 10 pessoas faria —{" "}
            <span className="text-gradient-money">você sozinho, no automático.</span>
          </h2>
          <p className="mt-3 sm:mt-4 text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
            Quatro alavancas para quem quer construir um império de perfis sem expor a vida real.
          </p>
        </motion.div>

        <motion.div
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {benefits.map((b) => (
            <motion.div
              key={b.title}
              variants={cardVariants}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="glass-premium p-6 transition-shadow"
            >
              <div
                className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${b.bg} ring-1 ${b.ring}`}
              >
                <b.icon className={`h-5 w-5 ${b.accent}`} />
              </div>
              <h3 className="mb-2 text-base font-semibold text-foreground">
                {b.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {b.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
