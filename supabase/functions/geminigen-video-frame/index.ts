const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('GEMINIGEN_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'GEMINIGEN_API_KEY não configurada.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const incoming = await req.formData();

    const prompt = incoming.get('prompt');
    const aspectRatio = incoming.get('aspect_ratio') || '16:9';
    const resolution = incoming.get('resolution') || '720p';
    const firstFrame = incoming.get('first_frame');
    const lastFrame = incoming.get('last_frame');

    if (!prompt || typeof prompt !== 'string') {
      return new Response(JSON.stringify({ error: 'prompt é obrigatório.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!(firstFrame instanceof File) || !(lastFrame instanceof File)) {
      return new Response(JSON.stringify({ error: 'Envie frame inicial e frame final.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const formData = new FormData();
    formData.append('prompt', prompt);
    formData.append('model', 'veo-3.1-fast');
    formData.append('resolution', String(resolution));
    formData.append('aspect_ratio', String(aspectRatio));
    formData.append('mode_image', 'frame');

    // Order matters: 1st file = first frame, 2nd file = last frame
    formData.append('files', firstFrame, firstFrame.name);
    formData.append('files', lastFrame, lastFrame.name);

    console.log('Sending frame mode request:', { prompt, aspectRatio, resolution, firstFrameSize: firstFrame.size, lastFrameSize: lastFrame.size });

    const response = await fetch('https://api.geminigen.ai/uapi/v1/video-gen/veo', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
      },
      body: formData,
    });

    const data = await response.json();
    console.log('GeminiGen response:', JSON.stringify(data));

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Erro interno ao gerar vídeo.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
