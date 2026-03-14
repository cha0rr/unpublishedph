import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { HeroAnimation } from "./HeroAnimation";
import { ImageIcon, VideoIcon } from "lucide-react";

export function HeroSection() {
  return (
    <section id="hero" className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-navy-light/50" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-primary/[0.04] blur-[120px]" />

      <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-2 lg:gap-16 lg:py-28">
        {/* Left */}
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
            <span className="text-xs text-muted-foreground">Veo 3.1 — Geração Ilimitada</span>
          </motion.div>

          <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Transforme ideias em{" "}
            <span className="text-gradient-cyan">imagens e vídeos</span>{" "}
            com IA
          </h1>

          <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">
            O PH Studio gera imagens e vídeos de alta qualidade com inteligência artificial.
            Rápido, profissional e sem limites.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
              <Link to="/gerar-imagem">
                <ImageIcon className="h-4 w-4" />
                Gerar Imagem
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-border text-foreground hover:bg-white/[0.05] gap-2">
              <Link to="/gerar-video">
                <VideoIcon className="h-4 w-4" />
                Gerar Vídeo
              </Link>
            </Button>
          </div>

          <div className="mt-10 flex items-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="h-1 w-1 rounded-full bg-primary" />
              Sem marca d'água
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1 w-1 rounded-full bg-primary" />
              Uso comercial
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1 w-1 rounded-full bg-primary" />
              HD & 4K
            </div>
          </div>
        </motion.div>

        {/* Right */}
        <motion.div
          className="flex items-center justify-center"
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
