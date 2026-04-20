import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const MAX_PROMPT_LENGTH = 4000;
const MAX_TOTAL_DURATION = 30;
const ALLOWED_DURATIONS = [6, 10];
const ALLOWED_ASPECTS = ['landscape', 'portrait', 'square'];
const ALLOWED_RESOLUTIONS = ['480p', '720p'];

function extractErrorMessage(data: any, statusCode: number): string {
  if (typeof data?.error === 'string' && data.error) return data.error;
  if (typeof data?.message === 'string' && data.message) return data.message;
  if (typeof data?.detail === 'object' && data.detail !== null) {
    if (typeof data.detail.error_message === 'string') return data.detail.error_message;
    if (typeof data.detail.message === 'string') return data.detail.message;
    return JSON.stringify(data.detail);
  }
  if (typeof data?.detail === 'string' && data.detail) return data.detail;
  if (Array.isArray(data?.errors)) {
    return data.errors.map((e: any) => e.msg || e.message || String(e)).join('; ');
  }
  return `Erro HTTP ${statusCode} da API de storyboard.`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
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
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
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

    if (!isAdmin && profile?.plan !== 'pro') {
      return new Response(JSON.stringify({ success: false, error: 'Storyboard está disponível apenas no plano Pro.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // --- Daily limit (counts as video generation) ---
    if (!isAdmin) {
      const today = new Date(); today.setUTCHours(0, 0, 0, 0);
      const { count } = await adminClient
        .from('image_generations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', today.toISOString())
        .in('model', ['veo-3-fast', 'veo-3.1-fast', 'grok-3', 'grok-3-extend', 'veo-extend', 'grok-storyboard']);
      if ((count ?? 0) >= 30) {
        return new Response(JSON.stringify({ success: false, error: 'Limite diário de 30 gerações de vídeo atingido.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const body = await req.json();
    const { scenes, aspect_ratio = 'landscape', resolution = '720p' } = body || {};

    if (!Array.isArray(scenes)) {
      return new Response(JSON.stringify({ success: false, error: 'scenes deve ser um array.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (scenes.length < 2) {
      return new Response(JSON.stringify({ success: false, error: 'Mínimo de 2 cenas requerido.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (scenes.length > 10) {
      return new Response(JSON.stringify({ success: false, error: 'Máximo de 10 cenas permitido.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let totalDuration = 0;
    const sanitizedScenes: Array<{ prompt: string; duration: number; mode: string }> = [];
    for (let i = 0; i < scenes.length; i++) {
      const s = scenes[i];
      const p = (s?.prompt || '').toString().substring(0, MAX_PROMPT_LENGTH).trim();
      const d = Number(s?.duration);
      if (!p) {
        return new Response(JSON.stringify({ success: false, error: `Prompt da cena ${i + 1} não pode estar vazio.` }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (!ALLOWED_DURATIONS.includes(d)) {
        return new Response(JSON.stringify({ success: false, error: `Cena ${i + 1}: duração deve ser 6 ou 10 segundos.` }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      totalDuration += d;
      sanitizedScenes.push({ prompt: p, duration: d, mode: 'custom' });
    }

    if (totalDuration > MAX_TOTAL_DURATION) {
      return new Response(JSON.stringify({ success: false, error: `Duração total (${totalDuration}s) excede o limite de ${MAX_TOTAL_DURATION}s.` }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!ALLOWED_ASPECTS.includes(aspect_ratio)) {
      return new Response(JSON.stringify({ success: false, error: 'aspect_ratio inválido.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!ALLOWED_RESOLUTIONS.includes(resolution)) {
      return new Response(JSON.stringify({ success: false, error: 'resolution inválido.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('GEMINIGEN_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ success: false, error: 'GEMINIGEN_API_KEY não configurada.' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const outForm = new FormData();
    outForm.append('scenes', JSON.stringify(sanitizedScenes));
    outForm.append('aspect_ratio', aspect_ratio);
    outForm.append('resolution', resolution);
    outForm.append('model', 'grok-video');

    console.log('Storyboard request:', { scenes: sanitizedScenes.length, totalDuration, aspect_ratio, resolution });

    const response = await fetch('https://api.geminigen.ai/uapi/v1/video-storyboard/grok', {
      method: 'POST',
      headers: { 'x-api-key': apiKey },
      body: outForm,
    });

    const rawText = await response.text();
    let data: any = {};
    try {
      data = rawText ? JSON.parse(rawText) : {};
    } catch {
      // API retornou texto puro (ex: "Internal Server Error")
      data = { error: rawText?.substring(0, 500) || `HTTP ${response.status}` };
    }

    if (!response.ok) {
      console.error('GeminiGen storyboard error:', response.status, rawText?.substring(0, 500));
    }
    console.log('Storyboard response:', { uuid: data.uuid, status: response.status });

    const generationUuid = data?.uuid || null;
    const apiFailed = !response.ok || !generationUuid;
    const extractedError = apiFailed ? extractErrorMessage(data, response.status) : null;
    const userEmail = user.email as string;
    const userRole = isAdmin ? 'admin' : 'user';
    const combinedPrompt = sanitizedScenes.map((s, i) => `[Cena ${i + 1} - ${s.duration}s] ${s.prompt}`).join('\n\n');

    await adminClient.from('image_generations').insert({
      user_id: userId,
      email: userEmail,
      role: userRole,
      plan: profile?.plan || null,
      model: 'grok-storyboard',
      prompt: combinedPrompt.substring(0, MAX_PROMPT_LENGTH),
      uuid: generationUuid || null,
      status: apiFailed ? 'failed' : 'pending',
      aspect_ratio,
      resolution,
      request_payload: { scenes: sanitizedScenes, aspect_ratio, resolution, model: 'grok-video', total_duration: totalDuration },
      response_payload: data,
      error_message: extractedError,
      estimated_credit: data?.estimated_credit || 0,
    });

    return new Response(JSON.stringify({
      success: !apiFailed,
      uuid: generationUuid || null,
      error: extractedError ? `API GeminiGen: ${extractedError}` : null,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('geminigen-video-storyboard internal error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Erro interno ao gerar storyboard.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
