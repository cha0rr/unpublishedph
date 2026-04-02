import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Loader2, AlertCircle, Clock } from "lucide-react";
import logo from "@/assets/logo.png";

const Login = () => {
  const navigate = useNavigate();
  const { signIn, profile, isApproved, isAdmin, user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Redirect via useEffect instead of during render
  useEffect(() => {
    if (authLoading) return;
    if (!user) return;
    if (isAdmin) {
      navigate("/admin", { replace: true });
    } else if (isApproved) {
      navigate("/gerar-video", { replace: true });
    }
  }, [user, isAdmin, isApproved, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await signIn(email, password);
      // useEffect will handle redirect once auth state updates
    } catch (err: any) {
      setError(err.message || "Erro ao fazer login.");
    } finally {
      setSubmitting(false);
    }
  };

  // If user is logged in but pending
  if (user && profile && !isApproved && !isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-lg px-4 pt-28 pb-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-8 text-center"
          >
            <Clock className="mx-auto h-16 w-16 text-primary mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">Aguardando aprovação</h2>
            <p className="text-muted-foreground mb-6">
              Sua conta está sendo analisada. Você receberá acesso assim que for aprovada pelo administrador.
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Plano: <span className="text-foreground font-medium">{profile.plan}</span>
            </p>
            <Button variant="outline" onClick={() => navigate("/")} className="border-border text-foreground">
              Voltar ao início
            </Button>
          </motion.div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-md px-4 pt-28 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8 text-center">
            <img src={logo} alt="PH Studio" className="mx-auto h-16 w-auto rounded-xl mb-4" />
            <h1 className="text-2xl font-bold text-foreground">Entrar</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Acesse sua conta PH Studio
            </p>
          </div>

          <form onSubmit={handleSubmit} className="glass-card p-6 space-y-5">
            <div className="space-y-2">
              <Label className="text-foreground">Email</Label>
              <Input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="bg-muted/30 border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Senha</Label>
              <Input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha"
                className="bg-muted/30 border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3">
                <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <Button type="submit" disabled={submitting} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Não tem conta?{" "}
              <button type="button" onClick={() => navigate("/registro")} className="text-primary hover:underline">
                Criar conta
              </button>
            </p>
          </form>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default Login;
