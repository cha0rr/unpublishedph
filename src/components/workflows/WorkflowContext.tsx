import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface ImageOutput {
  nodeId: string;
  nodeLabel: string;
  url: string;
}

interface WorkflowContextValue {
  imageOutputs: ImageOutput[];
  registerImage: (output: ImageOutput) => void;
  unregisterImage: (nodeId: string) => void;
}

const WorkflowContext = createContext<WorkflowContextValue | null>(null);

export function WorkflowProvider({ children }: { children: ReactNode }) {
  const [imageOutputs, setImageOutputs] = useState<ImageOutput[]>([]);

  const registerImage = useCallback((output: ImageOutput) => {
    setImageOutputs((prev) => {
      const without = prev.filter((o) => o.nodeId !== output.nodeId);
      return [...without, output];
    });
  }, []);

  const unregisterImage = useCallback((nodeId: string) => {
    setImageOutputs((prev) => prev.filter((o) => o.nodeId !== nodeId));
  }, []);

  const value = useMemo(
    () => ({ imageOutputs, registerImage, unregisterImage }),
    [imageOutputs, registerImage, unregisterImage]
  );

  return <WorkflowContext.Provider value={value}>{children}</WorkflowContext.Provider>;
}

export function useWorkflow() {
  const ctx = useContext(WorkflowContext);
  if (!ctx) throw new Error("useWorkflow must be used inside WorkflowProvider");
  return ctx;
}

export async function urlToFile(url: string, filename = "ref"): Promise<File> {
  const res = await fetch(url);
  const blob = await res.blob();
  const ext = (blob.type.split("/")[1] || "png").split(";")[0];
  const name = filename.includes(".") ? filename : `${filename}.${ext}`;
  return new File([blob], name, { type: blob.type || "image/png" });
}
