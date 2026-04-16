import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const VIDEO_MODELS = ["veo-3-fast", "veo-3.1-fast", "grok-3", "grok-3-extend", "veo-extend"];
const IMAGE_MODELS = ["nano-banana-2", "nano-banana-pro"];

export function useDailyGenerationCount(type: "video" | "image") {
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const { user, isAdmin } = useAuth();

  const models = type === "video" ? VIDEO_MODELS : IMAGE_MODELS;
  const DAILY_LIMIT = 30;

  useEffect(() => {
    if (!user || isAdmin) {
      setCount(0);
      setLoading(false);
      return;
    }

    const fetchCount = async () => {
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      const { count: total } = await supabase
        .from("image_generations")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", today.toISOString())
        .in("model", models);

      setCount(total ?? 0);
      setLoading(false);
    };

    fetchCount();
  }, [user, isAdmin]);

  return {
    count,
    limit: DAILY_LIMIT,
    isLimitReached: !isAdmin && count >= DAILY_LIMIT,
    loading,
    isAdmin,
  };
}
