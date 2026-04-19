import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const VIDEO_MODELS = ["veo-3-fast", "veo-3.1-fast", "grok-3", "grok-3-extend", "veo-extend"];
const IMAGE_MODELS = ["nano-banana-2", "nano-banana-pro"];

export function useDailyGenerationCount(type: "video" | "image") {
  const [count, setCount] = useState<number>(0);
  const [limit, setLimit] = useState<number>(30);
  const [enabled, setEnabled] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);
  const { user, isAdmin } = useAuth();

  const models = type === "video" ? VIDEO_MODELS : IMAGE_MODELS;

  useEffect(() => {
    if (!user || isAdmin) {
      setCount(0);
      setLoading(false);
      return;
    }

    const fetchAll = async () => {
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      // Get user plan
      const { data: profile } = await supabase
        .from("profiles")
        .select("plan")
        .eq("user_id", user.id)
        .maybeSingle();

      const plan = profile?.plan === "pro" ? "pro" : "basico";
      const key = `${type}_${plan}`;

      const [{ count: total }, { data: limitRow }] = await Promise.all([
        supabase
          .from("image_generations")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .gte("created_at", today.toISOString())
          .in("model", models),
        supabase
          .from("daily_limits")
          .select("limit_value, enabled")
          .eq("key", key)
          .maybeSingle(),
      ]);

      setCount(total ?? 0);
      if (limitRow) {
        setLimit(limitRow.limit_value);
        setEnabled(limitRow.enabled);
      } else {
        setLimit(30);
        setEnabled(true);
      }
      setLoading(false);
    };

    fetchAll();
  }, [user, isAdmin, type]);

  return {
    count,
    limit,
    isLimitReached: !isAdmin && enabled && count >= limit,
    loading,
    isAdmin,
  };
}
