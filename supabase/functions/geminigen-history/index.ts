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
      return new Response(JSON.stringify({ error: 'Não autorizado.' }), {
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
      return new Response(JSON.stringify({ error: 'Token inválido.' }), {
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
      return new Response(JSON.stringify({ error: 'Acesso restrito. Conta não aprovada.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // --- Business logic ---
    const { uuid } = await req.json();

    if (!uuid) {
      return new Response(JSON.stringify({ error: 'uuid é obrigatório.' }), {
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

    const response = await fetch(`https://api.geminigen.ai/uapi/v1/history/${uuid}`, {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
      },
    });

    const data = await response.json();

    // --- Sync status to image_generations (same pattern as geminigen-image-history) ---
    const updatePayload: Record<string, any> = {
      response_payload: data,
      updated_at: new Date().toISOString(),
    };

    const numericStatus = Number(data.status);
    if (numericStatus === 2) updatePayload.status = 'completed';
    else if (numericStatus === 3) updatePayload.status = 'failed';
    else updatePayload.status = 'processing';

    if (data.status_percentage !== undefined) {
      updatePayload.status_percentage = Number(data.status_percentage);
    }

    // Extract video URL
    let videoUrl = data.generate_result;
    if (!videoUrl && data.generated_video?.length > 0) {
      const vid = data.generated_video[0];
      videoUrl = vid.video_url || vid.file_download_url;
    }
    if (!videoUrl) videoUrl = data.thumbnail_url;
    if (videoUrl) updatePayload.image_url = videoUrl;

    // Credits
    if (data.used_credit !== undefined) updatePayload.used_credit = data.used_credit;
    if (data.estimated_credit !== undefined) updatePayload.estimated_credit = data.estimated_credit;
    if (data.ai_credit !== undefined) updatePayload.ai_credit = data.ai_credit;

    // Errors
    if (data.error_code !== undefined) updatePayload.error_code = String(data.error_code);
    if (data.error_message !== undefined) updatePayload.error_message = data.error_message;

    await adminClient
      .from('image_generations')
      .update(updatePayload)
      .eq('uuid', uuid);

    // Normalize status to number for frontend consistency
    const normalizedData = { ...data, status: numericStatus };

    return new Response(JSON.stringify(normalizedData), {
      status: response.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message || 'Erro ao consultar histórico.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
