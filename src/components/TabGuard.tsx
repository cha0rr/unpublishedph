import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Shield } from "lucide-react";

const CHANNEL_NAME = "ph_studio_tab_guard";
const TAB_ID = `${Date.now()}_${Math.random().toString(36).slice(2)}`;

interface TabGuardProps {
  children: React.ReactNode;
}

export function TabGuard({ children }: TabGuardProps) {
  const [blocked, setBlocked] = useState(false);
  const reportedRef = useRef(false);

  useEffect(() => {
    const channel = new BroadcastChannel(CHANNEL_NAME);

    // Announce this tab
    channel.postMessage({ type: "ping", tabId: TAB_ID });

    channel.onmessage = async (event) => {
      const { type, tabId } = event.data;

      if (type === "ping" && tabId !== TAB_ID) {
        // Another tab opened — respond so it knows we exist
        channel.postMessage({ type: "pong", tabId: TAB_ID });
      }

      if (type === "pong" && tabId !== TAB_ID) {
        // We are the new tab and another tab already exists — block ourselves
        setBlocked(true);

        if (!reportedRef.current) {
          reportedRef.current = true;
          // Report violation
          try {
            const { data: sessionData } = await supabase.auth.getSession();
            const session = sessionData?.session;
            if (session) {
              await supabase.from("tab_violations" as any).insert({
                user_id: session.user.id,
                email: session.user.email || "unknown",
              });
            }
          } catch {
            // silent
          }
        }
      }
    };

    // Also use localStorage fallback for edge cases
    const handleStorage = (e: StorageEvent) => {
      if (e.key === CHANNEL_NAME && e.newValue && e.newValue !== TAB_ID) {
        setBlocked(true);
      }
    };
    window.addEventListener("storage", handleStorage);

    // Set active tab
    localStorage.setItem(CHANNEL_NAME, TAB_ID);

    return () => {
      channel.close();
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  if (blocked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center">
            <Shield className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-xl font-bold text-foreground">
            Aba duplicada detectada
          </h1>
          <p className="text-sm text-muted-foreground">
            O PH Studio só pode ser utilizado em uma aba por vez. Feche esta aba e continue na aba original.
          </p>
          <p className="text-xs text-muted-foreground/60">
            Esta tentativa foi registrada pelo sistema.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
