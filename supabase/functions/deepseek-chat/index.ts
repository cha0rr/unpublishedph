import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: profile } = await adminClient
      .from("profiles")
      .select("status, plan")
      .eq("user_id", user.id)
      .single();

    const { data: roles } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    const isAdmin = roles?.some((r: any) => r.role === "admin") ?? false;

    const body = await req.json();
    const { messages } = body;

    if (!isAdmin) {
      const approved = profile?.status === "approved";
      const isPro = approved && profile?.plan === "pro";
      const isBasic = approved && profile?.plan === "basic";
      // Pro tem acesso total. Basic também pode usar a função (acesso server-side
      // verificado pelo plano). Removido o flag allow_basic controlado pelo cliente.
      const ok = isPro || isBasic;
      if (!ok) {
        return new Response(
          JSON.stringify({ error: "Acesso restrito ao plano Pro." }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Mensagens inválidas" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch system prompt
    const { data: promptData } = await adminClient
      .from("system_prompts")
      .select("content")
      .eq("key", "script_generator")
      .single();

    const systemPrompt = promptData?.content || "Você é um assistente especializado em criar roteiros e prompts criativos para geração de vídeos e imagens com IA.";

    // Check if any message has an image attached
    const hasImage = messages.some((m: any) => m.image);

    if (hasImage) {
      // Use Lovable AI Gateway (Gemini) for vision
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) {
        return new Response(JSON.stringify({ error: "LOVABLE_API_KEY não configurada" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Build messages with vision content parts
      const formattedMessages = messages.slice(-20).map((m: any) => {
        const role = m.role === "assistant" ? "assistant" : "user";
        const text = typeof m.content === "string" ? m.content.slice(0, 4000) : "";

        if (m.image && role === "user") {
          return {
            role,
            content: [
              { type: "image_url", image_url: { url: m.image } },
              { type: "text", text },
            ],
          };
        }
        return { role, content: text };
      });

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            ...formattedMessages,
          ],
          stream: true,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("Lovable AI Gateway error:", response.status, errText);
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em instantes." }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        return new Response(JSON.stringify({ error: "Erro na API de visão" }), {
          status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(response.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    // No image — use DeepSeek as before
    const DEEPSEEK_API_KEY = Deno.env.get("DEEPSEEK_API_KEY");
    if (!DEEPSEEK_API_KEY) {
      return new Response(JSON.stringify({ error: "DEEPSEEK_API_KEY não configurada" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sanitizedMessages = messages.slice(-20).map((m: any) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: typeof m.content === "string" ? m.content.slice(0, 4000) : "",
    }));

    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          ...sanitizedMessages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("DeepSeek API error:", response.status, errText);
      return new Response(JSON.stringify({ error: "Erro na API DeepSeek" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("deepseek-chat internal error:", e);
    return new Response(
      JSON.stringify({ error: "Erro interno ao processar requisição." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
