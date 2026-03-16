import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

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

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ success: false, error: 'Token inválido.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = claimsData.claims.sub as string;

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

    // --- Business logic ---
    const apiKey = Deno.env.get('GEMINIGEN_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ success: false, error: 'GEMINIGEN_API_KEY não configurada.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const incoming = await req.formData();

    const prompt = incoming.get('prompt');
    const aspectRatio = incoming.get('aspect_ratio') || '16:9';
    const resolution = incoming.get('resolution') || '720p';
    const modelFromClient = (incoming.get('model') as string) || 'veo-3.1-fast';
    const allFiles = incoming.getAll('files') as File[];

    if (!prompt || typeof prompt !== 'string') {
      return new Response(JSON.stringify({ success: false, error: 'prompt é obrigatório.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (allFiles.length < 2) {
      return new Response(JSON.stringify({ success: false, error: 'Envie frame inicial e frame final.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const formData = new FormData();
    formData.append('prompt', prompt);
    formData.append('model', modelFromClient);
    formData.append('resolution', String(resolution));
    formData.append('aspect_ratio', String(aspectRatio));
    formData.append('mode_image', 'frame');
    formData.append('watermark', 'false');

    for (const f of allFiles) {
      formData.append('files', f, f.name || 'frame.png');
    }

    console.log('Sending frame mode request:', { prompt: prompt.substring(0, 50), model: modelFromClient, aspectRatio, resolution, filesCount: allFiles.length });

    const response = await fetch('https://api.geminigen.ai/uapi/v1/video-gen/veo', {
      method: 'POST',
      headers: { 'x-api-key': apiKey },
      body: formData,
    });

    const data = await response.json();
    console.log('GeminiGen response:', JSON.stringify(data));

    const generationUuid = data.uuid;
    const userEmail = claimsData.claims.email as string;
    const userRole = isAdmin ? 'admin' : 'user';

    await adminClient.from('image_generations').insert({
      user_id: userId,
      email: userEmail,
      role: userRole,
      plan: profile?.plan || null,
      model: modelFromClient,
      prompt: String(prompt),
      uuid: generationUuid || null,
      status: response.ok ? 'pending' : 'failed',
      aspect_ratio: String(aspectRatio),
      resolution: String(resolution),
      request_payload: { prompt, resolution, aspect_ratio: aspectRatio, mode: 'frame', model: modelFromClient },
      response_payload: data,
      error_message: response.ok ? null : (data.error || data.message || null),
    });

    return new Response(JSON.stringify({ success: response.ok, uuid: generationUuid || null, status: response.status }), {
      status: response.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message || 'Erro interno ao gerar vídeo.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
