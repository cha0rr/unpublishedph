import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2, CheckCircle } from "lucide-react";

const WHATSAPP_NUMBER = "5585982089367";

const plans: Record<string, string> = {
  basico: "Básico — R$ 49,90/mês",
  pro: "Pro — R$ 79,90/mês",
};

interface RegistroDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedPlan: string;
}

export function RegistroDialog({ open, onOpenChange, selectedPlan }: RegistroDialogProps) {
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

  // Sync plan when dialog opens with a different plan
  useState(() => {
    setForm((prev) => ({ ...prev, plan: selectedPlan }));
  });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const buildWhatsAppMessage = () => {
    const planLabel = plans[form.plan] || form.plan;
    return encodeURIComponent(
      `🎬 *Nova solicitação PH Studio*\n\n` +
      `*Nome:* ${form.full_name}\n` +
      `*Email:* ${form.email}\n` +
      `*WhatsApp:* ${form.whatsapp}\n` +
      `*Plano:* ${planLabel}\n` +
      `*Tipo de uso:* ${form.usage_type}\n` +
      `*Pagamento:* ${form.payment_method}`
    );
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

      const userId = data.userId;

      const { data: mpData, error: mpError } = await supabase.functions.invoke("mercadopago-create-preference", {
        body: {
          userId,
          plan: form.plan,
          email: form.email,
          origin: window.location.origin,
        },
      });

      if (mpError) throw new Error(mpError.message);
      if (!mpData?.success) throw new Error(mpData?.error || "Erro ao criar pagamento.");

      const checkoutUrl = mpData.init_point;
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        throw new Error("URL de checkout não disponível.");
      }
    } catch (err: any) {
      setError(err.message || "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = (value: boolean) => {
    if (!value) {
      // Reset state when closing
      setSuccess(false);
      setError("");
      setForm({
        full_name: "",
        email: "",
        password: "",
        whatsapp: "",
        usage_type: "",
        payment_method: "",
        plan: selectedPlan,
      });
    }
    onOpenChange(value);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-background border-border">
        {success ? (
          <div className="text-center py-4">
            <CheckCircle className="mx-auto h-16 w-16 text-green-400 mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">Redirecionando para pagamento...</h2>
            <p className="text-muted-foreground mb-6">
              Você será redirecionado para o Mercado Pago para concluir o pagamento.
            </p>
            <Button variant="outline" onClick={() => handleClose(false)} className="border-border text-foreground">
              Fechar
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-foreground">Criar Conta</DialogTitle>
              <DialogDescription>
                Preencha seus dados para solicitar acesso ao PH Studio
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Plan */}
              <div className="space-y-2">
                <Label className="text-foreground">Plano</Label>
                <Select value={form.plan} onValueChange={(v) => handleChange("plan", v)}>
                  <SelectTrigger className="bg-muted/30 border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basico">Básico — R$ 49,90/mês</SelectItem>
                    <SelectItem value="pro">Pro — R$ 79,90/mês</SelectItem>
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

              {/* Payment is handled by Mercado Pago */}

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
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
