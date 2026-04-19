import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Save, Trash2, Plus, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DailyLimit {
  id: string;
  key: string;
  limit_value: number;
  enabled: boolean;
  updated_at: string;
}

const KEY_LABELS: Record<string, string> = {
  video_basico: "Vídeo - Plano Básico",
  video_pro: "Vídeo - Plano Pro",
  image_basico: "Imagem - Plano Básico",
  image_pro: "Imagem - Plano Pro",
};

const AdminLimites = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [limits, setLimits] = useState<DailyLimit[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, { limit_value: number; enabled: boolean }>>({});
  const [addOpen, setAddOpen] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newLimit, setNewLimit] = useState(30);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) navigate("/login");
  }, [user, isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (isAdmin) fetchLimits();
  }, [isAdmin]);

  const fetchLimits = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("daily_limits")
      .select("*")
      .order("key");
    if (error) {
      toast.error("Erro ao carregar limites");
    } else {
      setLimits(data || []);
      const d: Record<string, { limit_value: number; enabled: boolean }> = {};
      (data || []).forEach((l) => {
        d[l.id] = { limit_value: l.limit_value, enabled: l.enabled };
      });
      setDrafts(d);
    }
    setLoading(false);
  };

  const handleSave = async (id: string) => {
    const draft = drafts[id];
    if (!draft) return;
    setSavingId(id);
    const { error } = await supabase
      .from("daily_limits")
      .update({ limit_value: draft.limit_value, enabled: draft.enabled })
      .eq("id", id);
    setSavingId(null);
    if (error) {
      toast.error("Erro ao salvar: " + error.message);
    } else {
      toast.success("Limite atualizado");
      fetchLimits();
    }
  };

  const handleDelete = async (id: string, key: string) => {
    if (!confirm(`Remover o limite "${key}"?`)) return;
    const { error } = await supabase.from("daily_limits").delete().eq("id", id);
    if (error) toast.error("Erro: " + error.message);
    else {
      toast.success("Limite removido");
      fetchLimits();
    }
  };

  const handleAdd = async () => {
    const key = newKey.trim().toLowerCase().replace(/\s+/g, "_");
    if (!key) {
      toast.error("Informe uma chave");
      return;
    }
    const { error } = await supabase
      .from("daily_limits")
      .insert({ key, limit_value: newLimit, enabled: true });
    if (error) {
      toast.error("Erro: " + error.message);
    } else {
      toast.success("Limite criado");
      setAddOpen(false);
      setNewKey("");
      setNewLimit(30);
      fetchLimits();
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container max-w-5xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div>
              <Button variant="ghost" size="sm" onClick={() => navigate("/admin")} className="mb-2">
                <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
              </Button>
              <h1 className="text-3xl font-bold text-foreground">Limites Diários de Geração</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Configure quantas gerações por dia cada plano pode realizar. Admins ignoram qualquer limite.
              </p>
            </div>
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Novo limite
            </Button>
          </div>

          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Chave</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="w-32">Limite/dia</TableHead>
                  <TableHead className="w-24">Ativo</TableHead>
                  <TableHead className="w-40 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {limits.map((l) => {
                  const draft = drafts[l.id] || { limit_value: l.limit_value, enabled: l.enabled };
                  const dirty = draft.limit_value !== l.limit_value || draft.enabled !== l.enabled;
                  return (
                    <TableRow key={l.id}>
                      <TableCell className="font-mono text-xs">{l.key}</TableCell>
                      <TableCell className="text-sm">{KEY_LABELS[l.key] || "—"}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          value={draft.limit_value}
                          onChange={(e) =>
                            setDrafts({
                              ...drafts,
                              [l.id]: { ...draft, limit_value: parseInt(e.target.value || "0", 10) },
                            })
                          }
                          className="w-24 h-8"
                        />
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={draft.enabled}
                          onCheckedChange={(v) =>
                            setDrafts({ ...drafts, [l.id]: { ...draft, enabled: v } })
                          }
                        />
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          size="sm"
                          variant="default"
                          disabled={!dirty || savingId === l.id}
                          onClick={() => handleSave(l.id)}
                        >
                          {savingId === l.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Save className="h-3 w-3" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(l.id, l.key)}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {limits.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      Nenhum limite cadastrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <p className="text-xs text-muted-foreground mt-4">
            <strong>Dica:</strong> definir <code>Ativo</code> como desligado torna o limite ilimitado para esse plano.
            Chaves esperadas: <code>video_basico</code>, <code>video_pro</code>, <code>image_basico</code>, <code>image_pro</code>.
          </p>
        </motion.div>
      </main>
      <Footer />

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo limite</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Chave</label>
              <Input
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="ex: video_basico"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Limite/dia</label>
              <Input
                type="number"
                min={0}
                value={newLimit}
                onChange={(e) => setNewLimit(parseInt(e.target.value || "0", 10))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAdd}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminLimites;
