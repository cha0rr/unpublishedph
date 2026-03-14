import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { VideoIcon } from "lucide-react";

export function ModesSection() {
  return (
    <section id="modos" className="relative py-24">
      <div className="mx-auto max-w-3xl px-6">
        <motion.div
          className="mb-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
            Gerador de <span className="text-gradient-cyan">Vídeos</span>
          </h2>
          <p className="mt-4 text-muted-foreground">Crie vídeos profissionais com o poder do Veo 3.1.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          whileHover={{ y: -4 }}
          className="glass-card overflow-hidden"
        >
          <div className="p-8">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <VideoIcon className="h-5 w-5 text-primary" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-foreground">Gerador de Vídeos com IA</h3>
            <p className="mb-6 text-sm text-muted-foreground leading-relaxed">
              Transforme prompts em vídeos profissionais com Veo 3.1. Até 4K, sem marca d'água, uso comercial liberado.
            </p>
            <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Link to="/gerar-video">Gerar Vídeo</Link>
            </Button>
          </div>
          <div className="border-t border-white/[0.06] bg-white/[0.01] p-6">
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
          </div>
        </motion.div>
      </div>
    </section>
  );
}
