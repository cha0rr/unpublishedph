import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Loader2, CheckCircle } from "lucide-react";
import logo from "@/assets/logo.jpeg";

const WHATSAPP_NUMBER = "5585982089367";

const plans: Record<string, string> = {
  basico: "Básico — R$ 59/mês",
  pro: "Pro — R$ 79/mês",
  business: "Business — R$ 129/mês",
};

const Registro = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const selectedPlan = searchParams.get("plano") || "pro";

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    whatsapp: "",
    usage_type: "",
    payment_method: "",
    plan: selectedPlan,
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data, error: fnError } = await supabase.functions.invoke("register", {
        body: form,
      });

      if (fnError) throw new Error(fnError.message);
      if (!data?.success) throw new Error(data?.error || "Erro ao registrar.");

      setSuccess(true);

      // Build WhatsApp message
      const planLabel = plans[form.plan] || form.plan;
      const message = encodeURIComponent(
        `🎬 *Nova solicitação PH Studio*\n\n` +
        `*Nome:* ${form.full_name}\n` +
        `*Email:* ${form.email}\n` +
        `*WhatsApp:* ${form.whatsapp}\n` +
        `*Plano:* ${planLabel}\n` +
        `*Tipo de uso:* ${form.usage_type}\n` +
        `*Pagamento:* ${form.payment_method}`
      );

      // Open WhatsApp in new tab
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, "_blank");
    } catch (err: any) {
      setError(err.message || "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-lg px-4 pt-28 pb-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-8 text-center"
          >
            <CheckCircle className="mx-auto h-16 w-16 text-green-400 mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">Solicitação enviada!</h2>
            <p className="text-muted-foreground mb-6">
              Sua conta foi criada e está aguardando aprovação. Envie a mensagem pelo WhatsApp que foi aberto para agilizar o processo.
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => navigate("/login")} className="border-border text-foreground">
                Ir para Login
              </Button>
              <Button
                onClick={() => {
                  const planLabel = plans[form.plan] || form.plan;
                  const message = encodeURIComponent(
                    `🎬 *Nova solicitação PH Studio*\n\n*Nome:* ${form.full_name}\n*Email:* ${form.email}\n*WhatsApp:* ${form.whatsapp}\n*Plano:* ${planLabel}\n*Tipo de uso:* ${form.usage_type}\n*Pagamento:* ${form.payment_method}`
                  );
                  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, "_blank");
                }}
                className="bg-primary text-primary-foreground"
              >
                Reenviar WhatsApp
              </Button>
            </div>
          </motion.div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-lg px-4 pt-28 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8 text-center">
            <img src={logo} alt="PH Studio" className="mx-auto h-16 w-auto rounded-xl mb-4" />
            <h1 className="text-2xl font-bold text-foreground">Criar Conta</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Preencha seus dados para solicitar acesso ao PH Studio
            </p>
          </div>

          <form onSubmit={handleSubmit} className="glass-card p-6 space-y-5">
            {/* Plan */}
            <div className="space-y-2">
              <Label className="text-foreground">Plano</Label>
              <Select value={form.plan} onValueChange={(v) => handleChange("plan", v)}>
                <SelectTrigger className="bg-muted/30 border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basico">Básico — R$ 59/mês</SelectItem>
                  <SelectItem value="pro">Pro — R$ 79/mês</SelectItem>
                  <SelectItem value="business">Business — R$ 129/mês</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Full Name */}
            <div className="space-y-2">
              <Label className="text-foreground">Nome completo *</Label>
              <Input
                required
                value={form.full_name}
                onChange={(e) => handleChange("full_name", e.target.value)}
                placeholder="Seu nome completo"
                className="bg-muted/30 border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label className="text-foreground">Email *</Label>
              <Input
                required
                type="email"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="seu@email.com"
                className="bg-muted/30 border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label className="text-foreground">Senha *</Label>
              <Input
                required
                type="password"
                value={form.password}
                onChange={(e) => handleChange("password", e.target.value)}
                placeholder="Mínimo 6 caracteres"
                minLength={6}
                className="bg-muted/30 border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {/* WhatsApp */}
            <div className="space-y-2">
              <Label className="text-foreground">WhatsApp *</Label>
              <Input
                required
                value={form.whatsapp}
                onChange={(e) => handleChange("whatsapp", e.target.value)}
                placeholder="(00) 00000-0000"
                className="bg-muted/30 border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {/* Usage Type */}
            <div className="space-y-2">
              <Label className="text-foreground">Tipo de uso</Label>
              <Textarea
                value={form.usage_type}
                onChange={(e) => handleChange("usage_type", e.target.value)}
                placeholder="Ex: Marketing, redes sociais, conteúdo para clientes..."
                className="bg-muted/30 border-border text-foreground placeholder:text-muted-foreground min-h-[80px] resize-none"
              />
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <Label className="text-foreground">Forma de pagamento</Label>
              <Select value={form.payment_method} onValueChange={(v) => handleChange("payment_method", v)}>
                <SelectTrigger className="bg-muted/30 border-border text-foreground">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="cartao">Cartão de Crédito</SelectItem>
                  <SelectItem value="boleto">Boleto</SelectItem>
                  <SelectItem value="transferencia">Transferência Bancária</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {error && (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Enviar solicitação"
              )}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Já tem uma conta?{" "}
              <button type="button" onClick={() => navigate("/login")} className="text-primary hover:underline">
                Fazer login
              </button>
            </p>
          </form>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default Registro;
