import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const ALLOWED_HOST_SUFFIXES = ['.r2.cloudflarestorage.com', '.geminigen.ai'];
const ALLOWED_VIDEO_EXTENSIONS = ['.mp4', '.mov', '.webm'];

function jsonResponse(body: Record<string, string>, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function isAllowedVideoUrl(urlString: string) {
  try {
    const url = new URL(urlString);
    const host = url.hostname.toLowerCase();
    const path = url.pathname.toLowerCase();

    const allowedHost = ALLOWED_HOST_SUFFIXES.some((suffix) => host === suffix.slice(1) || host.endsWith(suffix));
    const allowedExtension = ALLOWED_VIDEO_EXTENSIONS.some((extension) => path.endsWith(extension));

    return url.protocol === 'https:' && allowedHost && allowedExtension;
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return jsonResponse({ error: 'Não autorizado.' }, 401);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return jsonResponse({ error: 'Token inválido.' }, 401);
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const [profileResult, rolesResult] = await Promise.all([
      adminClient.from('profiles').select('status').eq('user_id', user.id).single(),
      adminClient.from('user_roles').select('role').eq('user_id', user.id),
    ]);

    const isAdmin = profileResult.error
      ? false
      : rolesResult.data?.some((role: { role: string }) => role.role === 'admin') ?? false;
    const isApproved = profileResult.data?.status === 'approved';

    if (!isAdmin && !isApproved) {
      return jsonResponse({ error: 'Acesso restrito. Conta não aprovada.' }, 403);
    }

    const { url } = await req.json();

    if (typeof url !== 'string' || !isAllowedVideoUrl(url)) {
      return jsonResponse({ error: 'URL de vídeo inválida para download.' }, 400);
    }

    const upstream = await fetch(url);
    if (!upstream.ok || !upstream.body) {
      return jsonResponse({ error: `Falha ao baixar segmento remoto (HTTP ${upstream.status}).` }, 502);
    }

    const headers = new Headers(corsHeaders);
    headers.set('Content-Type', upstream.headers.get('Content-Type') || 'video/mp4');

    const contentLength = upstream.headers.get('Content-Length');
    if (contentLength) {
      headers.set('Content-Length', contentLength);
    }

    headers.set('Cache-Control', 'private, max-age=60');

    return new Response(upstream.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('video-segment-proxy internal error:', error);
    return jsonResponse({ error: 'Erro ao baixar o segmento.' }, 500);
  }
});