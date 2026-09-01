import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { snapgenFetch, SNAPGEN_TOKEN_MISSING } from '../_shared/snapgen.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const MAX_PROMPT_LENGTH = 4000;
/** Único modelo suportado após a migração para a SnapGen. */
const MODEL = 'veo-3.1-fast';

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
    const duration = (incomingForm.get('duration') as string) || '8';

    if (!prompt) {
      return new Response(JSON.stringify({ success: false, error: 'prompt é obrigatório.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const sanitizedPrompt = prompt.substring(0, MAX_PROMPT_LENGTH).trim();

    const refImages = (modeImage === 'ingredient' || modeImage === 'frame')
      ? incomingForm.getAll('ref_images') as File[]
      : [];

    // FormData só pode ser consumida uma vez — factory permite retentar após 401.
    const buildForm = (): FormData => {
      const f = new FormData();
      f.append('prompt', sanitizedPrompt);
      f.append('model', MODEL);
      f.append('aspect_ratio', aspectRatio);
      f.append('resolution', resolution);
      f.append('duration', duration);
      f.append('enhance_prompt', 'true');
      if (refImages.length > 0) {
        f.append('mode_image', modeImage);
        for (const file of refImages) {
          f.append('ref_images', file, file.name || 'reference.png');
        }
      }
      return f;
    };

    console.log('SnapGen request:', {
      prompt: sanitizedPrompt.substring(0, 50),
      model: MODEL,
      modeImage: modeImage || 'none',
      aspectRatio,
      resolution,
      duration,
      refImages: refImages.length,
    });

    const response = await snapgenFetch('/api/video-gen/veo', { method: 'POST' }, buildForm);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error('SnapGen API error (full body):', JSON.stringify(data));
    }

    const extractedError = !response.ok ? extractErrorMessage(data, response.status) : null;
    const generationUuid = data?.uuid || null;

    await adminClient.from('image_generations').insert({
      user_id: userId,
      email: user.email as string,
      role: isAdmin ? 'admin' : 'user',
      plan: profile?.plan || null,
      model: MODEL,
      prompt: sanitizedPrompt,
      uuid: generationUuid,
      status: response.ok && generationUuid ? 'pending' : 'failed',
      aspect_ratio: aspectRatio,
      resolution,
      request_payload: {
        provider: 'snapgen',
        prompt: sanitizedPrompt,
        resolution,
        aspect_ratio: aspectRatio,
        duration,
        mode_image: modeImage || 'none',
        model: MODEL,
      },
      response_payload: data,
      error_message: extractedError,
    });

    const success = !!generationUuid && response.ok;

    return new Response(JSON.stringify({
      success,
      uuid: generationUuid,
      error: extractedError,
    }), {
      status: success ? 200 : (response.ok ? 502 : response.status),
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('snapgen-video error:', error?.message);
    if (typeof error?.message === 'string' && error.message.includes(SNAPGEN_TOKEN_MISSING)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'A geração de vídeos está temporariamente indisponível. O administrador precisa configurar o token do SnapGen em /admin/snapgen.',
        snapgen_token_missing: true,
      }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ success: false, error: error?.message || 'Erro ao gerar vídeo.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
