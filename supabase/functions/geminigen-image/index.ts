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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Não autorizado.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const geminigenKey = Deno.env.get('GEMINIGEN_API_KEY');

    if (!geminigenKey) {
      return new Response(JSON.stringify({ error: 'GEMINIGEN_API_KEY não configurada.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate JWT
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Token inválido.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = claimsData.claims.sub as string;
    const userEmail = claimsData.claims.email as string;

    // Use service role to check profile and roles
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
    const isBusiness = profile?.plan === 'business' && profile?.status === 'approved';

    if (!isAdmin && !isBusiness) {
      return new Response(JSON.stringify({ error: 'Acesso restrito a usuários Business ou Admin.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { prompt, model } = await req.json();

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt é obrigatório.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const allowedModels = ['nano-banana-2', 'nano-banana-pro'];
    if (!model || !allowedModels.includes(model)) {
      return new Response(JSON.stringify({ error: 'Modelo inválido. Use nano-banana-2 ou nano-banana-pro.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userRole = isAdmin ? 'admin' : 'user';

    // Send to GeminiGen API using FormData
    const formData = new FormData();
    formData.append('prompt', prompt);
    formData.append('model', model);

    const requestPayload = { prompt, model };

    const apiResponse = await fetch('https://api.geminigen.ai/uapi/v1/image-gen', {
      method: 'POST',
      headers: {
        'x-api-key': geminigenKey,
      },
      body: formData,
    });

    const responseData = await apiResponse.json();

    if (!apiResponse.ok) {
      return new Response(JSON.stringify({ error: responseData.error || 'Erro na API GeminiGen.', details: responseData }), {
        status: apiResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const generationUuid = responseData.uuid;

    // Insert record into image_generations using service role
    await adminClient.from('image_generations').insert({
      user_id: userId,
      email: userEmail,
      role: userRole,
      plan: profile?.plan || null,
      model,
      prompt,
      uuid: generationUuid,
      status: 'pending',
      request_payload: requestPayload,
      response_payload: responseData,
    });

    return new Response(JSON.stringify({ uuid: generationUuid, ...responseData }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message || 'Erro interno.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
