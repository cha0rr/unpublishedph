import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Menu, X, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import logo from "@/assets/logo.png";

const navLinks = [
  { label: "Início", href: "#hero" },
  { label: "Como Funciona", href: "#como-funciona" },
  { label: "Planos", href: "#planos" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, profile, isAdmin, isApproved, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const isPro = profile?.plan === "pro" && profile?.status === "approved";

  const scrollTo = (id: string) => {
    setMobileOpen(false);
    if (window.location.pathname !== "/") {
      navigate("/");
      setTimeout(() => {
        const el = document.querySelector(id);
        el?.scrollIntoView({ behavior: "smooth" });
      }, 300);
    } else {
      const el = document.querySelector(id);
      el?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <motion.nav
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/[0.06]"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <img src={logo} alt="PH Studio" className="h-9 w-auto rounded-lg" />
        </Link>

        <div className="hidden items-center gap-6 md:flex shrink-0">
          {navLinks.map((link) => (
            <button
              key={link.label}
              onClick={() => scrollTo(link.href)}
              className="relative text-sm text-muted-foreground transition-colors hover:text-foreground whitespace-nowrap after:absolute after:-bottom-1 after:left-0 after:h-[2px] after:w-0 after:bg-primary after:transition-all hover:after:w-full"
            >
              {link.label}
            </button>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              {isAdmin && (
                <>
                  <Button variant="ghost" size="sm" className="text-primary" onClick={() => navigate("/admin")}>
                    Admin
                  </Button>
                  <Button variant="ghost" size="sm" className="text-primary" onClick={() => navigate("/admin/generations")}>
                    Gerações
                  </Button>
                </>
              )}
              {(isApproved || isAdmin) && (
                <>
                  <Button size="sm" variant={currentPath === "/gerar-video" ? "default" : "outline"} className={currentPath === "/gerar-video" ? "bg-primary text-primary-foreground hover:bg-primary/90 ring-2 ring-primary/50" : "border-primary/50 text-primary hover:bg-primary/10"} onClick={() => navigate("/gerar-video")}>
                    Gerar Vídeo
                  </Button>
                  <Button size="sm" variant="outline" className={currentPath === "/gerar-video-frame" ? "bg-primary text-primary-foreground hover:bg-primary/90 ring-2 ring-primary/50 border-primary" : "border-primary/50 text-primary hover:bg-primary/10"} onClick={() => navigate("/gerar-video-frame")}>
                    Frame Mode
                  </Button>
                  <Button size="sm" variant="outline" className={currentPath === "/meu-historico" ? "bg-primary text-primary-foreground hover:bg-primary/90 ring-2 ring-primary/50 border-primary" : "border-primary/50 text-primary hover:bg-primary/10"} onClick={() => navigate("/meu-historico")}>
                    Histórico
                  </Button>
                </>
              )}
              {(isPro || isAdmin) && (
                <>
                  <Button size="sm" variant="outline" className={currentPath === "/business/studio-images" ? "bg-primary text-primary-foreground hover:bg-primary/90 ring-2 ring-primary/50 border-primary" : "border-primary/50 text-primary hover:bg-primary/10"} onClick={() => navigate("/business/studio-images")}>
                    Studio Imagens
                  </Button>
                  <Button size="sm" variant="outline" className={currentPath === "/avatar-maker" ? "bg-primary text-primary-foreground hover:bg-primary/90 ring-2 ring-primary/50 border-primary" : "border-primary/50 text-primary hover:bg-primary/10"} onClick={() => navigate("/avatar-maker")}>
                    Avatar Maker
                  </Button>
                  <Button size="sm" variant="outline" className={currentPath === "/gerar-roteiro" ? "bg-primary text-primary-foreground hover:bg-primary/90 ring-2 ring-primary/50 border-primary" : "border-primary/50 text-primary hover:bg-primary/10"} onClick={() => navigate("/gerar-roteiro")}>
                    Roteiros
                  </Button>
                </>
              )}
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" onClick={() => navigate("/login")}>
                Entrar
              </Button>
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => navigate("/registro")}>
                Começar Agora
              </Button>
            </>
          )}
        </div>

        <button className="md:hidden text-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="border-t border-white/[0.06] bg-background/95 backdrop-blur-xl md:hidden"
        >
          <div className="flex flex-col gap-4 px-6 py-6">
            {navLinks.map((link) => (
              <button key={link.label} onClick={() => scrollTo(link.href)} className="text-left text-sm text-muted-foreground hover:text-foreground">
                {link.label}
              </button>
            ))}
            <div className="flex flex-col gap-3 pt-2">
              {user ? (
                <>
                  {isAdmin && (
                    <>
                      <Button variant="ghost" size="sm" className="justify-start text-primary" onClick={() => { setMobileOpen(false); navigate("/admin"); }}>
                        Admin
                      </Button>
                      <Button variant="ghost" size="sm" className="justify-start text-primary" onClick={() => { setMobileOpen(false); navigate("/admin/generations"); }}>
                        Gerações
                      </Button>
                    </>
                  )}
                  {(isApproved || isAdmin) && (
                    <>
                      <Button size="sm" variant={currentPath === "/gerar-video" ? "default" : "outline"} className={currentPath === "/gerar-video" ? "bg-primary text-primary-foreground hover:bg-primary/90 ring-2 ring-primary/50" : "border-primary/50 text-primary hover:bg-primary/10"} onClick={() => { setMobileOpen(false); navigate("/gerar-video"); }}>
                        Gerar Vídeo
                      </Button>
                      <Button size="sm" variant="outline" className={currentPath === "/gerar-video-frame" ? "bg-primary text-primary-foreground hover:bg-primary/90 ring-2 ring-primary/50 border-primary" : "border-primary/50 text-primary hover:bg-primary/10"} onClick={() => { setMobileOpen(false); navigate("/gerar-video-frame"); }}>
                        Frame Mode
                      </Button>
                      <Button size="sm" variant="outline" className={currentPath === "/meu-historico" ? "bg-primary text-primary-foreground hover:bg-primary/90 ring-2 ring-primary/50 border-primary" : "border-primary/50 text-primary hover:bg-primary/10"} onClick={() => { setMobileOpen(false); navigate("/meu-historico"); }}>
                        Histórico
                      </Button>
                    </>
                  )}
                   {(isPro || isAdmin) && (
                    <>
                      <Button size="sm" variant="outline" className={currentPath === "/business/studio-images" ? "bg-primary text-primary-foreground hover:bg-primary/90 ring-2 ring-primary/50 border-primary" : "border-primary/50 text-primary hover:bg-primary/10"} onClick={() => { setMobileOpen(false); navigate("/business/studio-images"); }}>
                        Studio Imagens
                      </Button>
                      <Button size="sm" variant="outline" className={currentPath === "/avatar-maker" ? "bg-primary text-primary-foreground hover:bg-primary/90 ring-2 ring-primary/50 border-primary" : "border-primary/50 text-primary hover:bg-primary/10"} onClick={() => { setMobileOpen(false); navigate("/avatar-maker"); }}>
                        Avatar Maker
                      </Button>
                      <Button size="sm" variant="outline" className={currentPath === "/gerar-roteiro" ? "bg-primary text-primary-foreground hover:bg-primary/90 ring-2 ring-primary/50 border-primary" : "border-primary/50 text-primary hover:bg-primary/10"} onClick={() => { setMobileOpen(false); navigate("/gerar-roteiro"); }}>
                        Roteiros
                      </Button>
                    </>
                  )}
                  <Button variant="outline" size="sm" className="border-border text-foreground" onClick={handleSignOut}>
                    Sair
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" size="sm" className="flex-1 border-border text-foreground" onClick={() => { setMobileOpen(false); navigate("/login"); }}>
                    Entrar
                  </Button>
                  <Button size="sm" className="flex-1 bg-primary text-primary-foreground" onClick={() => { setMobileOpen(false); navigate("/registro"); }}>
                    Começar Agora
                  </Button>
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
}
