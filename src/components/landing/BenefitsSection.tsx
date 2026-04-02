import { motion } from "framer-motion";
import { Zap, Sparkles, MousePointerClick, Briefcase } from "lucide-react";

const benefits = [
  {
    icon: Sparkles,
    title: "UGC Realista",
    description: "Vídeos que parecem orgânicos, perfeitos para o algoritmo do TikTok.",
  },
  {
    icon: Zap,
    title: "Escale Múltiplas Contas",
    description: "Gere conteúdo único para cada conta sem esforço.",
  },
  {
    icon: Briefcase,
    title: "TikTok Shop Ready",
    description: "Vídeos prontos para promover produtos e converter vendas.",
  },
  {
    icon: MousePointerClick,
    title: "Geração Ilimitada",
    description: "Sem limites, crie quantos vídeos precisar para crescer rápido.",
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
            Por que usar PH Studio para <span className="text-gradient-cyan">TikTok</span>?
          </h2>
          <p className="mt-3 sm:mt-4 text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
            Tecnologia de ponta com a simplicidade que você precisa.
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
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="glass-card p-6 transition-shadow hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <b.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mb-2 text-base font-semibold text-foreground">{b.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{b.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
