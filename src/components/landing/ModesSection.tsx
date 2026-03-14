import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ImageIcon, VideoIcon } from "lucide-react";

const modes = [
  {
    icon: ImageIcon,
    title: "Gerador de Imagens",
    description: "Crie imagens únicas a partir de texto. Artes, fotos realistas, ilustrações e muito mais.",
    cta: "Gerar Imagem",
    href: "/gerar-imagem",
    mockup: (
      <div className="grid grid-cols-2 gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="aspect-square rounded-lg bg-gradient-to-br from-primary/20 via-muted/30 to-transparent border border-white/[0.04]" />
        ))}
      </div>
    ),
  },
  {
    icon: VideoIcon,
    title: "Gerador de Vídeos",
    description: "Transforme prompts em vídeos profissionais com Veo 3.1. Até 4K, sem marca d'água.",
    cta: "Gerar Vídeo",
    href: "/gerar-video",
    mockup: (
      <div className="space-y-2">
        <div className="aspect-video rounded-lg bg-gradient-to-br from-primary/15 via-muted/20 to-transparent border border-white/[0.04] flex items-center justify-center">
          <div className="h-8 w-8 rounded-full border-2 border-primary/40 flex items-center justify-center">
            <div className="h-0 w-0 border-t-[5px] border-b-[5px] border-l-[9px] border-transparent border-l-primary/60 ml-0.5" />
          </div>
        </div>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-1.5 flex-1 rounded-full bg-primary/20" />
          ))}
        </div>
      </div>
    ),
  },
];

export function ModesSection() {
  return (
    <section id="modos" className="relative py-24">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          className="mb-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
            Escolha seu <span className="text-gradient-cyan">modo</span>
          </h2>
          <p className="mt-4 text-muted-foreground">Imagens ou vídeos — a escolha é sua.</p>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-2">
          {modes.map((mode, i) => (
            <motion.div
              key={mode.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              whileHover={{ y: -4 }}
              className="glass-card overflow-hidden"
            >
              <div className="p-8">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <mode.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mb-2 text-xl font-bold text-foreground">{mode.title}</h3>
                <p className="mb-6 text-sm text-muted-foreground leading-relaxed">{mode.description}</p>
                <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <Link to={mode.href}>{mode.cta}</Link>
                </Button>
              </div>
              <div className="border-t border-white/[0.06] bg-white/[0.01] p-6">{mode.mockup}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
