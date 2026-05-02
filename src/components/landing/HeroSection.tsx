import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, PlayCircle } from "lucide-react";
import { ProfilesDashboardMock } from "./ProfilesDashboardMock";

export function HeroSection() {
  return (
    <section
      id="hero"
      className="relative min-h-[80vh] lg:min-h-screen flex items-center pt-20 overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-navy/40" />
      <div className="absolute top-1/3 -left-32 h-[500px] w-[500px] rounded-full bg-purple-ai/[0.10] blur-[140px]" />
      <div className="absolute top-1/4 right-0 h-[500px] w-[500px] rounded-full bg-money/[0.06] blur-[140px]" />

      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 py-12 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:py-28">
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
            <div className="h-1.5 w-1.5 rounded-full bg-purple-ai shadow-[0_0_8px_hsl(var(--purple-ai))]" />
            <span className="text-xs text-muted-foreground">
              Marca fantasma · 100% anônimo · Escala em piloto automático
            </span>
          </motion.div>

          <h1 className="text-4xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-[64px]">
            Crie perfis que{" "}
            <span className="text-gradient-money">vendem</span>{" "}
            todos os dias —{" "}
            <span className="text-gradient-cyan">sem aparecer.</span>
          </h1>

          <p className="mt-5 sm:mt-6 max-w-xl text-base sm:text-lg leading-relaxed text-muted-foreground">
            Gere vídeos, influencers IA e conteúdo viral em escala para TikTok,
            Instagram e YouTube. Você nunca aparece — sua marca trabalha sozinha.
          </p>

          <div className="mt-8 flex flex-wrap gap-3 sm:gap-4">
            <Button
              size="lg"
              className="btn-money gap-2 px-6 py-6 text-base"
              onClick={() =>
                document
                  .getElementById("planos")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Criar meu primeiro perfil agora
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="gap-2 border-white/10 bg-white/[0.02] text-foreground hover:bg-white/[0.06]"
              onClick={() =>
                document
                  .getElementById("como-funciona")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              <PlayCircle className="h-4 w-4 text-primary" />
              Ver como funciona
            </Button>
          </div>

          <div className="mt-8 sm:mt-10 flex flex-wrap items-center gap-4 sm:gap-6 text-xs sm:text-sm text-muted-foreground">
            <Pill>Anônimo</Pill>
            <Pill>Múltiplas contas</Pill>
            <Pill>Monetização integrada</Pill>
          </div>
        </motion.div>

        <motion.div
          className="hidden lg:flex items-center justify-center"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
        >
          <ProfilesDashboardMock />
        </motion.div>
      </div>
    </section>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-1.5 rounded-full bg-money shadow-[0_0_6px_hsl(var(--money))]" />
      {children}
    </div>
  );
}
