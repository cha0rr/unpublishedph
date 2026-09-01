import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { snapgenFetch, normalizeMediaUrl } from '../_shared/snapgen.ts';

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

    const { uuid } = await req.json();
    if (!uuid) {
      return new Response(JSON.stringify({ error: 'uuid é obrigatório.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // IDOR protection: o UUID precisa pertencer ao usuário (admins passam).
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

    const response = await snapgenFetch(`/api/history/${uuid}`, { method: 'GET' });
    const data = await response.json().catch(() => ({} as any));

    console.log('SnapGen history response:', JSON.stringify({
      uuid,
      http: response.status,
      status: data?.status,
      error_code: data?.error_code,
      error_message: data?.error_message,
    }));

    if (!response.ok) {
      const msg = typeof data?.detail === 'string'
        ? data.detail
        : data?.detail?.error_message || `Erro HTTP ${response.status} ao consultar histórico.`;
      return new Response(JSON.stringify({ error: msg }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const numericStatus = Number(data.status);
    const updatePayload: Record<string, any> = {
      response_payload: data,
      updated_at: new Date().toISOString(),
      status: numericStatus === 2 ? 'completed' : numericStatus === 3 ? 'failed' : 'processing',
    };

    if (data.status_percentage !== undefined) {
      updatePayload.status_percentage = Number(data.status_percentage);
    }

    // --- URL do vídeo ---
    let videoUrl = normalizeMediaUrl(data.generate_result);
    if (!videoUrl && Array.isArray(data.generated_video) && data.generated_video.length > 0) {
      const vid = data.generated_video[0];
      videoUrl = normalizeMediaUrl(vid?.video_url || vid?.file_download_url);
    }
    if (!videoUrl) videoUrl = normalizeMediaUrl(data.thumbnail_url);

    if (data.generate_result) data.generate_result = normalizeMediaUrl(data.generate_result);
    if (Array.isArray(data.generated_video)) {
      data.generated_video = data.generated_video.map((v: any) => ({
        ...v,
        video_url: normalizeMediaUrl(v?.video_url),
        file_download_url: normalizeMediaUrl(v?.file_download_url),
      }));
    }

    if (videoUrl) {
      updatePayload.image_url = videoUrl;
    } else {
      // Sem URL na API: reaproveita a que já estiver salva (ex.: webhook).
      const { data: existingRow } = await adminClient
        .from('image_generations')
        .select('image_url')
        .eq('uuid', uuid)
        .maybeSingle();
      if (existingRow?.image_url) {
        videoUrl = existingRow.image_url;
        data.generate_result = videoUrl;
      }
    }

    if (data.used_credit !== undefined) updatePayload.used_credit = data.used_credit;
    if (data.estimated_credit !== undefined) updatePayload.estimated_credit = data.estimated_credit;
    if (data.ai_credit !== undefined) updatePayload.ai_credit = data.ai_credit;
    if (data.error_code !== undefined) updatePayload.error_code = String(data.error_code);
    if (data.error_message !== undefined) updatePayload.error_message = data.error_message;

    await adminClient
      .from('image_generations')
      .update(updatePayload)
      .eq('uuid', uuid);

    return new Response(JSON.stringify({ ...data, status: numericStatus }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('snapgen-history error:', error?.message);
    return new Response(JSON.stringify({ error: error?.message || 'Erro ao consultar histórico.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
