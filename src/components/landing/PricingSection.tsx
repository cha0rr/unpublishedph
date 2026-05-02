import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, Lock } from "lucide-react";
import { RegistroDialog } from "./RegistroDialog";

const plans: {
  name: string;
  originalPrice?: string;
  price: string;
  period: string;
  slug: string | null;
  description: string;
  features: string[];
  highlighted: boolean;
  comingSoon?: boolean;
}[] = [
  {
    name: "Starter",
    price: "R$ 49,90",
    period: "/mês",
    slug: "basico",
    description: "Para quem está lançando seus primeiros perfis fantasma.",
    features: [
      "Geração de vídeos ilimitada",
      "Formatos 16:9 e 9:16",
      "Frame Mode + Ingredientes",
      "Conteúdo invisível (sem aparecer)",
      "Uso comercial liberado",
    ],
    highlighted: false,
  },
  {
    name: "Growth",
    originalPrice: "R$ 89,90",
    price: "R$ 69,90",
    period: "/1º mês",
    slug: "pro",
    description: "Feito para quem quer escalar múltiplas contas e vender em volume.",
    features: [
      "Tudo do Starter",
      "Avatar Maker · influencers IA realistas",
      "Studio Imagens (Nano Banana 2 + Pro)",
      "Gerador de roteiros virais com IA",
      "Modelos premium (Veo 3.1 + Grok 3)",
      "Suporte exclusivo + consultoria semanal",
    ],
    highlighted: true,
  },
  {
    name: "Scale",
    price: "R$ 197+",
    period: "/mês",
    slug: null,
    description: "Para agências e operações com 10+ perfis em rotação.",
    features: [
      "Tudo do Growth",
      "Volume ilimitado para múltiplas contas",
      "Workflows automatizados em larga escala",
      "Acesso prioritário a novos modelos",
      "Suporte dedicado 1-a-1",
    ],
    highlighted: false,
    comingSoon: true,
  },
];

export function PricingSection() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("pro");

  const handleSelectPlan = (slug: string | null, comingSoon?: boolean) => {
    if (comingSoon || !slug) {
      window.open("https://wa.me/5511999999999?text=Quero%20entrar%20na%20lista%20de%20espera%20do%20plano%20Scale", "_blank");
      return;
    }
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
            Planos feitos para <span className="text-gradient-cyan">escalar perfis fantasma</span>
          </h2>
          <p className="mt-4 text-muted-foreground">Quanto mais contas você roda, mais você fatura.</p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3 max-w-6xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -4 }}
              className={`glass-card p-5 sm:p-8 flex flex-col relative ${
                plan.highlighted ? "border-primary/30 glow-cyan" : ""
              } ${plan.comingSoon ? "opacity-90" : ""}`}
            >
              {plan.highlighted && (
                <span className="mb-4 inline-block w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  Mais popular
                </span>
              )}
              {plan.comingSoon && (
                <span className="mb-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-white/[0.06] border border-white/10 px-3 py-1 text-xs font-semibold text-muted-foreground">
                  <Lock className="h-3 w-3" /> Em breve · Lista de espera
                </span>
              )}
              <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
              <div className="mt-4 sm:mt-6 mb-4 sm:mb-6">
                {plan.originalPrice && (
                  <span className="text-lg text-muted-foreground line-through mr-2">{plan.originalPrice}</span>
                )}
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
                onClick={() => handleSelectPlan(plan.slug, plan.comingSoon)}
                className={
                  plan.highlighted
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 w-full"
                    : "border-border text-foreground hover:bg-white/[0.05] w-full"
                }
                variant={plan.highlighted ? "default" : "outline"}
              >
                {plan.comingSoon ? "Entrar na lista de espera" : "Começar agora"}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>

      <RegistroDialog open={dialogOpen} onOpenChange={setDialogOpen} selectedPlan={selectedPlan} />
    </section>
  );
}
