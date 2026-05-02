import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function FinalCTA() {
  return (
    <section className="relative py-20 sm:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-navy/40 to-background" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[600px] rounded-full bg-money/[0.08] blur-[140px]" />
      <div className="absolute top-1/3 left-1/4 h-[300px] w-[300px] rounded-full bg-purple-ai/[0.10] blur-[120px]" />

      <motion.div
        className="relative mx-auto max-w-3xl px-4 sm:px-6 text-center"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-2xl font-bold text-foreground sm:text-3xl md:text-5xl leading-tight">
          Pronto pra construir sua primeira{" "}
          <span className="text-gradient-money">marca fantasma?</span>
        </h2>
        <p className="mt-4 sm:mt-6 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto">
          Crie perfis que vendem todos os dias enquanto você fica invisível.
          Comece hoje, escale na próxima semana.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Button
            size="lg"
            className="btn-money gap-2 px-8 py-6 text-base"
            onClick={() =>
              document
                .getElementById("planos")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            Criar meu primeiro perfil agora
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>
    </section>
  );
}
