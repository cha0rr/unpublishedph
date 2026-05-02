import { motion } from "framer-motion";
import { Puzzle } from "lucide-react";

export function DifferentialSection() {
  return (
    <section className="relative py-20 sm:py-28 overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[300px] w-[600px] rounded-full bg-primary/[0.05] blur-[120px]" />
      <motion.div
        className="relative mx-auto max-w-3xl px-4 sm:px-6 text-center"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
      >
        <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
          <Puzzle className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground sm:text-3xl md:text-4xl leading-tight">
          Você não precisa mais montar um <span className="text-gradient-cyan">quebra-cabeça de ferramentas</span>
        </h2>
        <p className="mt-5 sm:mt-6 text-base sm:text-lg text-muted-foreground leading-relaxed">
          Enquanto outros criadores ficam pulando entre plataformas, você cria tudo em um fluxo único, simples e rápido.
        </p>
        <p className="mt-6 text-base sm:text-lg font-semibold text-foreground">
          Menos esforço. <span className="text-primary">Mais produção.</span> Mais resultado.
        </p>
      </motion.div>
    </section>
  );
}
