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

    // --- Parse incoming FormData ---
    const incomingForm = await req.formData();
    const prompt = incomingForm.get('prompt') as string | null;
    const resolution = (incomingForm.get('resolution') as string) || '720p';
    const aspectRatio = (incomingForm.get('aspect_ratio') as string) || '16:9';
    const modeImage = (incomingForm.get('mode_image') as string) || 'none';
    const modelFromClient = (incomingForm.get('model') as string) || 'veo-3.1-fast';

    if (!prompt) {
      return new Response(JSON.stringify({ success: false, error: 'prompt é obrigatório.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('GEMINIGEN_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ success: false, error: 'GEMINIGEN_API_KEY não configurada.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // --- Build outgoing FormData for GeminiGen API ---
    const outForm = new FormData();
    outForm.append('prompt', prompt);
    outForm.append('resolution', resolution);
    outForm.append('aspect_ratio', aspectRatio);
    outForm.append('model', modelFromClient);
    outForm.append('watermark', 'false');

    if (modeImage === 'ingredient') {
      outForm.append('mode_image', 'ingredient');
      const file = incomingForm.get('files') as File | null;
      if (file) {
        outForm.append('files', file, file.name || 'reference.png');
      }
    } else if (modeImage === 'frame') {
      outForm.append('mode_image', 'frame');
      const allFiles = incomingForm.getAll('files') as File[];
      for (const f of allFiles) {
        outForm.append('files', f, f.name || 'frame.png');
      }
    }
    // mode "none": no mode_image, no files

    console.log('GeminiGen request:', { prompt: prompt.substring(0, 50), model: modelFromClient, modeImage, aspectRatio, resolution });

    const response = await fetch('https://api.geminigen.ai/uapi/v1/video-gen/veo', {
      method: 'POST',
      headers: { 'x-api-key': apiKey },
      body: outForm,
    });

    const data = await response.json();

    console.log('GeminiGen video response:', { uuid: data.uuid, status: response.status, error: data.error || data.message || null });

    const generationUuid = data.uuid;
    const userEmail = user.email as string;
    const userRole = isAdmin ? 'admin' : 'user';

    await adminClient.from('image_generations').insert({
      user_id: userId,
      email: userEmail,
      role: userRole,
      plan: profile?.plan || null,
      model: modelFromClient,
      prompt,
      uuid: generationUuid || null,
      status: response.ok ? 'pending' : 'failed',
      aspect_ratio: aspectRatio,
      resolution,
      request_payload: { prompt, resolution, aspect_ratio: aspectRatio, mode_image: modeImage, model: modelFromClient },
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
