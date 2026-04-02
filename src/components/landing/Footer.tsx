import { Link } from "react-router-dom";
import { MessageCircle, Youtube } from "lucide-react";
import logo from "@/assets/logo.png";

export function Footer() {
  return (
    <footer className="border-t border-white/[0.06] bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 sm:py-16">
        <div className="flex flex-col items-center text-center">
          <Link to="/" className="flex items-center gap-2 mb-4">
            <img src={logo} alt="PH Studio" className="h-9 w-auto rounded-lg" />
          </Link>
          <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
            Plataforma de vídeos com IA para criadores e vendedores no <span className="tiktok-text-sm">TikTok</span>.
            Desenvolvido por PH Labs.
          </p>
          <div className="mt-6 flex gap-4">
            <a href="https://wa.me/5585982089367" target="_blank" rel="noopener noreferrer" className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors">
              <MessageCircle size={16} />
            </a>
            <a href="https://www.youtube.com/@phlabs-ai" target="_blank" rel="noopener noreferrer" className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors">
              <Youtube size={16} />
            </a>
          </div>
        </div>

        <div className="mt-10 sm:mt-16 border-t border-white/[0.06] pt-6 sm:pt-8 text-center">
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} PH Labs. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
