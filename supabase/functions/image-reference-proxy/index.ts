import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const ALLOWED_HOST_SUFFIXES = ['.r2.cloudflarestorage.com', '.geminigen.ai'];

function jsonResponse(body: Record<string, string>, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function isAllowedImageUrl(urlString: string) {
  try {
    const url = new URL(urlString);
    const host = url.hostname.toLowerCase();
    const allowedHost = ALLOWED_HOST_SUFFIXES.some(
      (suffix) => host === suffix.slice(1) || host.endsWith(suffix),
    );
    return url.protocol === 'https:' && allowedHost;
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
      return jsonResponse({ error: 'Acesso restrito.' }, 403);
    }

    const { url } = await req.json();
    if (typeof url !== 'string' || !isAllowedImageUrl(url)) {
      return jsonResponse({ error: 'URL de imagem inválida.' }, 400);
    }

    const upstream = await fetch(url);
    if (!upstream.ok || !upstream.body) {
      return jsonResponse({ error: `Falha ao baixar imagem (HTTP ${upstream.status}).` }, 502);
    }

    const upstreamType = (upstream.headers.get('Content-Type') || '').toLowerCase();

    // Reject obvious error pages
    if (upstreamType.startsWith('text/') || upstreamType.includes('application/json')) {
      return jsonResponse({ error: 'Conteúdo remoto não é uma imagem.' }, 415);
    }

    // Infer MIME from URL extension when upstream is generic (octet-stream, empty, etc.)
    const inferFromExt = (u: string) => {
      const path = new URL(u).pathname.toLowerCase();
      if (path.endsWith('.png')) return 'image/png';
      if (path.endsWith('.jpg') || path.endsWith('.jpeg')) return 'image/jpeg';
      if (path.endsWith('.webp')) return 'image/webp';
      if (path.endsWith('.gif')) return 'image/gif';
      return 'image/png';
    };
    const contentType = upstreamType.startsWith('image/') ? upstreamType : inferFromExt(url);

    const headers = new Headers(corsHeaders);
    headers.set('Content-Type', contentType);
    const contentLength = upstream.headers.get('Content-Length');
    if (contentLength) headers.set('Content-Length', contentLength);
    headers.set('Cache-Control', 'private, max-age=120');

    return new Response(upstream.body, { status: 200, headers });
  } catch (error) {
    console.error('image-reference-proxy error:', error);
    return jsonResponse({ error: 'Erro ao baixar a imagem.' }, 500);
  }
});