import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const MAX_PROMPT_LENGTH = 4000;

const GROK_ASPECT_MAP: Record<string, string> = {
  '16:9': 'landscape',
  '9:16': 'portrait',
  '1:1': 'square',
  '2:3': '2:3',
  '3:2': '3:2',
};

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
  return `Erro HTTP ${statusCode} da API de vídeo.`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // --- Auth validation ---
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

    // --- Plan/role check ---
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

    // --- Parse incoming FormData ---
    const incomingForm = await req.formData();
    const prompt = incomingForm.get('prompt') as string | null;
    const resolution = (incomingForm.get('resolution') as string) || '720p';
    const aspectRatio = (incomingForm.get('aspect_ratio') as string) || '16:9';
    const modeImage = (incomingForm.get('mode_image') as string) || '';
    const modelFromClient = (incomingForm.get('model') as string) || 'veo-3.1-fast';
    const duration = (incomingForm.get('duration') as string) || '';
    const mode = (incomingForm.get('mode') as string) || '';
    const variantsRaw = parseInt((incomingForm.get('variants') as string) || '1', 10);
    const isVeoModel = modelFromClient === 'veo-3-fast' || modelFromClient === 'veo-3.1-fast';
    const variants = isVeoModel && variantsRaw === 2 ? 2 : 1;

    if (!prompt) {
      return new Response(JSON.stringify({ success: false, error: 'prompt é obrigatório.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const isGrok = modelFromClient === 'grok-3';

    // Grok requires pro plan or admin
    if (isGrok && !isAdmin && profile?.plan !== 'pro') {
      return new Response(JSON.stringify({ success: false, error: 'O modelo Grok 3 está disponível apenas no plano Pro.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // --- Prompt sanitization ---
    const sanitizedPrompt = prompt.substring(0, MAX_PROMPT_LENGTH).trim();

    const apiKey = Deno.env.get('GEMINIGEN_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ success: false, error: 'GEMINIGEN_API_KEY não configurada.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // --- Build outgoing FormData ---
    const outForm = new FormData();
    outForm.append('prompt', sanitizedPrompt);
    outForm.append('resolution', resolution);
    outForm.append('model', modelFromClient);

    let endpoint: string;

    if (isGrok) {
      endpoint = 'https://api.geminigen.ai/uapi/v1/video-gen/grok';
      // Convert aspect ratio to Grok keywords
      const grokAspect = GROK_ASPECT_MAP[aspectRatio] || 'landscape';
      outForm.append('aspect_ratio', grokAspect);
      // Add duration and mode
      outForm.append('duration', duration || '6');
      outForm.append('mode', mode || 'normal');
      // Grok does not use the generic 'resolution' field — remove it
      outForm.delete('resolution');
      // Grok uses 'files' field for ref images
      if (modeImage && modeImage !== 'none') {
        const refImages = incomingForm.getAll('ref_images') as File[];
        for (const f of refImages) {
          outForm.append('files', f, f.name || 'reference.png');
        }
      }
    } else {
      endpoint = 'https://api.geminigen.ai/uapi/v1/video-gen/veo';
      outForm.append('aspect_ratio', aspectRatio);
      outForm.append('watermark', 'false');
      if (modeImage === 'ingredient' || modeImage === 'frame') {
        outForm.append('mode_image', modeImage);
        const refImages = incomingForm.getAll('ref_images') as File[];
        for (const f of refImages) {
          outForm.append('ref_images', f, f.name || 'reference.png');
        }
      }
    }

    console.log('GeminiGen request:', { prompt: sanitizedPrompt.substring(0, 50), model: modelFromClient, modeImage, aspectRatio, resolution, endpoint, duration, mode });

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'x-api-key': apiKey },
      body: outForm,
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('GeminiGen API error (full body):', JSON.stringify(data));
    }
    console.log('GeminiGen video response:', { uuid: data.uuid, status: response.status, error: data.error || data.message || null });

    // Extract the most useful error message from various possible fields
    const extractedError = !response.ok ? extractErrorMessage(data, response.status) : null;

    const generationUuid = data.uuid;
    const userEmail = user.email as string;
    const userRole = isAdmin ? 'admin' : 'user';

    await adminClient.from('image_generations').insert({
      user_id: userId,
      email: userEmail,
      role: userRole,
      plan: profile?.plan || null,
      model: modelFromClient,
      prompt: sanitizedPrompt,
      uuid: generationUuid || null,
      status: response.ok ? 'pending' : 'failed',
      aspect_ratio: aspectRatio,
      resolution,
      request_payload: { prompt: sanitizedPrompt, resolution, aspect_ratio: aspectRatio, mode_image: modeImage || 'none', model: modelFromClient, ...(isGrok ? { duration, mode } : {}) },
      response_payload: data,
      error_message: response.ok ? null : extractedError,
    });

    return new Response(JSON.stringify({ success: response.ok, uuid: generationUuid || null, error: extractedError }), {
      status: response.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('geminigen-video internal error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Erro interno ao gerar vídeo.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
