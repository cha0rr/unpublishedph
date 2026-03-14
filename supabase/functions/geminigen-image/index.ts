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
      aspect_ratio = "1:1",
      output_format = "jpeg",
      resolution = "1K",
      style = "None",
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

    // Send as FormData (same as video endpoint)
    const formData = new FormData();
    formData.append('prompt', prompt);
    formData.append('model', 'nano-banana-2');
    formData.append('aspect_ratio', aspect_ratio);
    formData.append('output_format', output_format);
    formData.append('resolution', resolution);
    formData.append('style', style);

    console.log('Sending image request as FormData');

    const response = await fetch('https://api.geminigen.ai/uapi/v1/generate_image', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
      },
      body: formData,
    });

    const responseText = await response.text();
    console.log('Response status:', response.status, 'body:', responseText);

    let data;
    try { data = JSON.parse(responseText); } catch { data = { raw: responseText }; }

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message || 'Erro interno ao gerar imagem.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
