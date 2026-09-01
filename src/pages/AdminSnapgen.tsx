import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Loader2, Save, ArrowLeft, Key, CheckCircle2, AlertTriangle, RefreshCw, TestTube2 } from "lucide-react";
import { toast } from "sonner";

interface SecretRow {
  key: string;
  value: string;
  updated_at: string;
}

/** Decodifica o payload de um JWT sem validar a assinatura. */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  if (!token || token.split(".").length !== 3) return null;
  try {
    const payload = token.split(".")[1];
    const b64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

const AdminSnapgen = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [secrets, setSecrets] = useState<{ token: SecretRow | null; exp: SecretRow | null }>({
    token: null,
    exp: null,
  });
  const [tokenDraft, setTokenDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) navigate("/login");
  }, [user, isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (isAdmin) fetchSecrets();
  }, [isAdmin]);

  const fetchSecrets = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("app_secrets")
      .select("key,value,updated_at")
      .in("key", ["snapgen_access_token", "snapgen_token_expires_at"]);
    if (error) {
      toast.error("Erro ao carregar segredos: " + error.message);
    } else {
      const rows = (data || []) as SecretRow[];
      setSecrets({
        token: rows.find((r) => r.key === "snapgen_access_token") || null,
        exp: rows.find((r) => r.key === "snapgen_token_expires_at") || null,
      });
    }
    setLoading(false);
  };

  const currentToken = secrets.token?.value || "";
  const currentPayload = currentToken ? decodeJwtPayload(currentToken) : null;
  const currentExp = currentPayload && typeof currentPayload.exp === "number"
    ? (currentPayload.exp as number) * 1000
    : 0;
  const isExpired = currentExp > 0 && currentExp < Date.now();
  const draftPayload = tokenDraft.trim() ? decodeJwtPayload(tokenDraft.trim()) : null;
  const draftExp = draftPayload && typeof draftPayload.exp === "number"
    ? (draftPayload.exp as number) * 1000
    : 0;

  const handleSave = async () => {
    const trimmed = tokenDraft.trim();
    if (!trimmed) {
      toast.error("Cole um token JWT antes de salvar.");
      return;
    }
    if (trimmed.split(".").length !== 3) {
      toast.error("O token parece inválido (esperado formato eyJ....eyJ....xxx).");
      return;
    }
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id || null;
    const expEpochMs = draftExp > 0 ? String(draftExp) : "0";

    const { error: err1 } = await supabase
      .from("app_secrets")
      .upsert(
        { key: "snapgen_access_token", value: trimmed, updated_at: new Date().toISOString(), updated_by: userId },
        { onConflict: "key" },
      );
    const { error: err2 } = await supabase
      .from("app_secrets")
      .upsert(
        { key: "snapgen_token_expires_at", value: expEpochMs, updated_at: new Date().toISOString(), updated_by: userId },
        { onConflict: "key" },
      );
    setSaving(false);

    if (err1 || err2) {
      toast.error("Erro ao salvar: " + (err1?.message || err2?.message));
      return;
    }
    toast.success("Token salvo com sucesso.");
    setTokenDraft("");
    setTestResult(null);
    fetchSecrets();
  };

  const handleClear = async () => {
    if (!confirm("Remover o token do SnapGen? A geração de vídeos vai parar até você colar um novo.")) return;
    setSaving(true);
    await supabase.from("app_secrets").upsert(
      { key: "snapgen_access_token", value: "", updated_at: new Date().toISOString() },
      { onConflict: "key" },
    );
    await supabase.from("app_secrets").upsert(
      { key: "snapgen_token_expires_at", value: "0", updated_at: new Date().toISOString() },
      { onConflict: "key" },
    );
    setSaving(false);
    toast.success("Token removido.");
    setTestResult(null);
    fetchSecrets();
  };

  /**
   * Testa se o token atual é aceito pela API do snapgen.ai.
   * Enviamos um FormData dummy (sem prompt real) e checamos se o erro
   * retornado é de autenticação (401) ou de payload (4xx outro).
   */
  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Sessão expirada. Faça login novamente.");

      const formData = new FormData();
      formData.append("prompt", "ping");
      formData.append("model", "veo-3.1-fast");
      formData.append("aspect_ratio", "16:9");
      formData.append("resolution", "720p");
      formData.append("duration", "8");
      formData.append("enhance_prompt", "true");

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/snapgen-video`,
        {
          method: "POST",
          headers: {
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${session.access_token}`,
          },
          body: formData,
        },
      );
      const data = await res.json().catch(() => ({} as any));
      if (res.status === 503 && data?.snapgen_token_missing) {
        setTestResult({ ok: false, message: "Token não configurado no banco." });
      } else if (res.status === 401) {
        setTestResult({ ok: false, message: "Token expirado ou inválido (401)." });
      } else if (res.status === 200) {
        setTestResult({ ok: true, message: "OK — token aceito pela API." });
      } else {
        // 400/422/etc = token funcionou, payload que estava errado (esperado com "ping")
        setTestResult({
          ok: true,
          message: `OK — auth passou (HTTP ${res.status}). ${
            data?.error ? "Detalhe: " + data.error : ""
          }`,
        });
      }
    } catch (err: any) {
      setTestResult({ ok: false, message: err?.message || "Erro ao testar." });
    } finally {
      setTesting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) return null;

  const fmtDate = (ms: number) =>
    new Date(ms).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "medium" });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container max-w-3xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin")} className="mb-2">
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
          </Button>
          <div className="flex items-center gap-3 mb-2">
            <Key className="h-6 w-6 text-primary" />
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              SnapGen — Token de Acesso
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            Este token é o JWT de sessão que o snapgen.ai usa para autenticar as chamadas
            de geração de vídeo. Cole aqui o valor extraído pela ferramenta local
            <code className="mx-1 px-1.5 py-0.5 rounded bg-muted text-foreground text-xs">
              tools/snapgen-extract
            </code>
            . Quando o token expirar, basta rodar a ferramenta de novo e colar aqui.
          </p>

          {/* Status atual */}
          <div className="rounded-xl border border-border bg-card p-4 mb-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status atual</span>
              {currentToken ? (
                isExpired ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-500/20 text-red-400 px-2 py-0.5 text-xs font-semibold">
                    <AlertTriangle className="h-3 w-3" /> Expirado
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-500/20 text-green-400 px-2 py-0.5 text-xs font-semibold">
                    <CheckCircle2 className="h-3 w-3" /> Ativo
                  </span>
                )
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/20 text-yellow-400 px-2 py-0.5 text-xs font-semibold">
                  <AlertTriangle className="h-3 w-3" /> Não configurado
                </span>
              )}
            </div>
            {currentToken ? (
              <div className="text-xs text-muted-foreground space-y-1">
                <div>
                  <span className="font-mono">{currentToken.slice(0, 30)}…{currentToken.slice(-10)}</span>
                  <span className="ml-2">({currentToken.length} caracteres)</span>
                </div>
                {currentExp > 0 ? (
                  <div>
                    Expira em: <span className="text-foreground">{fmtDate(currentExp)}</span>
                    {secrets.token?.updated_at && (
                      <span className="ml-3">Salvo em: {fmtDate(new Date(secrets.token.updated_at).getTime())}</span>
                    )}
                  </div>
                ) : (
                  <div>Sem informação de expiração no JWT.</div>
                )}
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">
                Nenhum token salvo. A geração de vídeo vai falhar até você colar um.
              </div>
            )}
          </div>

          {/* Editor */}
          <div className="rounded-xl border border-border bg-card p-4 mb-4 space-y-3">
            <label className="text-sm font-medium">Cole o novo token (eyJ…)</label>
            <Textarea
              value={tokenDraft}
              onChange={(e) => setTokenDraft(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="font-mono text-xs min-h-[100px] break-all"
              disabled={saving}
            />
            {tokenDraft.trim() && (
              <div className="text-xs">
                {draftPayload ? (
                  <div className="space-y-0.5 text-muted-foreground">
                    <div>
                      <CheckCircle2 className="inline h-3 w-3 text-green-400 mr-1" />
                      JWT válido
                      {typeof draftPayload.sub === "string" && (
                        <span className="ml-2">sub: <code>{draftPayload.sub}</code></span>
                      )}
                    </div>
                    {draftExp > 0 && (
                      <div>Expira em: <span className="text-foreground">{fmtDate(draftExp)}</span></div>
                    )}
                  </div>
                ) : (
                  <div className="text-red-400">
                    <AlertTriangle className="inline h-3 w-3 mr-1" />
                    Formato de JWT inválido.
                  </div>
                )}
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleSave} disabled={saving || !tokenDraft.trim()}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                Salvar
              </Button>
              <Button onClick={handleTest} variant="outline" disabled={testing || !currentToken}>
                {testing ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <TestTube2 className="h-4 w-4 mr-1" />}
                Testar agora
              </Button>
              <Button onClick={fetchSecrets} variant="ghost" disabled={loading}>
                <RefreshCw className="h-4 w-4 mr-1" /> Recarregar
              </Button>
              {currentToken && (
                <Button onClick={handleClear} variant="ghost" disabled={saving} className="text-destructive hover:text-destructive">
                  Remover token
                </Button>
              )}
            </div>
            {testResult && (
              <div
                className={`text-xs rounded-lg p-2 ${
                  testResult.ok
                    ? "bg-green-500/10 text-green-400 border border-green-500/20"
                    : "bg-red-500/10 text-red-400 border border-red-500/20"
                }`}
              >
                {testResult.ok ? "✓" : "✗"} {testResult.message}
              </div>
            )}
          </div>

          {/* Instruções */}
          <details className="rounded-xl border border-border bg-card/50 p-4 text-sm">
            <summary className="cursor-pointer font-medium text-foreground">
              Como extrair um novo token
            </summary>
            <ol className="mt-3 space-y-2 list-decimal list-inside text-muted-foreground">
              <li>
                Inicie o Chrome em modo debug (perfil dedicado):
                <pre className="mt-1 p-2 rounded bg-muted text-xs font-mono text-foreground overflow-x-auto">
                  chrome.exe --remote-debugging-port=9222 --remote-allow-origins=* --user-data-dir=$env:USERPROFILE\.snapgen-bridge
                </pre>
              </li>
              <li>
                Nesse Chrome, abra{" "}
                <a href="https://snapgen.ai/app/video-gen/veo" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                  snapgen.ai/app/video-gen/veo
                </a>{" "}
                e faça login (se necessário).
              </li>
              <li>
                Na raiz do projeto, rode:
                <pre className="mt-1 p-2 rounded bg-muted text-xs font-mono text-foreground overflow-x-auto">
                  bun run snapgen:extract
                </pre>
                O token (linha que começa com <code>eyJ…</code>) será impresso no terminal.
              </li>
              <li>Copie o token e cole no campo acima. Clique em "Salvar".</li>
              <li>Use "Testar agora" para confirmar que foi aceito pela API.</li>
            </ol>
          </details>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminSnapgen;
