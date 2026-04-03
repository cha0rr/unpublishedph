import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Loader2, Shield, Save, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const AdminRoteiros = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [systemPrompt, setSystemPrompt] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate("/login");
    }
  }, [user, isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (isAdmin) fetchPrompt();
  }, [isAdmin]);

  const fetchPrompt = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("system_prompts" as any)
      .select("*")
      .eq("key", "script_generator")
      .single();
    if (data) {
      setSystemPrompt((data as any).content || "");
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    // Try update first, then upsert
    const { data: existing } = await supabase
      .from("system_prompts" as any)
      .select("id")
      .eq("key", "script_generator")
      .single();

    let error;
    if (existing) {
      const result = await supabase
        .from("system_prompts" as any)
        .update({ content: systemPrompt, updated_at: new Date().toISOString() } as any)
        .eq("key", "script_generator");
      error = result.error;
    } else {
      const result = await supabase
        .from("system_prompts" as any)
        .insert({ key: "script_generator", content: systemPrompt } as any);
      error = result.error;
    }

    if (error) {
      toast.error("Erro ao salvar system prompt.");
      console.error(error);
    } else {
      toast.success("System prompt salvo com sucesso!");
    }
    setSaving(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 pt-24 sm:pt-28 pb-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-6 flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin")} className="text-muted-foreground">
              <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
            </Button>
          </div>

          <div className="mb-6 flex items-center gap-3">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">
              Gerador de Roteiros — Configuração
            </h1>
          </div>

          <div className="glass-card p-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                System Prompt
              </label>
              <p className="text-xs text-muted-foreground mb-3">
                Este prompt será usado como instrução base para a IA DeepSeek ao gerar roteiros e prompts para os usuários Pro.
              </p>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <Textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  placeholder="Ex: Você é um roteirista profissional especializado em criar roteiros para vídeos curtos de marketing..."
                  className="min-h-[300px] bg-background/50 border-border/50 text-foreground resize-y"
                />
              )}
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving || loading} className="gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Salvar System Prompt
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default AdminRoteiros;
