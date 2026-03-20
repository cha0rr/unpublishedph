import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const RATE_LIMIT_PER_HOUR = 10;
const MAX_PROMPT_LENGTH = 2000;

const ALLOWED_PROXY_HOSTS = [
  'api.geminigen.ai',
  'cdn.geminigen.ai',
  'storage.geminigen.ai',
  'r2.geminigen.ai',
  'pub-',
];

function isAllowedProxyUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ALLOWED_PROXY_HOSTS.some((h) => parsed.hostname.includes(h) || parsed.hostname.startsWith(h));
  } catch {
    return false;
  }
}

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

  // --- GET: Proxy for downloading media (avoids CORS) ---
  if (req.method === 'GET') {
    const url = new URL(req.url);
    const targetUrl = url.searchParams.get('url');

    if (!targetUrl) {
      return new Response(JSON.stringify({ error: 'Missing url param' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!isAllowedProxyUrl(targetUrl)) {
      return new Response(JSON.stringify({ error: 'URL not allowed' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Authenticate
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Não autorizado.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const user = await authenticateUser(authHeader);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Token inválido.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    try {
      const mediaRes = await fetch(targetUrl);
      if (!mediaRes.ok) {
        return new Response(JSON.stringify({ error: `Upstream ${mediaRes.status}` }), {
          status: mediaRes.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const contentType = mediaRes.headers.get('Content-Type') || 'application/octet-stream';
      const body = await mediaRes.arrayBuffer();

      return new Response(body, {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=3600',
        },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: 'Proxy fetch failed' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  // --- POST: Video extend ---
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ success: false, error: 'Não autorizado.' }), {
        status: 401,
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

    const { prompt, ref_history } = await req.json();

    if (!prompt || !ref_history) {
      return new Response(JSON.stringify({ success: false, error: 'prompt e ref_history são obrigatórios.' }), {
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

    const outForm = new FormData();
    outForm.append('prompt', sanitizedPrompt);
    outForm.append('ref_history', ref_history);

    console.log('GeminiGen video-extend request:', {
      prompt: sanitizedPrompt.substring(0, 50),
      ref_history,
    });

    const response = await fetch('https://api.geminigen.ai/uapi/v1/video-extend/veo', {
      method: 'POST',
      headers: { 'x-api-key': apiKey },
      body: outForm,
    });

    const rawText = await response.text();
    console.log('GeminiGen video-extend raw response:', rawText.substring(0, 2000));
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
      model: data.model_name || 'veo-extend',
      prompt: `[EXTEND] ${sanitizedPrompt}`,
      uuid: generationUuid || null,
      status: response.ok ? 'pending' : 'failed',
      request_payload: {
        prompt: sanitizedPrompt,
        ref_history,
        endpoint: 'video-extend/veo',
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
