import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { RegistroDialog } from "./RegistroDialog";

// NOTA: a regra de negócio do backend ainda usa apenas "basico" e "pro".
// Os 3 tiers abaixo são uma visualização de posicionamento — o tier "Scale"
// também envia "pro" como slug até a refatoração de planos no Supabase.
const plans: {
  name: string;
  originalPrice?: string;
  price: string;
  period: string;
  slug: string;
  description: string;
  features: string[];
  highlighted: boolean;
  cta: string;
  variant: "starter" | "growth" | "scale";
}[] = [
  {
    name: "Starter",
    price: "R$ 59",
    period: "/mês",
    slug: "basico",
    description: "Pra quem está começando o primeiro perfil fantasma.",
    features: [
      "1 conta principal",
      "Geração de vídeos ilimitada",
      "Formatos 9:16 e 16:9",
      "Frame Mode",
      "Uso comercial",
    ],
    highlighted: false,
    cta: "Começar agora",
    variant: "starter",
  },
  {
    name: "Growth",
    originalPrice: "R$ 129",
    price: "R$ 97",
    period: "/mês",
    slug: "pro",
    description: "Pra escalar múltiplos perfis e monetizar de verdade.",
    features: [
      "Múltiplos perfis simultâneos",
      "Avatar IA (influencer fictício)",
      "Geração de imagens (Nano Banana 2 e Pro)",
      "Gerador de roteiros e prompts com IA",
      "Roteiros virais por nicho",
      "Suporte prioritário",
      "Uso comercial total",
    ],
    highlighted: true,
    cta: "Quero escalar agora",
    variant: "growth",
  },
  {
    name: "Scale",
    price: "R$ 197",
    period: "/mês",
    slug: "pro",
    description: "Pra quem opera em escala — múltiplas marcas fantasmas.",
    features: [
      "Tudo do Growth",
      "Volume estendido para múltiplas contas",
      "Consultoria semanal por vídeo chamada",
      "Estratégia de monetização 1:1",
      "Acesso prioritário a novos modelos",
    ],
    highlighted: false,
    cta: "Falar com especialista",
    variant: "scale",
  },
];

export function PricingSection() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("growth");

  const handleSelectPlan = (variant: string) => {
    setSelectedPlan(variant);
    setDialogOpen(true);
  };

  return (
    <section
      id="planos"
      className="relative py-16 sm:py-24 bg-navy/30"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          className="mb-10 sm:mb-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <span className="text-xs uppercase tracking-[0.3em] text-money">
            Investimento
          </span>
          <h2 className="mt-3 text-2xl font-bold text-foreground sm:text-3xl md:text-4xl">
            Feito pra quem quer escalar{" "}
            <span className="text-gradient-money">múltiplas contas.</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Cancele quando quiser. Sem fidelidade.
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3 max-w-6xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -6 }}
              className={`relative flex flex-col p-6 sm:p-8 ${
                plan.highlighted
                  ? "glass-premium glow-money border-money/30"
                  : "glass-card"
              }`}
            >
              {plan.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-money to-cyan px-3 py-1 text-[11px] font-bold text-background shadow-lg">
                  ⭐ Mais popular
                </span>
              )}
              {plan.variant === "scale" && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-purple-ai/20 border border-purple-ai/40 px-3 py-1 text-[11px] font-bold text-purple-ai">
                  Operadores em escala
                </span>
              )}

              <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground min-h-[2.5rem]">
                {plan.description}
              </p>

              <div className="mt-5 mb-5">
                {plan.originalPrice && (
                  <span className="mr-2 text-base text-muted-foreground line-through">
                    {plan.originalPrice}
                  </span>
                )}
                <span
                  className={`text-4xl font-bold ${
                    plan.highlighted
                      ? "text-gradient-money"
                      : "text-foreground"
                  }`}
                >
                  {plan.price}
                </span>
                <span className="text-sm text-muted-foreground">
                  {plan.period}
                </span>
              </div>

              <ul className="mb-8 flex-1 space-y-3">
                {plan.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <Check
                      className={`h-4 w-4 shrink-0 mt-0.5 ${
                        plan.highlighted ? "text-money" : "text-primary"
                      }`}
                    />
                    {f}
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handleSelectPlan(plan.variant)}
                className={
                  plan.highlighted
                    ? "btn-money w-full"
                    : "border-white/10 bg-white/[0.03] text-foreground hover:bg-white/[0.07] w-full"
                }
                variant={plan.highlighted ? "default" : "outline"}
              >
                {plan.cta}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>

      <RegistroDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        selectedPlan={selectedPlan}
      />
    </section>
  );
}
