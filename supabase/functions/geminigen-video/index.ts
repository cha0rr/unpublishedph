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

    // --- Daily limit check (admin-configurable via daily_limits table) ---
    if (!isAdmin) {
      const today = new Date(); today.setUTCHours(0, 0, 0, 0);
      const planKey = profile?.plan === 'pro' ? 'video_pro' : 'video_basico';
      const [{ count }, { data: limitRow }] = await Promise.all([
        adminClient
          .from('image_generations')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .gte('created_at', today.toISOString())
          .in('model', ['veo-3-fast', 'veo-3.1-fast', 'grok-3', 'grok-3-extend', 'veo-extend']),
        adminClient
          .from('daily_limits')
          .select('limit_value, enabled')
          .eq('key', planKey)
          .maybeSingle(),
      ]);
      const effectiveLimit = limitRow?.enabled ? limitRow.limit_value : null;
      if (effectiveLimit !== null && (count ?? 0) >= effectiveLimit) {
        return new Response(JSON.stringify({ success: false, error: `Limite diário de ${effectiveLimit} gerações de vídeo atingido.` }), {
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

    // --- Build outgoing FormData (factory so it can be re-used per variant) ---
    const refImagesAll = (modeImage && modeImage !== 'none') ? incomingForm.getAll('ref_images') as File[] : [];
    const grokFilesAll = isGrok && modeImage && modeImage !== 'none' ? incomingForm.getAll('ref_images') as File[] : [];

    const buildOutForm = (): FormData => {
      const f = new FormData();
      f.append('prompt', sanitizedPrompt);
      f.append('model', modelFromClient);
      if (isGrok) {
        const grokAspect = GROK_ASPECT_MAP[aspectRatio] || 'landscape';
        f.append('aspect_ratio', grokAspect);
        f.append('duration', duration || '6');
        f.append('mode', mode || 'normal');
        for (const file of grokFilesAll) {
          f.append('files', file, file.name || 'reference.png');
        }
      } else {
        f.append('resolution', resolution);
        f.append('aspect_ratio', aspectRatio);
        f.append('watermark', 'false');
        if (modeImage === 'ingredient' || modeImage === 'frame') {
          f.append('mode_image', modeImage);
          for (const file of refImagesAll) {
            f.append('ref_images', file, file.name || 'reference.png');
          }
        }
      }
      return f;
    };

    const endpoint = isGrok
      ? 'https://api.geminigen.ai/uapi/v1/video-gen/grok'
      : 'https://api.geminigen.ai/uapi/v1/video-gen/veo';

    console.log('GeminiGen request:', { prompt: sanitizedPrompt.substring(0, 50), model: modelFromClient, modeImage, aspectRatio, resolution, endpoint, duration, mode, variants });

    const userEmail = user.email as string;
    const userRole = isAdmin ? 'admin' : 'user';

    // Run N parallel requests to GeminiGen
    const callOnce = async () => {
      const r = await fetch(endpoint, {
        method: 'POST',
        headers: { 'x-api-key': apiKey },
        body: buildOutForm(),
      });
      const d = await r.json().catch(() => ({}));
      return { response: r, data: d };
    };

    const results = await Promise.all(Array.from({ length: variants }, () => callOnce()));

    const uuids: string[] = [];
    const errors: string[] = [];
    let lastStatus = 200;

    for (const { response, data } of results) {
      if (!response.ok) {
        console.error('GeminiGen API error (full body):', JSON.stringify(data));
        lastStatus = response.status;
      }
      const extractedError = !response.ok ? extractErrorMessage(data, response.status) : null;
      const generationUuid = data?.uuid || null;
      if (generationUuid) uuids.push(generationUuid);
      if (extractedError) errors.push(extractedError);

      await adminClient.from('image_generations').insert({
        user_id: userId,
        email: userEmail,
        role: userRole,
        plan: profile?.plan || null,
        model: modelFromClient,
        prompt: sanitizedPrompt,
        uuid: generationUuid,
        status: response.ok ? 'pending' : 'failed',
        aspect_ratio: aspectRatio,
        resolution,
        request_payload: { prompt: sanitizedPrompt, resolution, aspect_ratio: aspectRatio, mode_image: modeImage || 'none', model: modelFromClient, ...(isGrok ? { duration, mode } : {}), variants },
        response_payload: data,
        error_message: response.ok ? null : extractedError,
      });
    }

    const success = uuids.length > 0;
    const responseBody: any = { success, error: errors.length > 0 ? errors[0] : null };
    if (variants === 2) {
      responseBody.uuids = uuids;
      responseBody.uuid = uuids[0] || null;
    } else {
      responseBody.uuid = uuids[0] || null;
    }

    return new Response(JSON.stringify(responseBody), {
      status: success ? 200 : lastStatus,
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
