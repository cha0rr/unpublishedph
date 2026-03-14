import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import GerarVideo from "./pages/GerarVideo.tsx";
import GerarVideoFrame from "./pages/GerarVideoFrame.tsx";
import Login from "./pages/Login.tsx";
import Registro from "./pages/Registro.tsx";
import Admin from "./pages/Admin.tsx";
import GerarImagem from "./pages/GerarImagem.tsx";
import BusinessStudioImages from "./pages/BusinessStudioImages.tsx";
import AdminGenerations from "./pages/AdminGenerations.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/gerar-video" element={<GerarVideo />} />
          <Route path="/gerar-video-frame" element={<GerarVideoFrame />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/gerar-imagem" element={<GerarImagem />} />
          <Route path="/admin/generations" element={<AdminGenerations />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
