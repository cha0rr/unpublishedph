import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ImageOutput {
  nodeId: string;
  nodeLabel: string;
  url: string;
}

export type PortSide = "in" | "out";

export interface PortRegistration {
  nodeId: string;
  side: PortSide;
  el: HTMLElement;
}

export interface WorkflowConnection {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
}

export interface ConnectingState {
  sourceNodeId: string;
  mouse: { x: number; y: number };
}

interface WorkflowContextValue {
  imageOutputs: ImageOutput[];
  registerImage: (output: ImageOutput) => void;
  unregisterImage: (nodeId: string) => void;
  // Ports
  registerPort: (reg: PortRegistration) => void;
  unregisterPort: (nodeId: string, side: PortSide) => void;
  getPortEl: (nodeId: string, side: PortSide) => HTMLElement | null;
  // Connections
  connections: WorkflowConnection[];
  removeConnection: (id: string) => void;
  getConnectedSource: (targetNodeId: string) => string | null;
  // Drag-to-connect
  connecting: ConnectingState | null;
  startConnect: (sourceNodeId: string, mouse: { x: number; y: number }) => void;
  updateConnectingMouse: (mouse: { x: number; y: number }) => void;
  completeConnect: (targetNodeId: string) => void;
  cancelConnect: () => void;
}

const WorkflowContext = createContext<WorkflowContextValue | null>(null);

export function WorkflowProvider({ children }: { children: ReactNode }) {
  const [imageOutputs, setImageOutputs] = useState<ImageOutput[]>([]);
  const [connections, setConnections] = useState<WorkflowConnection[]>([]);
  const [connecting, setConnecting] = useState<ConnectingState | null>(null);
  // Ports stored in a ref-like state via Map; we keep a plain object to avoid re-renders on register
  const [portsVersion, setPortsVersion] = useState(0);
  const portsRef = useMemo(() => new Map<string, HTMLElement>(), []);

  const registerImage = useCallback((output: ImageOutput) => {
    setImageOutputs((prev) => {
      const without = prev.filter((o) => o.nodeId !== output.nodeId);
      return [...without, output];
    });
  }, []);

  const unregisterImage = useCallback((nodeId: string) => {
    setImageOutputs((prev) => prev.filter((o) => o.nodeId !== nodeId));
    // Drop any connection whose source disappeared
    setConnections((prev) => prev.filter((c) => c.sourceNodeId !== nodeId && c.targetNodeId !== nodeId));
  }, []);

  const portKey = (nodeId: string, side: PortSide) => `${nodeId}:${side}`;

  const registerPort = useCallback(({ nodeId, side, el }: PortRegistration) => {
    portsRef.set(portKey(nodeId, side), el);
    setPortsVersion((v) => v + 1);
  }, [portsRef]);

  const unregisterPort = useCallback((nodeId: string, side: PortSide) => {
    portsRef.delete(portKey(nodeId, side));
    setPortsVersion((v) => v + 1);
  }, [portsRef]);

  const getPortEl = useCallback((nodeId: string, side: PortSide) => {
    return portsRef.get(portKey(nodeId, side)) ?? null;
  }, [portsRef]);

  const removeConnection = useCallback((id: string) => {
    setConnections((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const getConnectedSource = useCallback((targetNodeId: string) => {
    return connections.find((c) => c.targetNodeId === targetNodeId)?.sourceNodeId ?? null;
  }, [connections]);

  const startConnect = useCallback((sourceNodeId: string, mouse: { x: number; y: number }) => {
    setConnecting({ sourceNodeId, mouse });
  }, []);

  const updateConnectingMouse = useCallback((mouse: { x: number; y: number }) => {
    setConnecting((prev) => (prev ? { ...prev, mouse } : prev));
  }, []);

  const completeConnect = useCallback((targetNodeId: string) => {
    setConnecting((prev) => {
      if (!prev) return null;
      if (prev.sourceNodeId === targetNodeId) return null;
      setConnections((cs) => {
        // Only one input per target → replace
        const without = cs.filter((c) => c.targetNodeId !== targetNodeId);
        return [
          ...without,
          {
            id: `${prev.sourceNodeId}->${targetNodeId}-${Date.now()}`,
            sourceNodeId: prev.sourceNodeId,
            targetNodeId,
          },
        ];
      });
      return null;
    });
  }, []);

  const cancelConnect = useCallback(() => setConnecting(null), []);

  const value = useMemo(
    () => ({
      imageOutputs,
      registerImage,
      unregisterImage,
      registerPort,
      unregisterPort,
      getPortEl,
      connections,
      removeConnection,
      getConnectedSource,
      connecting,
      startConnect,
      updateConnectingMouse,
      completeConnect,
      cancelConnect,
    }),
    [
      imageOutputs,
      registerImage,
      unregisterImage,
      registerPort,
      unregisterPort,
      getPortEl,
      connections,
      removeConnection,
      getConnectedSource,
      connecting,
      startConnect,
      updateConnectingMouse,
      completeConnect,
      cancelConnect,
      portsVersion,
    ]
  );

  return <WorkflowContext.Provider value={value}>{children}</WorkflowContext.Provider>;
}

export function useWorkflow() {
  const ctx = useContext(WorkflowContext);
  if (!ctx) throw new Error("useWorkflow must be used inside WorkflowProvider");
  return ctx;
}

export async function urlToFile(url: string, filename = "ref"): Promise<File> {
  // Use the image proxy edge function to bypass CORS on geminigen.ai / R2 hosts.
  // We must call fetch directly (not supabase.functions.invoke) because invoke
  // tries to parse the response as JSON, which corrupts binary image data.
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error("Sessão expirada. Faça login novamente.");

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const proxyUrl = `https://${projectId}.supabase.co/functions/v1/image-reference-proxy`;

  const response = await fetch(proxyUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    let detail = `HTTP ${response.status}`;
    try {
      const err = await response.json();
      detail = err?.error || detail;
    } catch { /* ignore */ }
    throw new Error(`Falha ao baixar imagem: ${detail}`);
  }

  const blob = await response.blob();
  const type = blob.type && blob.type.startsWith("image/") ? blob.type : "image/png";
  const ext = (type.split("/")[1] || "png").split(";")[0];
  const name = filename.includes(".") ? filename : `${filename}.${ext}`;
  return new File([blob], name, { type });
}
