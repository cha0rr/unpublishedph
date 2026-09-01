/**
 * Cliente compartilhado da SnapGen (https://api.snapgen.ai).
 *
 * O JWT é lido da tabela `app_secrets` no Supabase (campo `snapgen_access_token`).
 * O admin cola/renova o token manualmente em `/admin/snapgen` no app —
 * nada de email/senha guardados em secrets, nada de login programático.
 *
 * O token NUNCA é exposto ao frontend.
 */

export const SNAPGEN_BASE = "https://api.snapgen.ai";

/** Mensagem magic para detecção pelo frontend. */
export const SNAPGEN_TOKEN_MISSING = "nenhum token configurado";

interface CachedToken {
  token: string;
  /** epoch em ms — renovamos com 60s de folga (ou mais cedo se forceRefresh). */
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
/**
 * Fingerprint de DOM (32 bytes = 64 hex chars). O snapgen.ai envia um valor
 * específico do navegador do usuário, mas como a Edge Function não tem DOM,
 * usamos zeros. Se o servidor exigir valor real, a única solução é fazer o
 * frontend gerar esse fingerprint e mandar junto — mas o algoritmo exato
 * deles é desconhecido.
 */
const GUARD_DOM_FP = "0".repeat(64);

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

let cachedStableId: string | null = null;

/**
 * Define o stableId a ser usado pela Edge. Chamado por `getSnapgenToken()`
 * após ler `snapgen_guard_stable_id` do banco. Resetar o cache força o
 * `buildGuardId` a usar o novo valor.
 */
export function setGuardStableId(stableId: string | null): void {
  cachedStableId = stableId && stableId.length > 0 ? stableId : null;
}

async function getStableId(): Promise<string> {
  if (cachedStableId) return cachedStableId;
  // Fallback: gera um novo (não vai funcionar contra a API, mas evita crash).
  const rand = Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const raw = `${rand}.00000000.00000000`;
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
let readInFlight: Promise<CachedToken> | null = null;

/** Cliente Supabase com service_role, criado sob demanda. */
let adminClientPromise: Promise<any> | null = null;
function getAdminClient(): Promise<any> {
  if (!adminClientPromise) {
    adminClientPromise = import("https://esm.sh/@supabase/supabase-js@2").then(
      ({ createClient }) => {
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        if (!supabaseUrl || !serviceRoleKey) {
          throw new Error("SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY não configurados.");
        }
        return createClient(supabaseUrl, serviceRoleKey);
      },
    );
  }
  return adminClientPromise;
}

async function readSnapgenTokenFromDb(forceRefresh: boolean): Promise<CachedToken> {
  // Custo de uma query por invocação de edge function é aceitável; o cache
  // em memória da própria edge function reduz isso. Em ambiente com
  // invocações concorrentes, o `readInFlight` deduplica.
  const client = await getAdminClient();
  const [{ data: tokenRow }, { data: expRow }, { data: guardRow }] = await Promise.all([
    client.from("app_secrets").select("value").eq("key", "snapgen_access_token").maybeSingle(),
    client.from("app_secrets").select("value").eq("key", "snapgen_token_expires_at").maybeSingle(),
    client.from("app_secrets").select("value").eq("key", "snapgen_guard_stable_id").maybeSingle(),
  ]);
  const token = tokenRow?.value;
  if (!token) {
    throw new Error(
      `SnapGen: ${SNAPGEN_TOKEN_MISSING}. ` +
        `Acesse /admin/snapgen no app e cole o JWT extraído pela ferramenta local.`,
    );
  }
  const expRaw = Number(expRow?.value || 0);
  // O stableId do guard é vinculado ao token pelo servidor da snapgen.ai.
  // Sem ele, o guard gerado pela Edge tem um stableId random e a API
  // retorna "Invalid guard" / GUARD_NOT_PRESENTED.
  setGuardStableId(guardRow?.value || null);
  return {
    token,
    // Se o admin gravou exp em epoch ms, honramos; senão fallback de 5 min.
    expiresAt: expRaw > 0 ? expRaw - 60_000 : Date.now() + 5 * 60_000,
    // Suprime warning de variável não usada (forceRefresh pode ser útil
    // em versões futuras para bypassar cache externo, por ex. Redis).
    ...(forceRefresh ? { __force: true } : {}),
  } as CachedToken;
}

/** Retorna um JWT válido, reaproveitando o cache em memória. */
export async function getSnapgenToken(forceRefresh = false): Promise<string> {
  if (!forceRefresh && cached && cached.expiresAt > Date.now()) {
    return cached.token;
  }
  if (readInFlight) {
    const c = await readInFlight;
    return c.token;
  }
  cached = null;
  readInFlight = readSnapgenTokenFromDb(forceRefresh)
    .then((c) => {
      cached = c;
      return c;
    })
    .finally(() => {
      readInFlight = null;
    });
  return (await readInFlight).token;
}

/**
 * Faz uma requisição autenticada à SnapGen.
 *
 * Sem retry em 401: se o token estiver expirado, o admin precisa atualizar
 * em /admin/snapgen. Re-ler o mesmo token do banco não resolveria.
 */
export async function snapgenFetch(
  path: string,
  init: RequestInit & { body?: BodyInit | null } = {},
  bodyFactory?: () => BodyInit,
): Promise<Response> {
  const method = (init.method || "GET").toUpperCase();
  const token = await getSnapgenToken();
  const guardId = await buildGuardId(path, method);
  return await fetch(`${SNAPGEN_BASE}${path}`, {
    ...init,
    body: bodyFactory ? bodyFactory() : init.body,
    headers: {
      ...(init.headers as Record<string, string> | undefined),
      Authorization: `Bearer ${token}`,
      "x-guard-id": guardId,
    },
  });
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
