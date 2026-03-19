import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

const statusConfig = {
  approved: {
    icon: CheckCircle,
    iconClass: "text-green-400",
    title: "Pagamento confirmado!",
    description: "Seu plano foi ativado com sucesso. Faça login para começar a usar o PH Studio.",
    primaryAction: { label: "Fazer Login", path: "/login" },
  },
  pending: {
    icon: Clock,
    iconClass: "text-yellow-400",
    title: "Pagamento em processamento",
    description: "Seu pagamento está sendo processado. Você será notificado assim que for confirmado. Isso pode levar alguns minutos.",
    primaryAction: { label: "Ir para Login", path: "/login" },
  },
  failure: {
    icon: XCircle,
    iconClass: "text-destructive",
    title: "Pagamento não aprovado",
    description: "Houve um problema com seu pagamento. Tente novamente ou escolha outra forma de pagamento.",
    primaryAction: { label: "Tentar novamente", path: "/registro" },
  },
} as const;

const PagamentoStatus = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const status = searchParams.get("status") as keyof typeof statusConfig || "failure";
  const config = statusConfig[status] || statusConfig.failure;
  const Icon = config.icon;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-lg px-4 pt-28 pb-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-8 text-center"
        >
          <Icon className={`mx-auto h-16 w-16 ${config.iconClass} mb-4`} />
          <h2 className="text-2xl font-bold text-foreground mb-2">{config.title}</h2>
          <p className="text-muted-foreground mb-6">{config.description}</p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => navigate("/")} className="border-border text-foreground">
              Voltar ao início
            </Button>
            <Button
              onClick={() => navigate(config.primaryAction.path)}
              className="bg-primary text-primary-foreground"
            >
              {config.primaryAction.label}
            </Button>
          </div>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default PagamentoStatus;
