import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Check, X, Loader2, Shield, CalendarIcon, AlertTriangle, Trash2, ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ProfileRow {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  whatsapp: string;
  usage_type: string | null;
  payment_method: string | null;
  plan: string | null;
  status: string;
  created_at: string;
  subscription_expires_at: string | null;
}

interface TabViolation {
  id: string;
  user_id: string;
  email: string;
  created_at: string;
}

const PLANS = [
  { value: "basico", label: "Básico" },
  { value: "pro", label: "Pro" },
];

const Admin = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [violations, setViolations] = useState<TabViolation[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<ProfileRow | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate("/login");
    }
  }, [user, isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchProfiles();
      fetchViolations();
    }
  }, [isAdmin]);

  const fetchProfiles = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    setProfiles((data as ProfileRow[]) || []);
    setLoading(false);
  };

  const fetchViolations = async () => {
    const { data } = await supabase
      .from("tab_violations" as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    setViolations((data as unknown as TabViolation[]) || []);
  };

  const updateStatus = async (profileId: string, status: string) => {
    setActionLoading(profileId);
    await supabase.from("profiles").update({ status }).eq("id", profileId);
    await fetchProfiles();
    setActionLoading(null);
  };

  const updatePlan = async (profileId: string, plan: string) => {
    setActionLoading(profileId);
    const { error } = await supabase
      .from("profiles")
      .update({ plan } as any)
      .eq("id", profileId);
    if (error) {
      toast.error("Erro ao atualizar plano.");
    } else {
      toast.success("Plano atualizado.");
    }
    await fetchProfiles();
    setActionLoading(null);
  };

  const updateExpiration = async (profileId: string, date: Date | undefined) => {
    setActionLoading(profileId);
    const { error } = await supabase
      .from("profiles")
      .update({ subscription_expires_at: date ? date.toISOString() : null } as any)
      .eq("id", profileId);
    if (error) {
      toast.error("Erro ao atualizar vencimento.");
    } else {
      toast.success(date ? "Vencimento definido." : "Vencimento removido.");
    }
    await fetchProfiles();
    setActionLoading(null);
  };

  const deleteUser = async () => {
    if (!deleteConfirm) return;
    setDeleteLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-delete-user`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ userId: deleteConfirm.user_id }),
        }
      );
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      toast.success("Conta excluída com sucesso.");
      setDeleteConfirm(null);
      await fetchProfiles();
    } catch (err: any) {
      toast.error(err.message || "Erro ao excluir conta.");
    } finally {
      setDeleteLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) return null;

  const pending = profiles.filter((p) => p.status === "pending");
  const approved = profiles.filter((p) => p.status === "approved");
  const rejected = profiles.filter((p) => p.status === "rejected");

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-500/20 text-yellow-400",
      approved: "bg-green-500/20 text-green-400",
      rejected: "bg-red-500/20 text-red-400",
    };
    const labels: Record<string, string> = {
      pending: "Pendente",
      approved: "Aprovado",
      rejected: "Rejeitado",
    };
    return (
      <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${colors[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const ProfileCard = ({ profile }: { profile: ProfileRow }) => {
    const expired = isExpired(profile.subscription_expires_at);

    return (
      <div className="glass-card p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-foreground">{profile.full_name}</h3>
            <p className="text-xs text-muted-foreground">{profile.email}</p>
          </div>
          <div className="flex items-center gap-1.5">
            {expired && (
              <span className="inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold bg-red-500/20 text-red-400">
                Vencido
              </span>
            )}
            {statusBadge(profile.status)}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-muted-foreground">WhatsApp:</span>{" "}
            <span className="text-foreground">{profile.whatsapp}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Pagamento:</span>{" "}
            <span className="text-foreground capitalize">{profile.payment_method || "-"}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Uso:</span>{" "}
            <span className="text-foreground">{profile.usage_type || "-"}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Vencimento:</span>{" "}
            <span className={cn("text-foreground", expired && "text-red-400 font-semibold")}>
              {profile.subscription_expires_at
                ? format(new Date(profile.subscription_expires_at), "dd/MM/yyyy", { locale: ptBR })
                : "-"}
            </span>
          </div>
        </div>

        {/* Plan selector */}
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Plano</p>
          <Select
            value={profile.plan || ""}
            onValueChange={(val) => updatePlan(profile.id, val)}
            disabled={actionLoading === profile.id}
          >
            <SelectTrigger className="h-8 text-xs bg-background/50 border-border/50">
              <SelectValue placeholder="Selecionar plano" />
            </SelectTrigger>
            <SelectContent>
              {PLANS.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Expiration date picker */}
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Vencimento da mensalidade</p>
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  disabled={actionLoading === profile.id}
                  className={cn(
                    "h-8 flex-1 justify-start text-left text-xs font-normal bg-background/50 border-border/50",
                    !profile.subscription_expires_at && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-3 w-3" />
                  {profile.subscription_expires_at
                    ? format(new Date(profile.subscription_expires_at), "dd/MM/yyyy", { locale: ptBR })
                    : "Definir data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={profile.subscription_expires_at ? new Date(profile.subscription_expires_at) : undefined}
                  onSelect={(date) => updateExpiration(profile.id, date)}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            {profile.subscription_expires_at && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateExpiration(profile.id, undefined)}
                disabled={actionLoading === profile.id}
                className="h-8 px-2 border-border/50 text-muted-foreground hover:text-destructive"
                title="Remover vencimento"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground">
          Cadastro: {new Date(profile.created_at).toLocaleString("pt-BR")}
        </p>

        {profile.status === "pending" && (
          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              onClick={() => updateStatus(profile.id, "approved")}
              disabled={actionLoading === profile.id}
              className="flex-1 bg-green-600 hover:bg-green-700 text-foreground gap-1"
            >
              {actionLoading === profile.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
              Aprovar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => updateStatus(profile.id, "rejected")}
              disabled={actionLoading === profile.id}
              className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10 gap-1"
            >
              <X className="h-3 w-3" />
              Rejeitar
            </Button>
          </div>
        )}
        {profile.status !== "pending" && (
          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => updateStatus(profile.id, "pending")}
              disabled={actionLoading === profile.id}
              className="text-xs border-border text-muted-foreground"
            >
              Resetar para pendente
            </Button>
          </div>
        )}
        <div className="pt-1 border-t border-border/30">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setDeleteConfirm(profile)}
            className="w-full text-xs border-destructive/30 text-destructive hover:bg-destructive/10 gap-1"
          >
            <Trash2 className="h-3 w-3" />
            Excluir conta
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-4xl px-4 pt-24 sm:pt-28 pb-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-4 flex items-center gap-3">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Painel Administrativo</h1>
          </div>
          <div className="mb-8 flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => navigate("/admin/generations")} className="text-xs">
              📊 Gerações
            </Button>
            <Button size="sm" variant="outline" onClick={() => navigate("/admin/financeiro")} className="text-xs">
              💰 Financeiro
            </Button>
            <Button size="sm" variant="outline" onClick={() => navigate("/admin/roteiros")} className="text-xs">
              📝 Roteiros
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-8">
              {/* Tab Violations */}
              {violations.length > 0 && (
                <div>
                  <h2 className="mb-4 text-lg font-semibold text-foreground flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    Tentativas de Múltiplas Abas ({violations.length})
                  </h2>
                  <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-2">
                    {violations.map((v) => (
                      <div key={v.id} className="flex items-center justify-between text-sm py-2 border-b border-border/20 last:border-0">
                        <span className="text-foreground font-medium">{v.email}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(v.created_at).toLocaleString("pt-BR")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pending */}
              <div>
                <h2 className="mb-4 text-lg font-semibold text-foreground">
                  Pendentes ({pending.length})
                </h2>
                {pending.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma solicitação pendente.</p>
                ) : (
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">{pending.map((p) => <ProfileCard key={p.id} profile={p} />)}</div>
                )}
              </div>

              {/* Approved */}
              <div>
                <h2 className="mb-4 text-lg font-semibold text-foreground">
                  Aprovados ({approved.length})
                </h2>
                {approved.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum usuário aprovado.</p>
                ) : (
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">{approved.map((p) => <ProfileCard key={p.id} profile={p} />)}</div>
                )}
              </div>

              {/* Rejected */}
              {rejected.length > 0 && (
                <div>
                  <h2 className="mb-4 text-lg font-semibold text-foreground">
                    Rejeitados ({rejected.length})
                  </h2>
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">{rejected.map((p) => <ProfileCard key={p.id} profile={p} />)}</div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir conta</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir a conta de <strong>{deleteConfirm?.full_name}</strong> ({deleteConfirm?.email})?
              Esta ação é irreversível e removerá todos os dados do usuário.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)} disabled={deleteLoading}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={deleteUser} disabled={deleteLoading}>
              {deleteLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Trash2 className="h-4 w-4 mr-1" />}
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Footer />
    </div>
  );
};

export default Admin;
