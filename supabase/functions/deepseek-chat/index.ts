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
      // Apenas Pro tem acesso. O flag allow_basic foi removido por ser
      // controlado pelo cliente (bypass de plano). Para liberar usos
      // específicos a usuários Basic, crie um endpoint dedicado server-side.
      if (!isPro) {
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

    // Regra obrigatória anti-fallback: se o assistente precisar de mais
    // informações do usuário, deve APENAS fazer as perguntas e parar.
    // Nunca gerar roteiro/prompt genérico, exemplo, template ou modelo
    // "enquanto aguarda" as respostas.
    const guardrail = [
      "",
      "REGRAS OBRIGATÓRIAS (não podem ser quebradas em nenhuma hipótese):",
      "1. Se você precisar de qualquer informação do usuário para produzir o roteiro ou prompt, faça SOMENTE as perguntas necessárias (numeradas) e ENCERRE a resposta logo após as perguntas.",
      "2. NÃO gere roteiro, prompt, exemplo, modelo, template, versão preliminar, versão genérica, placeholder ou \"enquanto isso aqui vai um modelo\" antes de receber as respostas do usuário.",
      "3. NÃO use frases como \"enquanto não recebo as informações\", \"segue um modelo genérico\", \"prompt padrão\" antes das respostas.",
      "4. Só produza o roteiro/prompt final DEPOIS que o usuário tiver respondido às perguntas necessárias na conversa.",
      "5. Se o usuário já tiver fornecido informação suficiente, vá direto ao roteiro/prompt final sem perguntas desnecessárias.",
      "6. Quando fizer perguntas: o ÚLTIMO caractere útil da sua resposta deve ser o final da última pergunta. NÃO escreva separadores (---), seções de \"Ideia Geral\", \"Pré-planejamento\", \"Formato\", \"Plataforma\", \"Duração\", \"Estrutura criativa\", \"Ganchos\", \"CTA\", nem qualquer conteúdo de roteiro/prompt após as perguntas.",
      "7. Proibido escrever frases como \"Enquanto isso\", \"já vou estruturando\", \"assim que você responder\", \"segue uma base\" antes de receber as respostas.",
    ].join("\n");
    const effectiveSystemPrompt = `${systemPrompt}\n${guardrail}`;

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
            { role: "system", content: effectiveSystemPrompt },
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

      return new Response(wrapWithGuardStream(response.body!), {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache, no-transform",
          "Connection": "keep-alive",
          "X-Accel-Buffering": "no",
        },
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

    let response: Response;
    try {
      response = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            { role: "system", content: effectiveSystemPrompt },
            ...sanitizedMessages,
          ],
          stream: true,
        }),
      });
    } catch (e: any) {
      console.error("DeepSeek fetch error:", e?.name, e?.message);
      return new Response(JSON.stringify({ error: "Falha ao conectar com a API DeepSeek. Tente novamente." }), {
        status: 504,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      console.error("DeepSeek API error:", response.status, errText);
      if (response.status === 401) {
        return new Response(JSON.stringify({ error: "Chave DeepSeek inválida. Contate o suporte." }), {
          status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições do DeepSeek excedido. Tente novamente em instantes." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos do DeepSeek esgotados. Contate o suporte." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Erro na API DeepSeek. Tente novamente." }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(wrapWithGuardStream(response.body!), {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (e) {
    console.error("deepseek-chat internal error:", e);
    return new Response(
      JSON.stringify({ error: "Erro interno ao processar requisição." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

/**
 * Envolve o stream SSE da OpenAI/DeepSeek/Gemini para cortar a resposta
 * assim que detectarmos que o assistente fez perguntas e está prestes a
 * gerar conteúdo extra (roteiro/prompt/modelo) antes do usuário responder.
 */
function wrapWithGuardStream(upstream: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  // Marcadores que indicam que o modelo começou a produzir conteúdo após
  // as perguntas (separadores, seções de roteiro, "enquanto isso", etc.).
  const stopPatterns: RegExp[] = [
    /\n\s*---\s*\n/i,
    /\*\*\s*Enquanto/i,
    /Enquanto isso/i,
    /já vou estruturando/i,
    /assim que voc[êe] responder/i,
    /\*\*\s*Ideia Geral/i,
    /Pré[- ]planejamento/i,
    /\*\*\s*Formato\s*:/i,
    /\*\*\s*Plataforma\s*:/i,
    /\*\*\s*Duração\s*:/i,
    /\*\*\s*Estrutura\b/i,
    /\*\*\s*Roteiro\b/i,
    /\*\*\s*Prompt( final)?\s*:/i,
    /segue (uma|um) (base|modelo|exemplo|template)/i,
    /modelo gen[ée]rico/i,
  ];
  // Precisamos ter visto ao menos uma pergunta numerada terminando com "?"
  const questionPattern = /^\s*\d+\.\s.*\?/m;

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = upstream.getReader();
      let buffer = "";
      let assistantText = "";
      let forwardedLen = 0; // quanto do assistantText já enviamos
      let stopped = false;

      const flushUpTo = (cutIdx: number) => {
        // Envia delta com o texto pendente até cutIdx (não inclusive)
        if (cutIdx > forwardedLen) {
          const pending = assistantText.slice(forwardedLen, cutIdx);
          if (pending) {
            const payload = {
              choices: [{ delta: { content: pending }, index: 0 }],
            };
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
          }
          forwardedLen = cutIdx;
        }
      };

      const closeStream = () => {
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
        stopped = true;
        try { reader.cancel(); } catch { /* ignore */ }
      };

      try {
        while (!stopped) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let nlIdx: number;
          while (!stopped && (nlIdx = buffer.indexOf("\n")) !== -1) {
            let line = buffer.slice(0, nlIdx);
            buffer = buffer.slice(nlIdx + 1);
            if (line.endsWith("\r")) line = line.slice(0, -1);

            if (!line.startsWith("data: ")) {
              // Repassa linhas vazias/comentários
              controller.enqueue(encoder.encode(line + "\n"));
              continue;
            }

            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") {
              // Envia o restante (caso não tenha sido cortado)
              flushUpTo(assistantText.length);
              closeStream();
              break;
            }

            let parsed: any;
            try { parsed = JSON.parse(jsonStr); }
            catch { controller.enqueue(encoder.encode(line + "\n")); continue; }

            const delta: string | undefined = parsed?.choices?.[0]?.delta?.content;
            if (typeof delta !== "string" || delta.length === 0) {
              // Repassa eventos sem conteúdo (ex.: finish_reason)
              controller.enqueue(encoder.encode(line + "\n"));
              continue;
            }

            assistantText += delta;

            // Verifica se já temos pergunta + marcador de parada
            const hasQuestion = questionPattern.test(assistantText);
            if (hasQuestion) {
              let earliest = -1;
              for (const re of stopPatterns) {
                const m = re.exec(assistantText);
                if (m && m.index >= 0) {
                  if (earliest === -1 || m.index < earliest) earliest = m.index;
                }
              }
              if (earliest !== -1) {
                // Encontra fim da última pergunta antes do marcador
                const before = assistantText.slice(0, earliest);
                const lastQ = before.lastIndexOf("?");
                const cutIdx = lastQ !== -1 ? lastQ + 1 : earliest;
                flushUpTo(cutIdx);
                closeStream();
                break;
              }
            }

            // Caso comum: encaminha o delta acumulado pendente
            flushUpTo(assistantText.length);
          }
        }
        if (!stopped) {
          flushUpTo(assistantText.length);
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        }
      } catch (err) {
        console.error("guard stream error:", err);
        try { controller.error(err); } catch { /* ignore */ }
      }
    },
  });
}
