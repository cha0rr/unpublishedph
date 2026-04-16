import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const MAX_PROMPT_LENGTH = 4000;
const ALLOWED_IMAGE_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);
const MIME_TYPE_TO_EXTENSION: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};

type ReferencePayload =
  | string
  | {
      data?: string;
      mimeType?: string;
      mime_type?: string;
      fileName?: string;
      file_name?: string;
    };

function inferMimeTypeFromBase64(base64: string): string {
  const cleaned = base64.trim().replace(/^data:[^;]+;base64,/, '');

  if (cleaned.startsWith('iVBORw0KGgo')) return 'image/png';
  if (cleaned.startsWith('/9j/')) return 'image/jpeg';
  if (cleaned.startsWith('UklGR')) return 'image/webp';

  return 'image/png';
}

function sanitizeMimeType(mimeType: string | undefined, fallbackBase64: string): string {
  const normalized = mimeType?.trim().toLowerCase();
  if (normalized && ALLOWED_IMAGE_MIME_TYPES.has(normalized)) {
    return normalized;
  }

  return inferMimeTypeFromBase64(fallbackBase64);
}

function buildReferenceFileName(index: number, mimeType: string, fileName?: string): string {
  const safeName = fileName?.trim().replace(/[^a-zA-Z0-9._-]/g, '_');

  if (safeName && safeName.includes('.')) {
    return safeName;
  }

  const extension = MIME_TYPE_TO_EXTENSION[mimeType] ?? 'png';
  return safeName ? `${safeName}.${extension}` : `reference_${index + 1}.${extension}`;
}

