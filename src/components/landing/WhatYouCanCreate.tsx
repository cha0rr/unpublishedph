import { motion } from "framer-motion";
import { UserCircle2, EyeOff, Moon, Sparkles } from "lucide-react";

const items = [
  {
    icon: UserCircle2,
    title: "Influencer IA feminina",
    description: "Avatares realistas que vendem produtos 24/7 sem você gravar nada.",
  },
  {
    icon: EyeOff,
    title: "Review sem rosto",
    description: "Vídeos no estilo POV, mãos e voz off — sem nunca aparecer na câmera.",
  },
  {
    icon: Moon,
    title: "Canal dark automatizado",
    description: "Páginas de fatos, mistérios e notícias que rodam em piloto automático.",
  },
  {
    icon: Sparkles,
    title: "UGC fake com IA",
    description: "Depoimentos e unboxings hiper-realistas para afiliados e dropshipping.",
  },
];

export function WhatYouCanCreate() {
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
            O que você pode criar em <span className="text-gradient-cyan">minutos</span>
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            Nichos comprovados que faturam todo dia — sem rosto, sem voz, sem aparecer.
          </p>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 max-w-4xl mx-auto">
          {items.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -4 }}
              className="glass-card p-6 flex gap-4 items-start"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <item.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground mb-1">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}