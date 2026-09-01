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

/* ------------------------------------------------------------------ *
 * Antibot guard (x-guard-id)
 *
 * A SnapGen rejeita requisições sem o header `x-guard-id` com
 * `GUARD_NOT_PRESENTED`. O token é derivado de:
 *   stableId + timeBucket (janela de 60s) + fingerprint de DOM + segredos
 * públicos do frontend. Reproduzimos o mesmo algoritmo aqui.
 * ------------------------------------------------------------------ */

const GUARD_SALT = "&vTQm0&u";
const GUARD_KEY = "45NPBH$&";
const GUARD_VERSION = 1;
const GUARD_ID_LENGTH = 22;
const GUARD_BUCKET_MS = 60_000;
/** Sem DOM no servidor, o frontend também usa este valor padrão. */
const GUARD_DOM_FP = "0".repeat(32);

function b64url(input: string): string {
  return btoa(input).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function b64urlBytes(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return b64url(bin);
}

async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(text),
  );
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBytes(hex: string): number[] {
  const out: number[] = [];
  for (let i = 0; i < hex.length; i += 2) out.push(parseInt(hex.substr(i, 2), 16));
  return out;
}

function cheapHash(text: string): string {
  let h = 0;
  for (let i = 0; i < text.length; i++) {
    h = (h << 5) - h + text.charCodeAt(i);
    h = h & h;
  }
  return Math.abs(h).toString(16).padStart(8, "0");
}

let cachedStableId: string | null = null;

async function getStableId(): Promise<string> {
  if (cachedStableId) return cachedStableId;
  const rand = Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const raw = `${rand}.${cheapHash("unknown")}.${cheapHash("0x0")}`;
  const hashed = await sha256Hex(`${GUARD_SALT}:${raw}`);
  cachedStableId = b64url(hashed).slice(0, GUARD_ID_LENGTH);
  return cachedStableId;
}

/** Gera o valor do header `x-guard-id` para um path/método. */
export async function buildGuardId(path: string, method: string): Promise<string> {
  const stableId = await getStableId();
  const timeBucket = Math.floor(Date.now() / GUARD_BUCKET_MS);
  const derivedId = (await sha256Hex(`${GUARD_KEY}:${stableId}`)).slice(0, 32);
  const signature = await sha256Hex(
    `${path}:${method.toUpperCase()}:${derivedId}:${timeBucket}:${GUARD_KEY}`,
  );
  const bytes = [
    GUARD_VERSION,
    ...hexToBytes(derivedId),
    (timeBucket >>> 24) & 255,
    (timeBucket >>> 16) & 255,
    (timeBucket >>> 8) & 255,
    timeBucket & 255,
    ...hexToBytes(signature),
    ...hexToBytes(GUARD_DOM_FP),
  ];
  return b64urlBytes(new Uint8Array(bytes));
}

let cached: CachedToken | null = null;
let loginInFlight: Promise<string> | null = null;

interface SnapgenLoginErrorDetail {
  error_code?: string;
  error_message?: string;
}

interface SnapgenLoginResponse {
  access_token?: string;
  refresh_token?: string;
  detail?: string | SnapgenLoginErrorDetail;
}

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

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15_000);

  // O frontend oficial da SnapGen usa login-v2 com corpo JSON. O endpoint
  // legado /api/login devolve "Not found" mesmo para contas válidas.
  const res = await fetch(`${SNAPGEN_BASE}/api/login-v2`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-guard-id": await buildGuardId("/api/login-v2", "POST"),
    },
    body: JSON.stringify({ username: email, password }),
    signal: controller.signal,
  }).finally(() => clearTimeout(timeoutId));

  const data: SnapgenLoginResponse = await res.json().catch(() => ({}));

  if (!res.ok) {
    const raw = typeof data.detail === "string"
      ? data.detail
      : data.detail?.error_message || `HTTP ${res.status}`;
    const errorCode = typeof data.detail === "object"
      ? data.detail?.error_code
      : undefined;
    const msg = errorCode === "SIGNIN_WRONG_EMAIL_PASSWORD" ||
        /not found|password is not correct/i.test(raw)
      ? "e-mail ou senha inválidos; atualize SNAPGEN_EMAIL e SNAPGEN_PASSWORD com os dados de uma conta SnapGen que possua senha"
      : raw;
    throw new Error(`Falha ao autenticar na SnapGen: ${msg}`);
  }

  const token = data.access_token;

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

  if (loginInFlight) {
    return await loginInFlight;
  }

  cached = null;
  loginInFlight = login();
  try {
    return await loginInFlight;
  } finally {
    loginInFlight = null;
  }
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
  const method = (init.method || "GET").toUpperCase();
  const doFetch = async (token: string) => {
    const guardId = await buildGuardId(path, method);
    return await fetch(`${SNAPGEN_BASE}${path}`, {
      ...init,
      // FormData só pode ser consumida uma vez: recriamos na retentativa.
      body: bodyFactory ? bodyFactory() : init.body,
      headers: {
        ...(init.headers as Record<string, string> | undefined),
        Authorization: `Bearer ${token}`,
        "x-guard-id": guardId,
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
