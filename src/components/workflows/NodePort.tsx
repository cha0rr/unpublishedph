import { useEffect, useRef } from "react";
import { useWorkflow, type PortSide } from "./WorkflowContext";
import { cn } from "@/lib/utils";

interface NodePortProps {
  nodeId: string;
  side: PortSide;
  /** When true, the port is highlighted (e.g. has a value to output, or is connected). */
  active?: boolean;
  /** Optional label shown next to the port */
  label?: string;
}

/**
 * A connection port rendered absolutely on the side of a WorkflowCard.
 * - `out` (right side): pointerdown starts a wire drag.
 * - `in`  (left side):  receives the drop via hit-test in the canvas.
 */
export function NodePort({ nodeId, side, active = false, label }: NodePortProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { registerPort, unregisterPort, startConnect, connecting } = useWorkflow();

  useEffect(() => {
    if (ref.current) registerPort({ nodeId, side, el: ref.current });
    return () => unregisterPort(nodeId, side);
  }, [nodeId, side, registerPort, unregisterPort]);

  const isOut = side === "out";
  const isDropTarget = !isOut && connecting && connecting.sourceNodeId !== nodeId;

  return (
    <div
      className={cn(
        "absolute top-1/2 -translate-y-1/2 z-20 flex items-center gap-1.5 select-none",
        isOut ? "right-0 translate-x-1/2 flex-row-reverse" : "left-0 -translate-x-1/2",
      )}
    >
      <div
        ref={ref}
        data-port-node={nodeId}
        data-port-side={side}
        onPointerDown={(e) => {
          if (!isOut) return;
          e.stopPropagation();
          e.preventDefault();
          startConnect(nodeId, { x: e.clientX, y: e.clientY });
        }}
        className={cn(
          "h-3.5 w-3.5 rounded-full border-2 border-primary transition-all",
          active ? "bg-primary shadow-[0_0_8px_hsl(var(--primary))]" : "bg-background",
          isOut && "cursor-crosshair hover:scale-125",
          isDropTarget && "ring-2 ring-primary/60 scale-125",
        )}
        title={isOut ? "Arraste para conectar a outro nó" : "Solte o fio aqui para conectar"}
      />
      {label && (
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
          {label}
        </span>
      )}
    </div>
  );
}