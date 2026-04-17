import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN PUBLIC KEY-----/, '')
    .replace(/-----END PUBLIC KEY-----/, '')
    .replace(/\s/g, '');
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function importPublicKey(pem: string): Promise<CryptoKey> {
  const keyData = pemToArrayBuffer(pem);
  return crypto.subtle.importKey(
    'spki',
    keyData,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify'],
  );
}

function hexToUint8Array(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

// MD5 implementation compatible with Deno (crypto.subtle doesn't support MD5)
function md5(data: Uint8Array): Uint8Array {
  function toWordArray(bytes: Uint8Array): number[] {
    const words: number[] = [];
    for (let i = 0; i < bytes.length; i += 4) {
      words.push(
        (bytes[i] || 0) |
        ((bytes[i + 1] || 0) << 8) |
        ((bytes[i + 2] || 0) << 16) |
        ((bytes[i + 3] || 0) << 24)
      );
    }
    return words;
  }

  const originalLength = data.length;
  // Padding
  const paddedLength = ((originalLength + 8) >>> 6 << 6) + 64;
  const padded = new Uint8Array(paddedLength);
  padded.set(data);
  padded[originalLength] = 0x80;
  // Length in bits as 64-bit LE
  const bitLen = originalLength * 8;
  padded[paddedLength - 8] = bitLen & 0xff;
  padded[paddedLength - 7] = (bitLen >>> 8) & 0xff;
  padded[paddedLength - 6] = (bitLen >>> 16) & 0xff;
  padded[paddedLength - 5] = (bitLen >>> 24) & 0xff;

  const words = toWordArray(padded);

  const S = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
  ];

  const K = new Array(64);
  for (let i = 0; i < 64; i++) {
    K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 0x100000000) >>> 0;
  }

  let a0 = 0x67452301 >>> 0;
  let b0 = 0xefcdab89 >>> 0;
  let c0 = 0x98badcfe >>> 0;
  let d0 = 0x10325476 >>> 0;

  for (let chunk = 0; chunk < words.length; chunk += 16) {
    let A = a0, B = b0, C = c0, D = d0;

    for (let i = 0; i < 64; i++) {
      let F: number, g: number;
      if (i < 16) {
        F = (B & C) | ((~B >>> 0) & D);
        g = i;
      } else if (i < 32) {
        F = (D & B) | ((~D >>> 0) & C);
        g = (5 * i + 1) % 16;
      } else if (i < 48) {
        F = B ^ C ^ D;
        g = (3 * i + 5) % 16;
      } else {
        F = C ^ (B | (~D >>> 0));
        g = (7 * i) % 16;
      }

      F = (F + A + K[i] + words[chunk + g]) >>> 0;
      A = D;
      D = C;
      C = B;
      B = (B + ((F << S[i]) | (F >>> (32 - S[i])))) >>> 0;
    }

    a0 = (a0 + A) >>> 0;
    b0 = (b0 + B) >>> 0;
    c0 = (c0 + C) >>> 0;
    d0 = (d0 + D) >>> 0;
  }

  const result = new Uint8Array(16);
  [a0, b0, c0, d0].forEach((val, idx) => {
    result[idx * 4] = val & 0xff;
    result[idx * 4 + 1] = (val >>> 8) & 0xff;
    result[idx * 4 + 2] = (val >>> 16) & 0xff;
    result[idx * 4 + 3] = (val >>> 24) & 0xff;
  });
  return result;
}

function md5Hex(data: string): string {
  const encoded = new TextEncoder().encode(data);
  const hash = md5(encoded);
  return Array.from(hash).map(b => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-signature');

    if (!signature) {
      console.warn('Webhook rejected: missing x-signature header');
      return new Response(JSON.stringify({ error: 'Missing signature' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const publicKeyPem = Deno.env.get('GEMINIGEN_PUBLIC_KEY_PEM');
    if (!publicKeyPem) {
      console.error('GEMINIGEN_PUBLIC_KEY_PEM not configured');
      return new Response(JSON.stringify({ error: 'Server misconfiguration' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const publicKey = await importPublicKey(publicKeyPem);

    // Step 1: MD5 hash of raw body (hex string) — now using pure JS implementation
    const bodyMd5HexStr = md5Hex(rawBody);

    // Step 2: Decode hex-encoded signature
    const sigBytes = hexToUint8Array(signature);

    // Step 3: Verify signature against the MD5 hash
    const md5Bytes = new TextEncoder().encode(bodyMd5HexStr);
    const valid = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      publicKey,
      sigBytes,
      md5Bytes,
    );

    if (!valid) {
      console.warn('Webhook rejected: invalid signature');
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Signature valid — process payload
    let data: Record<string, unknown> = {};
    try {
      data = JSON.parse(rawBody);
    } catch {
      data = { raw: rawBody };
    }

    console.log('Webhook verified — event:', data.event, '| uuid:', data.uuid, '| status:', data.status);

    // --- Update image_generations in the database ---
    const uuid = data.uuid as string | undefined;
    if (uuid) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const adminClient = createClient(supabaseUrl, serviceRoleKey);

      const updatePayload: Record<string, unknown> = {
        response_payload: data,
        updated_at: new Date().toISOString(),
      };

      const status = Number(data.status);
      if (status === 2) updatePayload.status = 'completed';
      else if (status === 3) updatePayload.status = 'failed';
      else if (status === 1) updatePayload.status = 'processing';

      if (data.status_percentage !== undefined) {
        updatePayload.status_percentage = Number(data.status_percentage);
      }

      // Extract video/image URL
      let resultUrl: string | undefined;
      if (data.generate_result) resultUrl = data.generate_result as string;
      if (!resultUrl && Array.isArray(data.generated_video) && data.generated_video.length > 0) {
        const vid = data.generated_video[0] as Record<string, unknown>;
        resultUrl = (vid.video_url || vid.file_download_url) as string;
      }
      if (!resultUrl && Array.isArray(data.generated_image) && data.generated_image.length > 0) {
        const img = data.generated_image[0] as Record<string, unknown>;
        resultUrl = (img.image_url || img.file_download_url) as string;
      }
      if (resultUrl) updatePayload.image_url = resultUrl;

      // Credits
      if (data.used_credit !== undefined) updatePayload.used_credit = data.used_credit;
      if (data.estimated_credit !== undefined) updatePayload.estimated_credit = data.estimated_credit;
      if (data.ai_credit !== undefined) updatePayload.ai_credit = data.ai_credit;

      // Errors
      if (data.error_code !== undefined) updatePayload.error_code = String(data.error_code);
      if (data.error_message !== undefined) updatePayload.error_message = data.error_message;

      const { error: dbError } = await adminClient
        .from('image_generations')
        .update(updatePayload)
        .eq('uuid', uuid);

      if (dbError) {
        console.error('Webhook DB update error:', dbError.message);
      } else {
        console.log('Webhook updated image_generations for uuid:', uuid, '| new status:', updatePayload.status);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('geminigen-webhook internal error:', error);
    return new Response(JSON.stringify({ error: 'Erro interno ao processar webhook.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
