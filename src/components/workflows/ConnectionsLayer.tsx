import { useEffect, useState, type RefObject } from "react";
import { useWorkflow } from "./WorkflowContext";
import { X } from "lucide-react";

interface ConnectionsLayerProps {
  canvasRef: RefObject<HTMLDivElement>;
  zoom?: number;
  pan?: { x: number; y: number };
}

function bezierPath(x1: number, y1: number, x2: number, y2: number) {
  const dx = Math.max(40, Math.abs(x2 - x1) * 0.5);
  return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
}

export function ConnectionsLayer({ canvasRef, zoom = 1, pan = { x: 0, y: 0 } }: ConnectionsLayerProps) {
  const { connections, connecting, getPortEl, removeConnection } = useWorkflow();
  // Tick to recompute port positions every animation frame while something is moving.
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      setTick((t) => (t + 1) % 1_000_000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const canvasRect = canvasRef.current?.getBoundingClientRect();
  if (!canvasRect) return null;

  const portCenter = (el: HTMLElement | null) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return {
      x: (r.left + r.width / 2 - canvasRect.left - pan.x) / zoom,
      y: (r.top + r.height / 2 - canvasRect.top - pan.y) / zoom,
    };
  };

  const ghost = (() => {
    if (!connecting) return null;
    const src = portCenter(getPortEl(connecting.sourceNodeId, "out"));
    if (!src) return null;
    return {
      from: src,
      to: {
        x: (connecting.mouse.x - canvasRect.left - pan.x) / zoom,
        y: (connecting.mouse.y - canvasRect.top - pan.y) / zoom,
      },
    };
  })();

  // Suppress TS "unused" while still re-rendering each frame
  void tick;

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      style={{ width: "100%", height: "100%", overflow: "visible" }}
    >
      <defs>
        <marker id="wf-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="hsl(var(--primary))" />
        </marker>
      </defs>

      {connections.map((c) => {
        const src = portCenter(getPortEl(c.sourceNodeId, "out"));
        const dst = portCenter(getPortEl(c.targetNodeId, "in"));
        if (!src || !dst) return null;
        const mx = (src.x + dst.x) / 2;
        const my = (src.y + dst.y) / 2;
        return (
          <g key={c.id}>
            <path
              d={bezierPath(src.x, src.y, dst.x, dst.y)}
              stroke="hsl(var(--primary) / 0.7)"
              strokeWidth={2}
              fill="none"
              markerEnd="url(#wf-arrow)"
              style={{ pointerEvents: "stroke" }}
            />
            <g
              transform={`translate(${mx} ${my})`}
              className="cursor-pointer"
              style={{ pointerEvents: "all" }}
              onClick={(e) => {
                e.stopPropagation();
                removeConnection(c.id);
              }}
            >
              <circle r={9} fill="hsl(var(--background))" stroke="hsl(var(--primary))" strokeWidth={1.5} />
              <X x={-6} y={-6} width={12} height={12} stroke="hsl(var(--primary))" strokeWidth={2} />
            </g>
          </g>
        );
      })}

      {ghost && (
        <path
          d={bezierPath(ghost.from.x, ghost.from.y, ghost.to.x, ghost.to.y)}
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          strokeDasharray="6 4"
          fill="none"
        />
      )}
    </svg>
  );
}