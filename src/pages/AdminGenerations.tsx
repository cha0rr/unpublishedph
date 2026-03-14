import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/landing/Navbar";
import { TechBackground } from "@/components/landing/TechBackground";
import { Loader2, BarChart3, Zap, Image, Activity } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Generation {
  id: string;
  email: string;
  model: string;
  uuid: string;
  status: string;
  used_credit: number;
  file_size: number | null;
  created_at: string;
}

export default function AdminGenerations() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate("/");
    }
  }, [authLoading, user, isAdmin, navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    fetchGenerations();
  }, [isAdmin]);

  const fetchGenerations = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("image_generations" as any)
      .select("id, email, model, uuid, status, used_credit, file_size, created_at")
      .order("created_at", { ascending: false });

    setGenerations((data as any as Generation[]) || []);
    setLoading(false);
  };

  if (authLoading || !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalGenerations = generations.length;
  const totalCredits = generations.reduce((sum, g) => sum + (Number(g.used_credit) || 0), 0);
  const modelCounts = generations.reduce<Record<string, number>>((acc, g) => {
    acc[g.model] = (acc[g.model] || 0) + 1;
    return acc;
  }, {});

  const statusColor = (status: string) => {
    if (status === "completed") return "text-emerald-400";
    if (status === "failed") return "text-red-400";
    return "text-yellow-400";
  };

  return (
    <div className="min-h-screen bg-background relative">
      <TechBackground />
      <Navbar />
      <main className="relative z-10 pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground font-display">Gerações de Imagens</h1>
            <p className="text-muted-foreground mt-1">Painel administrativo de monitoramento</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="glass rounded-xl p-5 border border-border/50">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm text-muted-foreground">Total Gerações</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{totalGenerations}</p>
            </div>

            <div className="glass rounded-xl p-5 border border-border/50">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm text-muted-foreground">Créditos Usados</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{totalCredits.toFixed(2)}</p>
            </div>

            {Object.entries(modelCounts).map(([model, count]) => (
              <div key={model} className="glass rounded-xl p-5 border border-border/50">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Image className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-sm text-muted-foreground truncate">{model}</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{count}</p>
              </div>
            ))}

            {Object.keys(modelCounts).length === 0 && (
              <>
                <div className="glass rounded-xl p-5 border border-border/50">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Image className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-sm text-muted-foreground">nano-banana-2</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">0</p>
                </div>
                <div className="glass rounded-xl p-5 border border-border/50">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Activity className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-sm text-muted-foreground">nano-banana-pro</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">0</p>
                </div>
              </>
            )}
          </div>

          {/* Table */}
          <div className="glass rounded-xl border border-border/50 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : generations.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                Nenhuma geração encontrada.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-border/30 hover:bg-transparent">
                    <TableHead className="text-muted-foreground">Usuário</TableHead>
                    <TableHead className="text-muted-foreground">Modelo</TableHead>
                    <TableHead className="text-muted-foreground">UUID</TableHead>
                    <TableHead className="text-muted-foreground">Status</TableHead>
                     <TableHead className="text-muted-foreground">Créditos</TableHead>
                     <TableHead className="text-muted-foreground">Tamanho</TableHead>
                     <TableHead className="text-muted-foreground">Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {generations.map((g) => (
                    <TableRow key={g.id} className="border-border/20">
                      <TableCell className="text-foreground text-sm">{g.email}</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium">
                          {g.model}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs font-mono max-w-[120px] truncate">
                        {g.uuid || "—"}
                      </TableCell>
                      <TableCell>
                        <span className={`text-sm font-medium ${statusColor(g.status)}`}>
                          {g.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-foreground text-sm">
                        {Number(g.used_credit || 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(g.created_at).toLocaleDateString("pt-BR")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
