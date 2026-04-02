import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/landing/Navbar";
import { TechBackground } from "@/components/landing/TechBackground";
import { Loader2, BarChart3, Zap, Image, Activity, Search, Trophy, ArrowDown, Film } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

const VIDEO_MODEL_KEYWORDS = ["video", "veo", "wan", "kling", "runway", "luma"];

function isVideoModel(model: string) {
  return VIDEO_MODEL_KEYWORDS.some((k) => model.toLowerCase().includes(k));
}

export default function AdminGenerations() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedModel, setSelectedModel] = useState("all");

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
      .from("image_generations")
      .select("id, email, model, uuid, status, used_credit, file_size, created_at")
      .order("created_at", { ascending: false });

    setGenerations((data as Generation[]) || []);
    setLoading(false);
  };

  // Derived data
  const allModels = useMemo(() => [...new Set(generations.map((g) => g.model))].sort(), [generations]);

  const filtered = useMemo(() => {
    let list = generations;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      list = list.filter((g) => g.email.toLowerCase().includes(term));
    }
    if (selectedModel !== "all") {
      list = list.filter((g) => g.model === selectedModel);
    }
    return list;
  }, [generations, searchTerm, selectedModel]);

  const userStats = useMemo(() => {
    const map: Record<string, { email: string; count: number; credits: number }> = {};
    for (const g of filtered) {
      if (!map[g.email]) map[g.email] = { email: g.email, count: 0, credits: 0 };
      map[g.email].count++;
      map[g.email].credits += Number(g.used_credit) || 0;
    }
    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [filtered]);

  const topUser = userStats[0] || null;
  const bottomUser = userStats.length > 1 ? userStats[userStats.length - 1] : null;

  const topImageModel = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const g of generations) {
      if (!isVideoModel(g.model)) counts[g.model] = (counts[g.model] || 0) + 1;
    }
    const entries = Object.entries(counts);
    return entries.length ? entries.sort((a, b) => b[1] - a[1])[0] : null;
  }, [generations]);

  const topVideoModel = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const g of generations) {
      if (isVideoModel(g.model)) counts[g.model] = (counts[g.model] || 0) + 1;
    }
    const entries = Object.entries(counts);
    return entries.length ? entries.sort((a, b) => b[1] - a[1])[0] : null;
  }, [generations]);

  const totalGenerations = filtered.length;
  const totalCredits = filtered.reduce((sum, g) => sum + (Number(g.used_credit) || 0), 0);

  const statusColor = (status: string) => {
    if (status === "completed") return "text-emerald-400";
    if (status === "failed") return "text-red-400";
    return "text-yellow-400";
  };

  if (authLoading || !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative">
      <TechBackground />
      <Navbar />
      <main className="relative z-10 pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground font-display">Gerações (Imagens & Vídeos)</h1>
            <p className="text-muted-foreground mt-1">Monitoramento de todas as gerações da plataforma</p>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar por e-mail..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-background/50 border-border/50"
              />
            </div>
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="w-full sm:w-[220px] bg-background/50 border-border/50">
                <SelectValue placeholder="Filtrar por modelo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os modelos</SelectItem>
                {allModels.map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div className="glass rounded-xl p-5 border border-border/50">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-primary/10"><BarChart3 className="h-5 w-5 text-primary" /></div>
                <span className="text-sm text-muted-foreground">Total Gerações</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{totalGenerations}</p>
            </div>
            <div className="glass rounded-xl p-5 border border-border/50">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-primary/10"><Zap className="h-5 w-5 text-primary" /></div>
                <span className="text-sm text-muted-foreground">Créditos Usados</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{totalCredits.toFixed(2)}</p>
            </div>
            {topUser && (
              <div className="glass rounded-xl p-5 border border-border/50">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-emerald-500/10"><Trophy className="h-5 w-5 text-emerald-400" /></div>
                  <span className="text-sm text-muted-foreground">Mais gerou</span>
                </div>
                <p className="text-sm font-semibold text-foreground truncate">{topUser.email}</p>
                <p className="text-xs text-muted-foreground">{topUser.count} gerações · {topUser.credits.toFixed(2)} créditos</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {bottomUser && (
              <div className="glass rounded-xl p-5 border border-border/50">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-orange-500/10"><ArrowDown className="h-5 w-5 text-orange-400" /></div>
                  <span className="text-sm text-muted-foreground">Menos gerou</span>
                </div>
                <p className="text-sm font-semibold text-foreground truncate">{bottomUser.email}</p>
                <p className="text-xs text-muted-foreground">{bottomUser.count} gerações · {bottomUser.credits.toFixed(2)} créditos</p>
              </div>
            )}
            {topImageModel && (
              <div className="glass rounded-xl p-5 border border-border/50">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-primary/10"><Image className="h-5 w-5 text-primary" /></div>
                  <span className="text-sm text-muted-foreground">Modelo Imagem + usado</span>
                </div>
                <p className="text-sm font-semibold text-foreground truncate">{topImageModel[0]}</p>
                <p className="text-xs text-muted-foreground">{topImageModel[1]} gerações</p>
              </div>
            )}
            {topVideoModel && (
              <div className="glass rounded-xl p-5 border border-border/50">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-primary/10"><Film className="h-5 w-5 text-primary" /></div>
                  <span className="text-sm text-muted-foreground">Modelo Vídeo + usado</span>
                </div>
                <p className="text-sm font-semibold text-foreground truncate">{topVideoModel[0]}</p>
                <p className="text-xs text-muted-foreground">{topVideoModel[1]} gerações</p>
              </div>
            )}
          </div>

          {/* User Summary Table */}
          {userStats.length > 0 && (
            <div className="glass rounded-xl border border-border/50 overflow-hidden mb-8">
              <div className="px-5 py-3 border-b border-border/30">
                <h2 className="text-sm font-semibold text-foreground">Resumo por Usuário</h2>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="border-border/30 hover:bg-transparent">
                    <TableHead className="text-muted-foreground">Usuário</TableHead>
                    <TableHead className="text-muted-foreground">Gerações</TableHead>
                    <TableHead className="text-muted-foreground">Créditos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userStats.map((u) => (
                    <TableRow key={u.email} className="border-border/20">
                      <TableCell className="text-foreground text-sm">{u.email}</TableCell>
                      <TableCell className="text-foreground text-sm">{u.count}</TableCell>
                      <TableCell className="text-foreground text-sm">{u.credits.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Detailed Table */}
          <div className="glass rounded-xl border border-border/50 overflow-hidden">
            <div className="px-5 py-3 border-b border-border/30">
              <h2 className="text-sm font-semibold text-foreground">Detalhamento</h2>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : filtered.length === 0 ? (
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
                  {filtered.map((g) => (
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
                        <span className={`text-sm font-medium ${statusColor(g.status)}`}>{g.status}</span>
                      </TableCell>
                      <TableCell className="text-foreground text-sm">{Number(g.used_credit || 0).toFixed(2)}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {g.file_size ? `${(g.file_size / 1024).toFixed(0)} KB` : "—"}
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
