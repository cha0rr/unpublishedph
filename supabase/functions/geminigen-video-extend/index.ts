import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const MAX_PROMPT_LENGTH = 4000;


async function authenticateUser(authHeader: string) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error } = await userClient.auth.getUser();
  if (error || !user) return null;
  return user;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ success: false, error: 'Não autorizado.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const user = await authenticateUser(authHeader);
    if (!user) {
      return new Response(JSON.stringify({ success: false, error: 'Token inválido.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = user.id;
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
      return new Response(JSON.stringify({ success: false, error: 'Acesso restrito. Conta não aprovada.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // --- Daily limit check (30 video generations/day for non-admins) ---
    if (!isAdmin) {
      const today = new Date(); today.setUTCHours(0, 0, 0, 0);
      const { count } = await adminClient
        .from('image_generations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', today.toISOString())
        .in('model', ['veo-3-fast', 'veo-3.1-fast', 'grok-3', 'grok-3-extend', 'veo-extend']);
      if ((count ?? 0) >= 30) {
        return new Response(JSON.stringify({ success: false, error: 'Limite diário de 30 gerações de vídeo atingido.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const { prompt, ref_history, model } = await req.json();

    if (!prompt || !ref_history) {
      return new Response(JSON.stringify({ success: false, error: 'prompt e ref_history são obrigatórios.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const sanitizedPrompt = prompt.substring(0, MAX_PROMPT_LENGTH).trim();
    const isGrok = model === 'grok-3';

    const apiKey = Deno.env.get('GEMINIGEN_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ success: false, error: 'GEMINIGEN_API_KEY não configurada.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const outForm = new FormData();
    outForm.append('prompt', sanitizedPrompt);
    outForm.append('ref_history', ref_history);

    const endpoint = isGrok
      ? 'https://api.geminigen.ai/uapi/v1/video-extend/grok'
      : 'https://api.geminigen.ai/uapi/v1/video-extend/veo';

    console.log('GeminiGen video-extend request:', {
      prompt: sanitizedPrompt.substring(0, 50),
      ref_history,
      model: model || 'veo',
      endpoint,
    });

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'x-api-key': apiKey },
      body: outForm,
    });

    const rawText = await response.text();
    console.log('GeminiGen video-extend raw response:', rawText.substring(0, 2000));
    let data: any;
    try { data = JSON.parse(rawText); } catch { data = { raw: rawText.substring(0, 500) }; }

    const generationUuid = data.uuid;
    const userEmail = user.email as string;
    const userRole = isAdmin ? 'admin' : 'user';

    await adminClient.from('image_generations').insert({
      user_id: userId,
      email: userEmail,
      role: userRole,
      plan: profile?.plan || null,
      model: data.model_name || (isGrok ? 'grok-3-extend' : 'veo-extend'),
      prompt: `[EXTEND] ${sanitizedPrompt}`,
      uuid: generationUuid || null,
      status: response.ok ? 'pending' : 'failed',
      request_payload: {
        prompt: sanitizedPrompt,
        ref_history,
        endpoint: isGrok ? 'video-extend/grok' : 'video-extend/veo',
      },
      response_payload: data,
      error_message: response.ok ? null : (data.error || data.message || data?.detail?.error_message || null),
    });

    return new Response(JSON.stringify({ success: response.ok, uuid: generationUuid || null, status: response.status }), {
      status: response.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('geminigen-video-extend internal error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Erro interno ao estender vídeo.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
