import { useCallback, useRef, useState } from "react";
import { NodeMenu, type NodeType } from "./NodeMenu";
import { TextToImageNode } from "./nodes/TextToImageNode";
import { TextToVideoNode } from "./nodes/TextToVideoNode";
import { ImageToVideoNode } from "./nodes/ImageToVideoNode";
import { AvatarNode } from "./nodes/AvatarNode";

export interface WorkflowNode {
  id: string;
  type: NodeType;
  x: number;
  y: number;
}

export function WorkflowCanvas() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    setMenu({ x: e.clientX - rect.left, y: e.clientY - rect.top });
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

  return (
    <div
      ref={canvasRef}
      onClick={handleCanvasClick}
      className="absolute inset-0 cursor-crosshair overflow-auto"
      style={{
        backgroundImage:
          "radial-gradient(circle, hsl(var(--primary) / 0.15) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
        backgroundColor: "hsl(var(--background))",
      }}
    >
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