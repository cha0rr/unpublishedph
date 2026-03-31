import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const RATE_LIMIT_PER_HOUR = 10;
const MAX_PROMPT_LENGTH = 2000;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Não autorizado.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const geminigenKey = Deno.env.get('GEMINIGEN_API_KEY');

    if (!geminigenKey) {
      return new Response(JSON.stringify({ error: 'GEMINIGEN_API_KEY não configurada.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Token inválido.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = user.id;
    const userEmail = user.email as string;

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: profile } = await adminClient
      .from('profiles')
      .select('plan, status')
      .eq('user_id', userId)
      .single();

    const { data: roles } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    const isAdmin = roles?.some((r: any) => r.role === 'admin') ?? false;
    const isApproved = profile?.status === 'approved';

    if (!isAdmin && !isApproved) {
      return new Response(JSON.stringify({ error: 'Acesso restrito. Conta não aprovada.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!isAdmin && profile?.plan !== 'pro') {
      return new Response(JSON.stringify({ error: 'Recurso exclusivo do Plano Pro. Faça upgrade para acessar a geração de imagens.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // --- Rate Limiting (admins exempt) ---
    if (!isAdmin) {
      const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
      const { count } = await adminClient
        .from('image_generations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', oneHourAgo);

      if ((count ?? 0) >= RATE_LIMIT_PER_HOUR) {
        return new Response(JSON.stringify({ error: `Limite de ${RATE_LIMIT_PER_HOUR} gerações por hora atingido. Aguarde alguns minutos.` }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const body = await req.json();
    const { prompt, model, aspect_ratio, resolution, output_format, style, ref_history, file_urls } = body;

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt é obrigatório.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // --- Prompt sanitization ---
    const sanitizedPrompt = String(prompt).substring(0, MAX_PROMPT_LENGTH).trim();

    const allowedModels = ['nano-banana-2', 'nano-banana-pro'];
    if (!model || !allowedModels.includes(model)) {
      return new Response(JSON.stringify({ error: 'Modelo inválido. Use nano-banana-2 ou nano-banana-pro.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userRole = isAdmin ? 'admin' : 'user';

    const formData = new FormData();

    let finalPrompt = sanitizedPrompt;
    if (style && style !== 'auto') {
      finalPrompt = `[Style: ${style}] ${sanitizedPrompt}`;
    }

    formData.append('prompt', finalPrompt);
    formData.append('model', model);
    if (aspect_ratio) formData.append('aspect_ratio', aspect_ratio);
    if (resolution && resolution.trim() && resolution !== 'auto') formData.append('resolution', resolution);
    if (output_format) formData.append('output_format', output_format);
    if (style && style !== 'auto') formData.append('style', style);
    if (ref_history) formData.append('ref_history', ref_history);
    // Download file_urls and attach as multipart 'files' per API docs
    if (file_urls && Array.isArray(file_urls)) {
      for (const url of file_urls) {
        if (url && typeof url === 'string' && url.trim()) {
          try {
            const fileRes = await fetch(url.trim());
            if (fileRes.ok) {
              const blob = await fileRes.blob();
              const fileName = url.trim().split('/').pop() || 'reference.png';
              formData.append('files', blob, fileName);
            } else {
              // Fallback: send as file_urls if download fails
              formData.append('file_urls', url.trim());
            }
          } catch {
            formData.append('file_urls', url.trim());
          }
        }
      }
    }

    const apiUrl = 'https://api.geminigen.ai/uapi/v1/generate_image';

    const apiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'x-api-key': geminigenKey,
      },
      body: formData,
    });

    const responseData = await apiResponse.json();

    if (!apiResponse.ok) {
      return new Response(JSON.stringify({ error: 'Erro na API GeminiGen.', details: responseData }), {
        status: apiResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const generationUuid = responseData.uuid;

    await adminClient.from('image_generations').insert({
      user_id: userId,
      email: userEmail,
      role: userRole,
      plan: profile?.plan || null,
      model,
      prompt: sanitizedPrompt,
      uuid: generationUuid,
      status: 'pending',
      request_payload: body,
      response_payload: responseData,
    });

    return new Response(JSON.stringify({ uuid: generationUuid, ...responseData }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message || 'Erro interno.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
