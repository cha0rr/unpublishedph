import { useCallback, useEffect, useRef, useState } from "react";
import { NodeMenu, type NodeType } from "./NodeMenu";
import { TextToImageNode } from "./nodes/TextToImageNode";
import { TextToVideoNode } from "./nodes/TextToVideoNode";
import { ImageToVideoNode } from "./nodes/ImageToVideoNode";
import { AvatarNode } from "./nodes/AvatarNode";
import { WorkflowProvider, useWorkflow } from "./WorkflowContext";
import { ConnectionsLayer } from "./ConnectionsLayer";

export interface WorkflowNode {
  id: string;
  type: NodeType;
  x: number;
  y: number;
}

function CanvasInner() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const { connecting, updateConnectingMouse, completeConnect, cancelConnect } = useWorkflow();

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    if (connecting) return; // ignore clicks while wiring
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    setMenu({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, [connecting]);

  const addNode = useCallback((type: NodeType) => {
    if (!menu) return;
    const id = `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setNodes((prev) => [...prev, { id, type, x: menu.x, y: menu.y }]);
    setMenu(null);
  }, [menu]);

  const removeNode = useCallback((id: string) => {
    setNodes((prev) => prev.filter((n) => n.id !== id));
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
      className="absolute inset-0 overflow-auto"
      style={{
        backgroundImage:
          "radial-gradient(circle, hsl(var(--primary) / 0.15) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
        backgroundColor: "hsl(var(--background))",
        cursor: connecting ? "crosshair" : "default",
      }}
    >
        <ConnectionsLayer canvasRef={canvasRef} />
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

        {nodes.length === 0 && !menu && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-2xl font-semibold text-foreground">Canvas vazio</p>
              <p className="text-sm text-muted-foreground mt-2">
                Clique em qualquer lugar para começar
              </p>
            </div>
          </div>
        )}
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
