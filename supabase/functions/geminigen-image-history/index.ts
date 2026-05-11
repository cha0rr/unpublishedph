import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function normalizeMediaUrl(url: unknown): string | null {
  if (!url || typeof url !== 'string') return (url as string) ?? null;
  const idx = url.indexOf('https://', 8);
  if (idx > 0) return url.slice(idx);
  const httpIdx = url.indexOf('http://', 8);
  if (httpIdx > 0) return url.slice(httpIdx);
  return url;
}

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

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Token inválido.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = user.id;

    // Check authorization
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
    const hasImageAccess = profile?.plan === 'pro';

    if (!isAdmin && (!isApproved || !hasImageAccess)) {
      return new Response(JSON.stringify({ error: 'Acesso restrito.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { uuid } = await req.json();

    if (!uuid) {
      return new Response(JSON.stringify({ error: 'UUID é obrigatório.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // IDOR protection: verify UUID belongs to the authenticated user (admins bypass)
    if (!isAdmin) {
      const { data: record } = await adminClient
        .from('image_generations')
        .select('id')
        .eq('uuid', uuid)
        .eq('user_id', userId)
        .single();

      if (!record) {
        return new Response(JSON.stringify({ error: 'Acesso negado a este recurso.' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Query GeminiGen history
    const apiResponse = await fetch(`https://api.geminigen.ai/uapi/v1/history/${uuid}`, {
      method: 'GET',
      headers: {
        'x-api-key': geminigenKey,
      },
    });

    const data = await apiResponse.json();

    // Update the record in image_generations
    const updatePayload: Record<string, any> = {
      response_payload: data,
      updated_at: new Date().toISOString(),
    };

    if (data.status !== undefined) {
      if (data.status === 2) updatePayload.status = 'completed';
      else if (data.status === 3) updatePayload.status = 'failed';
      else updatePayload.status = 'processing';
    }

    if (data.status_percentage !== undefined) {
      updatePayload.status_percentage = data.status_percentage;
    }

    // Extract image URL
    let imageUrl = data.generate_result;
    if (!imageUrl && data.generated_image?.length > 0) {
      const img = data.generated_image[0];
      imageUrl = img.image_url || img.file_download_url;
    }
    if (!imageUrl) imageUrl = data.thumbnail_url;
    if (imageUrl) updatePayload.image_url = imageUrl;

    // Extract thumbnail_small
    if (data.thumbnail_small) updatePayload.thumbnail_small = data.thumbnail_small;
    if (data.generated_image?.[0]?.thumbnail_small) {
      updatePayload.thumbnail_small = data.generated_image[0].thumbnail_small;
    }

    // Extract file_size
    if (data.file_size !== undefined) updatePayload.file_size = data.file_size;
    if (data.generated_image?.[0]?.file_size !== undefined) {
      updatePayload.file_size = data.generated_image[0].file_size;
    }

    // Extract credits
    if (data.used_credit !== undefined) updatePayload.used_credit = data.used_credit;
    if (data.estimated_credit !== undefined) updatePayload.estimated_credit = data.estimated_credit;
    if (data.ai_credit !== undefined) updatePayload.ai_credit = data.ai_credit;

    // Extract error info
    if (data.error_code !== undefined) updatePayload.error_code = String(data.error_code);
    if (data.error_message !== undefined) updatePayload.error_message = data.error_message;

    await adminClient
      .from('image_generations')
      .update(updatePayload)
      .eq('uuid', uuid)
      .eq('user_id', userId);

    return new Response(JSON.stringify(data), {
      status: apiResponse.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message || 'Erro ao consultar histórico.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
