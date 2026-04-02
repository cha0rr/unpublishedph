import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { HeroAnimation } from "./HeroAnimation";
import { VideoIcon } from "lucide-react";

export function HeroSection() {
  return (
    <section id="hero" className="relative min-h-[80vh] lg:min-h-screen flex items-center pt-20 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-navy-light/50" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-primary/[0.04] blur-[120px]" />

      <div className="relative mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 py-12 sm:py-20 lg:grid-cols-2 lg:gap-16 lg:py-28">
        <motion.div
          className="flex flex-col justify-center"
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <motion.div
            className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-1.5"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="h-1.5 w-1.5 rounded-full bg-green-400" />
            <span className="text-xs text-muted-foreground">UGC com IA para TikTok — Geração Ilimitada</span>
          </motion.div>

          <h1 className="text-3xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Cresça contas no TikTok com{" "}
            <span className="text-gradient-cyan">UGC gerado por IA</span>
          </h1>

          <p className="mt-4 sm:mt-6 max-w-lg text-base sm:text-lg leading-relaxed text-muted-foreground">
            Crie vídeos UGC realistas para escalar contas no TikTok, vender no TikTok Shop ou revender contas prontas.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2" onClick={() => document.getElementById('planos')?.scrollIntoView({ behavior: 'smooth' })}>
                <VideoIcon className="h-4 w-4" />
                Começar a Criar
            </Button>
          </div>

          <div className="mt-8 sm:mt-10 flex flex-wrap items-center gap-4 sm:gap-8 text-xs sm:text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="h-1 w-1 rounded-full bg-primary" />
              Uso comercial
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1 w-1 rounded-full bg-primary" />
              Uso comercial
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1 w-1 rounded-full bg-primary" />
              Ilimitado
            </div>
          </div>
        </motion.div>

        <motion.div
          className="hidden lg:flex items-center justify-center"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
        >
          <HeroAnimation />
        </motion.div>
      </div>
    </section>
  );
}
