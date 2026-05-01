import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/landing/Navbar";
import { WorkflowCanvas } from "@/components/workflows/WorkflowCanvas";
import { Loader2 } from "lucide-react";

export default function Workflows() {
  const { user, isApproved, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const redirected = useRef(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      if (!redirected.current) {
        redirected.current = true;
        navigate("/login");
      }
      return;
    }
    if (!isApproved && !isAdmin) {
      if (!redirected.current) {
        redirected.current = true;
        navigate("/");
      }
    }
  }, [user, isApproved, isAdmin, loading, navigate]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="pt-16 flex-1 flex flex-col">
        <header className="px-6 py-4 border-b border-white/[0.06]">
          <h1 className="text-2xl font-bold text-foreground">Workflows</h1>
          <p className="text-sm text-muted-foreground">
            Clique em qualquer área vazia do canvas para adicionar um nó. Arraste os cards pelo cabeçalho para reorganizá-los.
          </p>
        </header>
        <div className="flex-1 relative overflow-hidden">
          <WorkflowCanvas />
        </div>
      </div>
    </div>
  );
}