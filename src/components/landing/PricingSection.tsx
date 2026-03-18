import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { RegistroDialog } from "./RegistroDialog";

const plans = [
  {
    name: "Básico",
    price: "R$ 49,90",
    period: "/mês",
    slug: "basico",
    description: "Para começar a criar vídeos com IA.",
    features: [
      "Geração de vídeos ilimitada",
      "Formatos 16:9 e 9:16",
      "Uso comercial",
    ],
    highlighted: false,
  },
  {
    name: "Pro",
    price: "R$ 69,90",
    period: "/mês",
    slug: "pro",
    description: "Tudo do Básico + ferramentas avançadas para profissionais.",
    features: [
      "Geração de vídeos ilimitada",
      "Formatos 16:9 e 9:16",
      "Gerador com Frame Mode",
      "Gerador de imagens com IA",
      "Gerador de roteiros com IA (em breve)",
      "Uso comercial",
      "Suporte exclusivo",
      "Chamadas de vídeo semanais com consultoria",
    ],
    highlighted: true,
  },
];

export function PricingSection() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("pro");

  const handleSelectPlan = (slug: string) => {
    setSelectedPlan(slug);
    setDialogOpen(true);
  };

  return (
    <section id="planos" className="relative py-16 sm:py-24 bg-navy-light/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          className="mb-10 sm:mb-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl md:text-4xl">
            Planos que <span className="text-gradient-cyan">escalam</span> com você
          </h2>
          <p className="mt-4 text-muted-foreground">Todos os planos com geração ilimitada e sem marca d'água.</p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 max-w-3xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -4 }}
              className={`glass-card p-5 sm:p-8 flex flex-col ${
                plan.highlighted ? "border-primary/30 glow-cyan" : ""
              }`}
            >
              {plan.highlighted && (
                <span className="mb-4 inline-block w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  Mais popular
                </span>
              )}
              <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
              <div className="mt-4 sm:mt-6 mb-4 sm:mb-6">
                <span className="text-3xl sm:text-4xl font-bold text-foreground">{plan.price}</span>
                {plan.period && <span className="text-sm text-muted-foreground">{plan.period}</span>}
              </div>
              <ul className="mb-8 flex-1 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => handleSelectPlan(plan.slug)}
                className={
                  plan.highlighted
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 w-full"
                    : "border-border text-foreground hover:bg-white/[0.05] w-full"
                }
                variant={plan.highlighted ? "default" : "outline"}
              >
                Começar agora
              </Button>
            </motion.div>
          ))}
        </div>
      </div>

      <RegistroDialog open={dialogOpen} onOpenChange={setDialogOpen} selectedPlan={selectedPlan} />
    </section>
  );
}
