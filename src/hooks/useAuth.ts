import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  whatsapp: string;
  usage_type: string | null;
  payment_method: string | null;
  plan: string | null;
  status: string;
  created_at: string;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isAdmin: boolean;
  isApproved: boolean;
  loading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    isAdmin: false,
    isApproved: false,
    loading: true,
  });

  const fetchProfile = useCallback(async (userId: string) => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    const isAdmin = roles?.some((r: any) => r.role === "admin") ?? false;
    const isApproved = profile?.status === "approved";

    return { profile: profile as Profile | null, isAdmin, isApproved };
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          const { profile, isAdmin, isApproved } = await fetchProfile(session.user.id);
          setState({
            user: session.user,
            session,
            profile,
            isAdmin,
            isApproved,
            loading: false,
          });
        } else {
          setState({
            user: null,
            session: null,
            profile: null,
            isAdmin: false,
            isApproved: false,
            loading: false,
          });
        }
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const { profile, isAdmin, isApproved } = await fetchProfile(session.user.id);
        setState({
          user: session.user,
          session,
          profile,
          isAdmin,
          isApproved,
          loading: false,
        });
      } else {
        setState(prev => ({ ...prev, loading: false }));
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { ...state, signIn, signOut };
}
