import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TabGuard } from "@/components/TabGuard";
import Index from "./pages/Index.tsx";
import GerarVideo from "./pages/GerarVideo.tsx";
import GerarVideoFrame from "./pages/GerarVideoFrame.tsx";
import Login from "./pages/Login.tsx";
import Registro from "./pages/Registro.tsx";
import Admin from "./pages/Admin.tsx";
import GerarImagem from "./pages/GerarImagem.tsx";
import BusinessStudioImages from "./pages/BusinessStudioImages.tsx";
import AdminGenerations from "./pages/AdminGenerations.tsx";
import AdminFinanceiro from "./pages/AdminFinanceiro.tsx";
import AdminRoteiros from "./pages/AdminRoteiros.tsx";
import GerarRoteiro from "./pages/GerarRoteiro.tsx";
import MeuHistorico from "./pages/MeuHistorico.tsx";

import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <TabGuard>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/gerar-video" element={<GerarVideo />} />
          <Route path="/gerar-video-frame" element={<GerarVideoFrame />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/gerar-imagem" element={<GerarImagem />} />
          <Route path="/business/studio-images" element={<BusinessStudioImages />} />
          <Route path="/admin/generations" element={<AdminGenerations />} />
          <Route path="/admin/financeiro" element={<AdminFinanceiro />} />
          <Route path="/admin/roteiros" element={<AdminRoteiros />} />
          <Route path="/gerar-roteiro" element={<GerarRoteiro />} />
          <Route path="/meu-historico" element={<MeuHistorico />} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      </TabGuard>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
