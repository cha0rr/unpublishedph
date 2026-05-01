import { motion, useDragControls } from "framer-motion";
import { GripVertical, X } from "lucide-react";
import type { ReactNode } from "react";

interface WorkflowCardProps {
  id: string;
  x: number;
  y: number;
  title: string;
  icon: ReactNode;
  onRemove: () => void;
  children: ReactNode;
  width?: number;
  inputPort?: ReactNode;
  outputPort?: ReactNode;
}

export function WorkflowCard({ x, y, title, icon, onRemove, children, width = 340, inputPort, outputPort }: WorkflowCardProps) {
  const dragControls = useDragControls();

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragListener={false}
      dragControls={dragControls}
      className="absolute"
      initial={{ x, y }}
      style={{ width }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="relative rounded-lg border border-primary/30 bg-card/95 backdrop-blur-md shadow-xl shadow-primary/10">
        {inputPort}
        {outputPort}
        <div className="rounded-lg overflow-hidden">
          <div
            onPointerDown={(e) => dragControls.start(e)}
            className="flex items-center justify-between gap-2 px-3 py-2 border-b border-primary/20 bg-primary/5 cursor-grab active:cursor-grabbing select-none touch-none"
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
              {icon}
              <span>{title}</span>
            </div>
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="p-3 space-y-3">{children}</div>
        </div>
      </div>
    </motion.div>
  );
}