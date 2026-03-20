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

    if (!isAdmin) {
      const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
      const { count } = await adminClient
        .from('image_generations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', oneHourAgo);

      if ((count ?? 0) >= RATE_LIMIT_PER_HOUR) {
        return new Response(JSON.stringify({ success: false, error: `Limite de ${RATE_LIMIT_PER_HOUR} gerações por hora atingido. Aguarde alguns minutos.` }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // --- Parse JSON body ---
    const body = await req.json();
    const { prompt, sourceVideoUrl, aspectRatio, resolution, model } = body;

    if (!prompt || !sourceVideoUrl) {
      return new Response(JSON.stringify({ success: false, error: 'prompt e sourceVideoUrl são obrigatórios.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const sanitizedPrompt = (prompt as string).substring(0, MAX_PROMPT_LENGTH).trim();
    const finalResolution = resolution || '720p';
    const finalAspectRatio = aspectRatio || '16:9';
    const finalModel = model || 'veo-3.1-fast';

    const apiKey = Deno.env.get('GEMINIGEN_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ success: false, error: 'GEMINIGEN_API_KEY não configurada.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // --- Download source video ---
    console.log('Downloading source video...');
    const videoResponse = await fetch(sourceVideoUrl);
    if (!videoResponse.ok) {
      return new Response(JSON.stringify({ success: false, error: 'Falha ao baixar o vídeo fonte.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const videoBlob = await videoResponse.blob();
    console.log(`Source video downloaded: ${videoBlob.size} bytes`);

    // --- Build FormData for GeminiGen API ---
    const outForm = new FormData();
    outForm.append('prompt', sanitizedPrompt);
    outForm.append('resolution', finalResolution);
    outForm.append('aspect_ratio', finalAspectRatio);
    outForm.append('model', finalModel);
    outForm.append('watermark', 'false');
    outForm.append('mode_video', 'extend');
    outForm.append('ref_video', videoBlob, 'source_video.mp4');

    console.log('GeminiGen extend request:', {
      prompt: sanitizedPrompt.substring(0, 50),
      model: finalModel,
      aspectRatio: finalAspectRatio,
      resolution: finalResolution,
      videoSize: videoBlob.size,
    });

    const response = await fetch('https://api.geminigen.ai/uapi/v1/video-gen/veo', {
      method: 'POST',
      headers: { 'x-api-key': apiKey },
      body: outForm,
    });

    const rawText = await response.text();
    console.log('GeminiGen extend raw response:', rawText.substring(0, 2000));
    let data: any;
    try { data = JSON.parse(rawText); } catch { data = { raw: rawText.substring(0, 500) }; }
    console.log('GeminiGen extend response:', { uuid: data.uuid, status: response.status, error: data.error || data.message || null });

    const generationUuid = data.uuid;
    const userEmail = user.email as string;
    const userRole = isAdmin ? 'admin' : 'user';

    await adminClient.from('image_generations').insert({
      user_id: userId,
      email: userEmail,
      role: userRole,
      plan: profile?.plan || null,
      model: finalModel,
      prompt: `[EXTEND] ${sanitizedPrompt}`,
      uuid: generationUuid || null,
      status: response.ok ? 'pending' : 'failed',
      aspect_ratio: finalAspectRatio,
      resolution: finalResolution,
      request_payload: {
        prompt: sanitizedPrompt,
        resolution: finalResolution,
        aspect_ratio: finalAspectRatio,
        mode_video: 'extend',
        model: finalModel,
        source_video_url: sourceVideoUrl,
      },
      response_payload: data,
      error_message: response.ok ? null : (data.error || data.message || null),
    });

    return new Response(JSON.stringify({ success: response.ok, uuid: generationUuid || null, status: response.status }), {
      status: response.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message || 'Erro interno ao estender vídeo.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
