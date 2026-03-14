import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Básico",
    price: "R$ 59",
    period: "/mês",
    description: "Para começar a criar vídeos com IA.",
    features: [
      "Geração de vídeos ilimitada",
      "Formato 16:9",
      "Sem marca d'água",
      "Uso comercial",
    ],
    highlighted: false,
  },
  {
    name: "Pro",
    price: "R$ 79",
    period: "/mês",
    description: "Para criadores que precisam de mais flexibilidade.",
    features: [
      "Geração de vídeos ilimitada",
      "Formatos 16:9 e 9:16",
      "Sem marca d'água",
      "Uso comercial",
      "Suporte 24 horas",
    ],
    highlighted: true,
  },
  {
    name: "Business",
    price: "R$ 99",
    period: "/mês",
    description: "Para equipes e empresas que querem resultado.",
    features: [
      "Geração de vídeos ilimitada",
      "Formatos 16:9 e 9:16",
      "Gerador de roteiros com IA",
      "Sem marca d'água",
      "Uso comercial",
      "Suporte exclusivo",
      "Chamadas de vídeo semanais com consultoria",
    ],
    highlighted: false,
  },
];

export function PricingSection() {
  return (
    <section id="planos" className="relative py-24 bg-navy-light/30">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          className="mb-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
            Planos que <span className="text-gradient-cyan">escalam</span> com você
          </h2>
          <p className="mt-4 text-muted-foreground">Todos os planos com geração ilimitada e sem marca d'água.</p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -4 }}
              className={`glass-card p-8 flex flex-col ${
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
              <div className="mt-6 mb-6">
                <span className="text-4xl font-bold text-foreground">{plan.price}</span>
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
    </section>
  );
}
