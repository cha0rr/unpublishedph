import { motion } from "framer-motion";
import { FileText, Wand2, Image as ImageIcon, Video, Send } from "lucide-react";

const items = [
  { icon: FileText, title: "Roteiros prontos para venda", description: "Scripts focados em conversão para social commerce." },
  { icon: Wand2, title: "Prompts criados automaticamente", description: "A IA monta o prompt ideal para você." },
  { icon: ImageIcon, title: "Imagens com IA", description: "Geração de imagens com Nano Banana 2 e Pro." },
  { icon: Video, title: "Anime e transforme em vídeos", description: "Veo 3.1 e Grok para vídeos profissionais." },
  { icon: Send, title: "Pronto para postar nas redes", description: "Formatos 9:16 e 16:9, sem marca d'água." },
];

const container = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };
const card = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.45 } } };

export function SolutionSection() {
  return (
    <section className="relative py-16 sm:py-24 bg-navy-light/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          className="mb-10 sm:mb-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl md:text-4xl">
            Agora você faz tudo dentro de um <span className="text-gradient-cyan">único sistema</span>
          </h2>
        </motion.div>

        <motion.div
          className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {items.map((it) => (
            <motion.div
              key={it.title}
              variants={card}
              whileHover={{ y: -4 }}
              className="glass-card p-6"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <it.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mb-2 text-base font-semibold text-foreground">{it.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{it.description}</p>
            </motion.div>
          ))}
        </motion.div>

        <motion.p
          className="mt-10 text-center text-base sm:text-lg text-foreground"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          Do zero ao <span className="text-gradient-cyan font-semibold">vídeo pronto em minutos</span>.
        </motion.p>
      </div>
    </section>
  );
}
