import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const RATE_LIMIT_PER_HOUR = 10;
const MAX_PROMPT_LENGTH = 2000;

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

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ success: false, error: 'Não autorizado.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // --- PROXY MODE: GET request with ?action=proxy&url=... ---
    const url = new URL(req.url);
    if (req.method === 'GET' && url.searchParams.get('action') === 'proxy') {
      const user = await authenticateUser(authHeader);
      if (!user) {
        return new Response(JSON.stringify({ error: 'Token inválido.' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const videoUrl = url.searchParams.get('url');
      if (!videoUrl) {
        return new Response(JSON.stringify({ error: 'url é obrigatório.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('Proxy: downloading video', videoUrl.substring(0, 80));
      const videoRes = await fetch(videoUrl);
      if (!videoRes.ok) {
        return new Response(JSON.stringify({ error: `Falha ao baixar vídeo: ${videoRes.status}` }), {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const videoBody = await videoRes.arrayBuffer();
      console.log('Proxy: video downloaded, size:', videoBody.byteLength);
      return new Response(videoBody, {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': videoRes.headers.get('Content-Type') || 'video/mp4',
          'Content-Length': String(videoBody.byteLength),
        },
      });
    }

    // --- EXTEND MODE: POST with FormData (ref_images = last frame image) ---
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
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

    if (!isAdmin) {
      const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
      const { count } = await adminClient
        .from('image_generations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', oneHourAgo);

      if ((count ?? 0) >= RATE_LIMIT_PER_HOUR) {
        return new Response(JSON.stringify({ success: false, error: `Limite de ${RATE_LIMIT_PER_HOUR} gerações por hora atingido.` }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Parse FormData with the last frame image
    const formData = await req.formData();
    const prompt = formData.get('prompt') as string;
    const refImage = formData.get('ref_images') as File;
    const aspectRatio = (formData.get('aspectRatio') as string) || '16:9';
    const resolution = (formData.get('resolution') as string) || '720p';
    const model = (formData.get('model') as string) || 'veo-3.1-fast';

    if (!prompt || !refImage) {
      return new Response(JSON.stringify({ success: false, error: 'prompt e ref_images são obrigatórios.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const sanitizedPrompt = prompt.substring(0, MAX_PROMPT_LENGTH).trim();

    const apiKey = Deno.env.get('GEMINIGEN_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ success: false, error: 'GEMINIGEN_API_KEY não configurada.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build FormData for GeminiGen API - use mode_image: "frame" with the image
    const outForm = new FormData();
    outForm.append('prompt', sanitizedPrompt);
    outForm.append('resolution', resolution);
    outForm.append('aspect_ratio', aspectRatio);
    outForm.append('model', model);
    outForm.append('watermark', 'false');
    outForm.append('mode_image', 'frame');
    outForm.append('files', refImage, 'last_frame.png');

    console.log('GeminiGen extend request:', {
      prompt: sanitizedPrompt.substring(0, 50),
      model,
      aspectRatio,
      resolution,
      imageSize: refImage.size,
      imageType: refImage.type,
      mode_image: 'frame',
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

    const generationUuid = data.uuid;
    const userEmail = user.email as string;
    const userRole = isAdmin ? 'admin' : 'user';

    await adminClient.from('image_generations').insert({
      user_id: userId,
      email: userEmail,
      role: userRole,
      plan: profile?.plan || null,
      model,
      prompt: `[EXTEND] ${sanitizedPrompt}`,
      uuid: generationUuid || null,
      status: response.ok ? 'pending' : 'failed',
      aspect_ratio: aspectRatio,
      resolution,
      request_payload: {
        prompt: sanitizedPrompt,
        resolution,
        aspect_ratio: aspectRatio,
        mode_image: 'frame',
        model,
      },
      response_payload: data,
      error_message: response.ok ? null : (data.error || data.message || data?.detail?.error_message || null),
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
