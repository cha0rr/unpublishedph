import { useEffect, useRef } from "react";
import { ImageIcon, Film, Video, User } from "lucide-react";

export type NodeType = "text-to-image" | "text-to-video" | "image-to-video" | "avatar";

interface NodeMenuProps {
  x: number;
  y: number;
  onSelect: (type: NodeType) => void;
  onClose: () => void;
}

const OPTIONS: { type: NodeType; label: string; icon: React.ComponentType<{ className?: string }>; description: string }[] = [
  { type: "text-to-image", label: "Texto para Imagem", icon: ImageIcon, description: "Gere imagens a partir de um prompt" },
  { type: "text-to-video", label: "Texto para Vídeo", icon: Film, description: "Gere vídeos a partir de um prompt" },
  { type: "image-to-video", label: "Imagem para Vídeo", icon: Video, description: "Anime uma imagem de referência" },
  { type: "avatar", label: "Criação de Avatar", icon: User, description: "Crie um influencer digital" },
];

export function NodeMenu({ x, y, onSelect, onClose }: NodeMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    setTimeout(() => document.addEventListener("mousedown", handle), 0);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handle);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute z-50 w-64 rounded-lg border border-primary/30 bg-card/95 backdrop-blur-md shadow-xl shadow-primary/20 p-2"
      style={{ left: x, top: y }}
    >
      <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Adicionar nó
      </div>
      {OPTIONS.map((opt) => {
        const Icon = opt.icon;
        return (
          <button
            key={opt.type}
            onClick={() => onSelect(opt.type)}
            className="w-full flex items-start gap-3 px-2 py-2 rounded-md hover:bg-primary/10 transition-colors text-left"
          >
            <Icon className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">{opt.label}</div>
              <div className="text-xs text-muted-foreground">{opt.description}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}