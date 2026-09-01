/**
 * Cliente compartilhado da SnapGen (https://api.snapgen.ai).
 *
 * A SnapGen autentica por Bearer JWT de conta. O token expira, então este
 * módulo faz login programático (email/senha guardados como secrets),
 * mantém o JWT em cache na memória da instância da edge function e o
 * renova automaticamente quando expira ou quando a API devolve 401.
 *
 * O token NUNCA é exposto ao frontend.
 */

export const SNAPGEN_BASE = "https://api.snapgen.ai";

interface CachedToken {
  token: string;
  /** epoch em ms — renovamos com 60s de folga */
  expiresAt: number;
}

let cached: CachedToken | null = null;

/** Decodifica o `exp` do JWT sem validar assinatura (só para cache). */
function readJwtExpiry(token: string): number {
  try {
    const payload = token.split(".")[1];
    if (!payload) return 0;
    const json = JSON.parse(
      atob(payload.replace(/-/g, "+").replace(/_/g, "/")),
    );
    return typeof json?.exp === "number" ? json.exp * 1000 : 0;
  } catch {
    return 0;
  }
}

async function login(): Promise<string> {
  const email = Deno.env.get("SNAPGEN_EMAIL");
  const password = Deno.env.get("SNAPGEN_PASSWORD");
  if (!email || !password) {
    throw new Error("SNAPGEN_EMAIL/SNAPGEN_PASSWORD não configurados.");
  }

  const form = new FormData();
  form.append("username", email);
  form.append("password", password);

  const res = await fetch(`${SNAPGEN_BASE}/api/login`, {
    method: "POST",
    body: form,
  });

  const data = await res.json().catch(() => ({} as any));

  if (!res.ok) {
    const msg = typeof data?.detail === "string"
      ? data.detail
      : data?.detail?.error_message || `HTTP ${res.status}`;
    throw new Error(`Falha ao autenticar na SnapGen: ${msg}`);
  }

  const token: string | undefined = data?.access_token || data?.token ||
    data?.data?.access_token || data?.session?.access_token;

  if (!token) {
    throw new Error("SnapGen não retornou access_token no login.");
  }

  const exp = readJwtExpiry(token);
  cached = {
    token,
    // fallback: 30 minutos se o JWT não trouxer exp legível
    expiresAt: exp > 0 ? exp - 60_000 : Date.now() + 30 * 60_000,
  };

  return token;
}

/** Retorna um JWT válido, reaproveitando o cache quando possível. */
export async function getSnapgenToken(forceRefresh = false): Promise<string> {
  if (!forceRefresh && cached && cached.expiresAt > Date.now()) {
    return cached.token;
  }
  cached = null;
  return await login();
}

/**
 * Faz uma requisição autenticada à SnapGen, renovando o token
 * automaticamente uma única vez em caso de 401.
 */
export async function snapgenFetch(
  path: string,
  init: RequestInit & { body?: BodyInit | null } = {},
  bodyFactory?: () => BodyInit,
): Promise<Response> {
  const doFetch = async (token: string) => {
    return await fetch(`${SNAPGEN_BASE}${path}`, {
      ...init,
      // FormData só pode ser consumida uma vez: recriamos na retentativa.
      body: bodyFactory ? bodyFactory() : init.body,
      headers: {
        ...(init.headers as Record<string, string> | undefined),
        Authorization: `Bearer ${token}`,
      },
    });
  };

  let res = await doFetch(await getSnapgenToken());
  if (res.status === 401) {
    res = await doFetch(await getSnapgenToken(true));
  }
  return res;
}

/**
 * Corrige URLs de mídia que às vezes vêm prefixadas com um host S3 inválido,
 * o que quebra a assinatura AWS (SignatureDoesNotMatch).
 */
export function normalizeMediaUrl(
  url: string | null | undefined,
): string | null {
  if (!url || typeof url !== "string") return url ?? null;
  const idx = url.indexOf("https://", 8);
  if (idx > 0) return url.slice(idx);
  const httpIdx = url.indexOf("http://", 8);
  if (httpIdx > 0) return url.slice(httpIdx);
  return url;
}