function normalizeReferencePrompt(prompt: string, hasReferences: boolean): string {
  if (!hasReferences) return prompt;

  const normalizedPrompt = prompt
    .replace(/\[(?:image|imagem)\s*(\d+)\]/gi, '[Imagem $1]')
    .replace(/(?<!\[)\b(?:image|imagem)\s*(\d+)\b(?!\])/gi, '[Imagem $1]');

  const guidance = /\[Imagem\s+\d+\]/i.test(normalizedPrompt)
    ? 'Use cada [Imagem N] anexada como referência visual fiel correspondente, preservando identidade, rosto, cabelo, proporções e características principais, alterando apenas o que o prompt pedir.'
    : 'Use as imagens anexadas como referência visual fiel, preservando identidade, rosto, cabelo, proporções e características principais, alterando apenas o que o prompt pedir.';

  return `${guidance}\n\n${normalizedPrompt}`.trim();
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
    const userEmail = user.email as string;

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

    if (!isAdmin && profile?.plan !== 'pro') {
      return new Response(JSON.stringify({ error: 'Recurso exclusivo do Plano Pro. Faça upgrade para acessar a geração de imagens.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // --- Daily limit check (30 image generations/day for non-admins) ---
    if (!isAdmin) {
      const today = new Date(); today.setUTCHours(0, 0, 0, 0);
      const { count } = await adminClient
        .from('image_generations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', today.toISOString())
        .in('model', ['nano-banana-2', 'nano-banana-pro']);
      if ((count ?? 0) >= 30) {
        return new Response(JSON.stringify({ error: 'Limite diário de 30 gerações de imagem atingido.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const body = await req.json();
    const { prompt, model, aspect_ratio, resolution, output_format, style, ref_history, file_urls, file_base64 } = body;

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt é obrigatório.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const hasReferenceImages =
      (Array.isArray(file_base64) && file_base64.length > 0) ||
      (Array.isArray(file_urls) && file_urls.length > 0);

    // --- Prompt sanitization ---
    const sanitizedPrompt = String(prompt).substring(0, MAX_PROMPT_LENGTH).trim();

    const allowedModels = ['nano-banana-2', 'nano-banana-pro'];
    if (!model || !allowedModels.includes(model)) {
      return new Response(JSON.stringify({ error: 'Modelo inválido. Use nano-banana-2 ou nano-banana-pro.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userRole = isAdmin ? 'admin' : 'user';

    const formData = new FormData();

    let finalPrompt = normalizeReferencePrompt(sanitizedPrompt, hasReferenceImages);
    if (style && style !== 'auto') {
      finalPrompt = `[Style: ${style}] ${finalPrompt}`;
    }

    formData.append('prompt', finalPrompt);
    formData.append('model', model);
    if (aspect_ratio) formData.append('aspect_ratio', aspect_ratio);
    if (resolution && resolution.trim() && resolution !== 'auto') formData.append('resolution', resolution);
    if (output_format) formData.append('output_format', output_format);
    if (style && style !== 'auto') formData.append('style', style);
    if (ref_history) formData.append('ref_history', ref_history);

    // Handle base64 images sent directly from client
    if (file_base64 && Array.isArray(file_base64)) {
      for (let i = 0; i < file_base64.length; i++) {
        const reference = file_base64[i] as ReferencePayload;
        const rawBase64 = typeof reference === 'string' ? reference : reference?.data;

        if (rawBase64 && typeof rawBase64 === 'string' && rawBase64.trim()) {
          try {
            const cleanedBase64 = rawBase64.trim().replace(/^data:[^;]+;base64,/, '');
            const mimeType = sanitizeMimeType(
              typeof reference === 'string' ? undefined : reference.mimeType ?? reference.mime_type,
              cleanedBase64,
            );
            const fileName = buildReferenceFileName(
              i,
              mimeType,
              typeof reference === 'string' ? undefined : reference.fileName ?? reference.file_name,
            );

            const binaryStr = atob(cleanedBase64);
            const bytes = new Uint8Array(binaryStr.length);
            for (let j = 0; j < binaryStr.length; j++) {
              bytes[j] = binaryStr.charCodeAt(j);
            }
            const blob = new Blob([bytes], { type: mimeType });
            formData.append('files', blob, fileName);
          } catch (e) {
            console.error('Error decoding base64 image:', e);
          }
        }
      }
    }

    // Fallback: Download file_urls and attach as multipart 'files'
    if (file_urls && Array.isArray(file_urls)) {
      for (const url of file_urls) {
        if (url && typeof url === 'string' && url.trim()) {
          try {
            const fileRes = await fetch(url.trim());
            if (fileRes.ok) {
              const blob = await fileRes.blob();
              const fileName = url.trim().split('/').pop() || 'reference.png';
              formData.append('files', blob, fileName);
            }
          } catch {
            // skip failed downloads
          }
        }
      }
    }

    const apiUrl = 'https://api.geminigen.ai/uapi/v1/generate_image';

    const apiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'x-api-key': geminigenKey,
      },
      body: formData,
    });

    const responseData = await apiResponse.json();

    if (!apiResponse.ok) {
      console.error('GeminiGen API error:', JSON.stringify(responseData));

      // Extract real error message from API response
      const apiMsg = responseData?.message || responseData?.error || responseData?.detail || '';
      const errorCode = responseData?.error_code || '';

      // Detect policy violations
      const policyViolation =
        errorCode.includes('PUBLIC_ERROR_SEXUAL') ||
        apiMsg.toLowerCase().includes('policy') ||
        apiMsg.toLowerCase().includes('copyright') ||
        apiMsg.toLowerCase().includes('violat');

      const friendlyError = policyViolation
        ? 'Reescreva seu prompt, pois contém palavras impróprias ou material de terceiros.'
        : apiMsg
          ? `Erro na API: ${apiMsg}`
          : `Erro na API GeminiGen (código ${apiResponse.status}). Tente novamente.`;

      return new Response(JSON.stringify({ error: friendlyError, details: responseData }), {
        status: apiResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const generationUuid = responseData.uuid;

    await adminClient.from('image_generations').insert({
      user_id: userId,
      email: userEmail,
      role: userRole,
      plan: profile?.plan || null,
      model,
      prompt: sanitizedPrompt,
      uuid: generationUuid,
      status: 'pending',
      request_payload: body,
      response_payload: responseData,
    });

    return new Response(JSON.stringify({ uuid: generationUuid, ...responseData }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno.';

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
