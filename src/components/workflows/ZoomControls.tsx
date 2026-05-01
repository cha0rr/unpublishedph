import { Minus, Plus, Maximize2 } from "lucide-react";

interface ZoomControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

export function ZoomControls({ zoom, onZoomIn, onZoomOut, onReset }: ZoomControlsProps) {
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="absolute bottom-4 right-4 z-20 flex items-center gap-1 rounded-lg border border-primary/30 bg-card/95 backdrop-blur-md shadow-xl shadow-primary/10 p-1"
    >
      <button
        type="button"
        onClick={onZoomOut}
        title="Zoom out (Ctrl -)"
        className="p-2 rounded hover:bg-primary/10 text-foreground transition-colors"
      >
        <Minus className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onReset}
        title="Resetar zoom (Ctrl 0)"
        className="px-2 py-1 min-w-14 text-xs font-medium tabular-nums rounded hover:bg-primary/10 text-foreground transition-colors"
      >
        {Math.round(zoom * 100)}%
      </button>
      <button
        type="button"
        onClick={onZoomIn}
        title="Zoom in (Ctrl +)"
        className="p-2 rounded hover:bg-primary/10 text-foreground transition-colors"
      >
        <Plus className="h-4 w-4" />
      </button>
      <div className="w-px h-5 bg-primary/20 mx-1" />
      <button
        type="button"
        onClick={onReset}
        title="Ajustar (100%)"
        className="p-2 rounded hover:bg-primary/10 text-foreground transition-colors"
      >
        <Maximize2 className="h-4 w-4" />
      </button>
    </div>
  );
}