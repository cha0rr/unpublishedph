import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/landing/Navbar";
import { TechBackground } from "@/components/landing/TechBackground";
import {
  Loader2, DollarSign, TrendingUp, Zap, BarChart3, Users, Lightbulb, CalendarIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { format, subDays, startOfDay, isAfter, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Generation {
  id: string;
  email: string;
  model: string;
  used_credit: number;
  created_at: string;
  status: string | null;
}

const CREDIT_VALUE = 0.025;

const MODEL_CREDITS: Record<string, number> = {
  "veo-3.1": 3,
  "veo-3.1-fast": 3,
  "nano-banana-2": 2,
  "nano-banana-pro": 2,
};

function getModelCredits(model: string): number {
  return MODEL_CREDITS[model] ?? 1;
}

type PeriodFilter = "today" | "7d" | "30d" | "custom";

const AdminFinanceiro = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodFilter>("30d");
  const [customFrom, setCustomFrom] = useState<Date | undefined>();
  const [customTo, setCustomTo] = useState<Date | undefined>();

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) navigate("/login");
  }, [user, isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("image_generations")
        .select("id, email, model, used_credit, created_at, status")
        .order("created_at", { ascending: false });
      setGenerations((data as Generation[]) || []);
      setLoading(false);
    })();
  }, [isAdmin]);

  const filtered = useMemo(() => {
    const now = new Date();
    let from: Date | null = null;
    let to: Date | null = null;

    if (period === "today") from = startOfDay(now);
    else if (period === "7d") from = subDays(now, 7);
    else if (period === "30d") from = subDays(now, 30);
    else if (period === "custom") {
      from = customFrom ? startOfDay(customFrom) : null;
      to = customTo ? new Date(customTo.getTime() + 86400000 - 1) : null;
    }

    return generations.filter((g) => {
      const d = new Date(g.created_at);
      if (from && isBefore(d, from)) return false;
      if (to && isAfter(d, to)) return false;
      return true;
    });
  }, [generations, period, customFrom, customTo]);

  const totalCredits = useMemo(() => filtered.reduce((s, g) => s + (Number(g.used_credit) || 0), 0), [filtered]);
  const totalCost = totalCredits * CREDIT_VALUE;
  const avgCost = filtered.length ? totalCost / filtered.length : 0;

  const modelStats = useMemo(() => {
    const map: Record<string, { model: string; count: number; credits: number }> = {};
    for (const g of filtered) {
      if (!map[g.model]) map[g.model] = { model: g.model, count: 0, credits: 0 };
      map[g.model].count++;
      map[g.model].credits += Number(g.used_credit) || 0;
    }
    return Object.values(map).sort((a, b) => b.credits - a.credits);
  }, [filtered]);

  const userStats = useMemo(() => {
    const map: Record<string, { email: string; count: number; credits: number }> = {};
    for (const g of filtered) {
      if (!map[g.email]) map[g.email] = { email: g.email, count: 0, credits: 0 };
      map[g.email].count++;
      map[g.email].credits += Number(g.used_credit) || 0;
    }
    return Object.values(map).sort((a, b) => b.credits - a.credits);
  }, [filtered]);

  const insights = useMemo(() => {
    const items: string[] = [];
    if (modelStats.length > 0 && totalCredits > 0) {
      const top = modelStats[0];
      const pct = ((top.credits / totalCredits) * 100).toFixed(1);
      items.push(`O modelo "${top.model}" representa ${pct}% do custo total.`);
    }
    if (userStats.length > 0 && totalCredits > 0) {
      const top = userStats[0];
      const pct = ((top.credits / totalCredits) * 100).toFixed(1);
      items.push(`O usuário "${top.email}" é responsável por ${pct}% dos gastos.`);
    }
    if (filtered.length > 0) {
      const dates = filtered.map((g) => startOfDay(new Date(g.created_at)).getTime());
      const uniqueDays = new Set(dates).size;
      if (uniqueDays > 0) {
        const dailyAvg = (totalCost / uniqueDays).toFixed(2);
        items.push(`Média de gasto diário: R$ ${dailyAvg}.`);
      }
    }
    return items;
  }, [modelStats, userStats, filtered, totalCredits, totalCost]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!isAdmin) return null;

  const fmtBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="min-h-screen bg-background relative">
      <TechBackground />
      <Navbar />
      <div className="relative z-10 mx-auto max-w-5xl px-4 pt-24 sm:pt-28 pb-20">
        <div className="mb-8 flex items-center gap-3">
          <DollarSign className="h-6 w-6 text-primary" />
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Análise Financeira</h1>
        </div>

        {/* Period filters */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {(["today", "7d", "30d", "custom"] as PeriodFilter[]).map((p) => {
            const labels: Record<PeriodFilter, string> = { today: "Hoje", "7d": "7 dias", "30d": "30 dias", custom: "Personalizado" };
            return (
              <Button
                key={p}
                size="sm"
                variant={period === p ? "default" : "outline"}
                onClick={() => setPeriod(p)}
                className="text-xs"
              >
                {labels[p]}
              </Button>
            );
          })}
          {period === "custom" && (
            <div className="flex items-center gap-2 ml-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("text-xs", !customFrom && "text-muted-foreground")}>
                    <CalendarIcon className="mr-1 h-3 w-3" />
                    {customFrom ? format(customFrom, "dd/MM/yyyy", { locale: ptBR }) : "De"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={customFrom} onSelect={setCustomFrom} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
              <span className="text-muted-foreground text-xs">até</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("text-xs", !customTo && "text-muted-foreground")}>
                    <CalendarIcon className="mr-1 h-3 w-3" />
                    {customTo ? format(customTo, "dd/MM/yyyy", { locale: ptBR }) : "Até"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={customTo} onSelect={setCustomTo} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Custo Total", value: fmtBRL(totalCost), icon: DollarSign, color: "text-green-400" },
                { label: "Créditos Consumidos", value: totalCredits.toLocaleString("pt-BR"), icon: Zap, color: "text-yellow-400" },
                { label: "Custo Médio/Geração", value: fmtBRL(avgCost), icon: TrendingUp, color: "text-blue-400" },
                { label: "Total Gerações", value: filtered.length.toLocaleString("pt-BR"), icon: BarChart3, color: "text-purple-400" },
              ].map((card) => (
                <div key={card.label} className="glass-card p-4 space-y-1">
                  <div className="flex items-center gap-2">
                    <card.icon className={cn("h-4 w-4", card.color)} />
                    <span className="text-xs text-muted-foreground">{card.label}</span>
                  </div>
                  <p className="text-lg font-bold text-foreground">{card.value}</p>
                </div>
              ))}
            </div>

            {/* Insights */}
            {insights.length > 0 && (
              <div className="glass-card p-4 space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="h-4 w-4 text-yellow-400" />
                  <h2 className="text-sm font-semibold text-foreground">Insights</h2>
                </div>
                {insights.map((text, i) => (
                  <p key={i} className="text-xs text-muted-foreground">• {text}</p>
                ))}
              </div>
            )}

            {/* Cost by model */}
            <div className="glass-card p-4">
              <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" /> Custo por Modelo
              </h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Modelo</TableHead>
                    <TableHead className="text-xs text-right">Gerações</TableHead>
                    <TableHead className="text-xs text-right">Créditos</TableHead>
                    <TableHead className="text-xs text-right">Custo (R$)</TableHead>
                    <TableHead className="text-xs text-right">% do Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {modelStats.map((m) => (
                    <TableRow key={m.model}>
                      <TableCell className="text-xs font-medium">{m.model}</TableCell>
                      <TableCell className="text-xs text-right">{m.count}</TableCell>
                      <TableCell className="text-xs text-right">{m.credits.toLocaleString("pt-BR")}</TableCell>
                      <TableCell className="text-xs text-right">{fmtBRL(m.credits * CREDIT_VALUE)}</TableCell>
                      <TableCell className="text-xs text-right">
                        {totalCredits > 0 ? ((m.credits / totalCredits) * 100).toFixed(1) + "%" : "0%"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Cost by user */}
            <div className="glass-card p-4">
              <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" /> Custo por Usuário
              </h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">#</TableHead>
                    <TableHead className="text-xs">E-mail</TableHead>
                    <TableHead className="text-xs text-right">Gerações</TableHead>
                    <TableHead className="text-xs text-right">Créditos</TableHead>
                    <TableHead className="text-xs text-right">Custo (R$)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userStats.slice(0, 20).map((u, i) => (
                    <TableRow key={u.email}>
                      <TableCell className="text-xs">{i + 1}</TableCell>
                      <TableCell className="text-xs font-medium">{u.email}</TableCell>
                      <TableCell className="text-xs text-right">{u.count}</TableCell>
                      <TableCell className="text-xs text-right">{u.credits.toLocaleString("pt-BR")}</TableCell>
                      <TableCell className="text-xs text-right">{fmtBRL(u.credits * CREDIT_VALUE)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminFinanceiro;
