import { useCallback, useEffect, useRef, useState } from "react";
import { NodeMenu, type NodeType } from "./NodeMenu";
import { TextToImageNode } from "./nodes/TextToImageNode";
import { TextToVideoNode } from "./nodes/TextToVideoNode";
import { ImageToVideoNode } from "./nodes/ImageToVideoNode";
import { AvatarNode } from "./nodes/AvatarNode";
import { WorkflowProvider, useWorkflow } from "./WorkflowContext";
import { ConnectionsLayer } from "./ConnectionsLayer";
import { ZoomControls } from "./ZoomControls";

const ZOOM_MIN = 0.4;
const ZOOM_MAX = 2;
const ZOOM_STEP = 0.1;
const clampZoom = (z: number) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(z * 100) / 100));

export interface WorkflowNode {
  id: string;
  type: NodeType;
  x: number;
  y: number;
}

function CanvasInner() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const pointerDownTargetRef = useRef<EventTarget | null>(null);
  const panRef = useRef<{ x: number; y: number; sl: number; st: number } | null>(null);
  const panMovedRef = useRef(false);
  const { connecting, updateConnectingMouse, completeConnect, cancelConnect } = useWorkflow();

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const downTarget = pointerDownTargetRef.current;
    pointerDownTargetRef.current = null;
    // Only open the menu if the press started on the empty canvas (not on a card/port)
    if (downTarget !== canvasRef.current && downTarget !== innerRef.current) return;
    if (e.target !== canvasRef.current && e.target !== innerRef.current) return;
    if (connecting) return; // ignore clicks while wiring
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const scrollLeft = canvasRef.current?.scrollLeft ?? 0;
    const scrollTop = canvasRef.current?.scrollTop ?? 0;
    setMenu({
      x: (e.clientX - rect.left + scrollLeft) / zoom,
      y: (e.clientY - rect.top + scrollTop) / zoom,
    });
  }, [connecting, zoom]);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    pointerDownTargetRef.current = e.target;
    if (e.button === 1 && canvasRef.current) {
      e.preventDefault();
      try { canvasRef.current.setPointerCapture(e.pointerId); } catch { /* noop */ }
      panRef.current = {
        x: e.clientX,
        y: e.clientY,
        sl: canvasRef.current.scrollLeft,
        st: canvasRef.current.scrollTop,
      };
      panMovedRef.current = false;
      setIsPanning(true);
    }
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!panRef.current || !canvasRef.current) return;
    const dx = e.clientX - panRef.current.x;
    const dy = e.clientY - panRef.current.y;
    if (Math.abs(dx) + Math.abs(dy) > 2) panMovedRef.current = true;
    canvasRef.current.scrollLeft = panRef.current.sl - dx;
    canvasRef.current.scrollTop = panRef.current.st - dy;
  }, []);

  const endPan = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!panRef.current) return;
    panRef.current = null;
    setIsPanning(false);
    try { canvasRef.current?.releasePointerCapture(e.pointerId); } catch { /* noop */ }
    if (panMovedRef.current) {
      // suppress the synthetic click that follows the middle-button drag
      pointerDownTargetRef.current = null;
    }
  }, []);

  const addNode = useCallback((type: NodeType) => {
    if (!menu) return;
    const id = `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setNodes((prev) => [...prev, { id, type, x: menu.x, y: menu.y }]);
    setMenu(null);
  }, [menu]);

  const removeNode = useCallback((id: string) => {
    setNodes((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const zoomIn = useCallback(() => setZoom((z) => clampZoom(z + ZOOM_STEP)), []);
  const zoomOut = useCallback(() => setZoom((z) => clampZoom(z - ZOOM_STEP)), []);
  const resetZoom = useCallback(() => setZoom(1), []);

  // Keyboard shortcuts: Ctrl/Cmd + +, -, 0
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        zoomIn();
      } else if (e.key === "-" || e.key === "_") {
        e.preventDefault();
        zoomOut();
      } else if (e.key === "0") {
        e.preventDefault();
        resetZoom();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoomIn, zoomOut, resetZoom]);

  // Ctrl + wheel to zoom on canvas
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      setZoom((z) => clampZoom(z + (e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP)));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // Global pointer handlers while a wire is being dragged
  useEffect(() => {
    if (!connecting) return;
    const onMove = (e: PointerEvent) => {
      updateConnectingMouse({ x: e.clientX, y: e.clientY });
    };
    const onUp = (e: PointerEvent) => {
      const target = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
      const portEl = target?.closest('[data-port-side="in"]') as HTMLElement | null;
      const targetNodeId = portEl?.getAttribute("data-port-node");
      if (targetNodeId) {
        completeConnect(targetNodeId);
      } else {
        cancelConnect();
      }
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [connecting, updateConnectingMouse, completeConnect, cancelConnect]);

  return (
    <div
      ref={canvasRef}
      onClick={handleCanvasClick}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endPan}
      onPointerCancel={endPan}
      onAuxClick={(e) => { if (e.button === 1) e.preventDefault(); }}
      className="absolute inset-0 overflow-auto"
      style={{
        backgroundImage:
          "radial-gradient(circle, hsl(var(--primary) / 0.15) 1px, transparent 1px)",
        backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
        backgroundColor: "hsl(var(--background))",
        cursor: isPanning ? "grabbing" : connecting ? "crosshair" : "default",
      }}
    >
      <div
        ref={innerRef}
        className="absolute top-0 left-0 origin-top-left"
        style={{
          transform: `scale(${zoom})`,
          width: `${100 / zoom}%`,
          height: `${100 / zoom}%`,
        }}
      >
        <ConnectionsLayer canvasRef={canvasRef} zoom={zoom} />
        {nodes.map((node) => {
          const common = { key: node.id, id: node.id, x: node.x, y: node.y, onRemove: () => removeNode(node.id) };
          switch (node.type) {
            case "text-to-image":
              return <TextToImageNode {...common} />;
            case "text-to-video":
              return <TextToVideoNode {...common} />;
            case "image-to-video":
              return <ImageToVideoNode {...common} />;
            case "avatar":
              return <AvatarNode {...common} />;
            default:
              return null;
          }
        })}

        {menu && (
          <NodeMenu
            x={menu.x}
            y={menu.y}
            onSelect={addNode}
            onClose={() => setMenu(null)}
          />
        )}
      </div>

        <ZoomControls
          zoom={zoom}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onReset={resetZoom}
        />
    </div>
  );
}

export function WorkflowCanvas() {
  return (
    <WorkflowProvider>
      <CanvasInner />
    </WorkflowProvider>
  );
}
