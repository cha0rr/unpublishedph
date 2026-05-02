import { motion } from "framer-motion";
import { TrendingUp, Layers, Ghost, EyeOff } from "lucide-react";

const benefits = [
  {
    icon: TrendingUp,
    title: "Automatize vendas",
    description: "Perfis que postam, engajam e convertem sem você aparecer um segundo sequer.",
  },
  {
    icon: Layers,
    title: "Escale múltiplos perfis",
    description: "Conteúdo único por conta, sem deixar rastro de duplicidade entre suas páginas.",
  },
  {
    icon: Ghost,
    title: "Marca fantasma",
    description: "Crie influencers IA que vendem por você 24/7 — sua identidade fica protegida.",
  },
  {
    icon: EyeOff,
    title: "Conteúdo invisível",
    description: "UGC, dark e nicho gerados em volume com 1 clique. Você só posta e fatura.",
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
            Por que criadores estão migrando pro <span className="text-gradient-cyan">PH Studio</span>
          </h2>
          <p className="mt-3 sm:mt-4 text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
            A stack completa para quem vive de perfis fantasma e quer escalar sem ser visto.
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
