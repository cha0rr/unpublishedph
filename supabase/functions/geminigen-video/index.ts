const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      prompt,
      resolution = "720p",
      aspect_ratio = "16:9",
      reference_image,
    } = await req.json();

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'prompt é obrigatório.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('GEMINIGEN_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'GEMINIGEN_API_KEY não configurada.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const formData = new FormData();
    formData.append('prompt', prompt);
    formData.append('model', 'veo-3.1-fast');
    formData.append('resolution', resolution);
    formData.append('aspect_ratio', aspect_ratio);

    if (reference_image) {
      // Convert base64 data URL to blob
      const base64Data = reference_image.split(',')[1] || reference_image;
      const mimeMatch = reference_image.match(/data:([^;]+);/);
      const mime = mimeMatch ? mimeMatch[1] : 'image/png';
      const binaryStr = atob(base64Data);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: mime });
      formData.append('image', blob, 'reference.png');
    }

    const response = await fetch('https://api.geminigen.ai/uapi/v1/video-gen/veo', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
      },
      body: formData,
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message || 'Erro interno ao gerar vídeo.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
