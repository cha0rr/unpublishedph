import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Check, X, Loader2, Shield } from "lucide-react";

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
}

const Admin = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate("/login");
    }
  }, [user, isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (isAdmin) fetchProfiles();
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

  const updateStatus = async (profileId: string, status: string) => {
    setActionLoading(profileId);
    await supabase
      .from("profiles")
      .update({ status })
      .eq("id", profileId);
    await fetchProfiles();
    setActionLoading(null);
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

  const ProfileCard = ({ profile }: { profile: ProfileRow }) => (
    <div className="glass-card p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-foreground">{profile.full_name}</h3>
          <p className="text-xs text-muted-foreground">{profile.email}</p>
        </div>
        {statusBadge(profile.status)}
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-muted-foreground">WhatsApp:</span>{" "}
          <span className="text-foreground">{profile.whatsapp}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Plano:</span>{" "}
          <span className="text-foreground capitalize">{profile.plan || "-"}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Pagamento:</span>{" "}
          <span className="text-foreground capitalize">{profile.payment_method || "-"}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Uso:</span>{" "}
          <span className="text-foreground">{profile.usage_type || "-"}</span>
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground">
        {new Date(profile.created_at).toLocaleString("pt-BR")}
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
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-4xl px-4 pt-24 sm:pt-28 pb-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-8 flex items-center gap-3">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Painel Administrativo</h1>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-8">
              {/* Pending */}
              <div>
                <h2 className="mb-4 text-lg font-semibold text-foreground">
                  Pendentes ({pending.length})
                </h2>
                {pending.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma solicitação pendente.</p>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">{pending.map((p) => <ProfileCard key={p.id} profile={p} />)}</div>
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
                  <div className="grid gap-4 sm:grid-cols-2">{approved.map((p) => <ProfileCard key={p.id} profile={p} />)}</div>
                )}
              </div>

              {/* Rejected */}
              {rejected.length > 0 && (
                <div>
                  <h2 className="mb-4 text-lg font-semibold text-foreground">
                    Rejeitados ({rejected.length})
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2">{rejected.map((p) => <ProfileCard key={p.id} profile={p} />)}</div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default Admin;
