/**
 * Estratégias para extrair o JWT da sessão do snapgen.ai.
 *
 * Ordem:
 *   1. localStorage (Supabase Auth costuma usar `sb-<ref>-auth-token`)
 *   2. sessionStorage (mesmo)
 *   3. document.cookie (sem httpOnly)
 *   4. Network.getCookies via CDP (com httpOnly)
 */

import { decodeJwt, looksLikeJwt } from "./decodeJwt.ts";

export type Source = "localStorage" | "sessionStorage" | "cookie" | "cdp-cookie";

export interface ExtractedToken {
  token: string;
  expiresAt: number; // epoch ms (0 se não conseguiu inferir)
  source: Source;
  guardStableId?: string; // valor de localStorage.guard_stable_id, necessário para o x-guard-id
}

async function tryStorage(
  client: any,
  storageKind: "localStorage" | "sessionStorage",
): Promise<ExtractedToken | null> {
  const result = await client.Runtime.evaluate({
    expression: `
      (() => {
        const keys = Object.keys(${storageKind});
        const out = {};
        for (const k of keys) {
          try { out[k] = ${storageKind}.getItem(k); } catch (e) { out[k] = '[unreadable]'; }
        }
        return out;
      })()
    `,
    returnByValue: true,
  });
  const dump: Record<string, string> = result?.result?.value || {};
  if (!dump || Object.keys(dump).length === 0) return null;

  // 1) Chaves canônicas do Supabase Auth
  for (const [key, raw] of Object.entries(dump)) {
    if (!raw) continue;
    if (/^sb-.*-auth-token$/.test(key) || /supabase/i.test(key)) {
      const parsed = tryParseJson(raw);
      if (parsed) {
        const t = pickTokenFromObject(parsed);
        if (t) return { token: t, expiresAt: readExpiresAt(t, parsed), source: storageKind };
      }
    }
    if (/^(access_token|token|session|jwt|bw_auth)$/i.test(key)) {
      if (looksLikeJwt(raw)) {
        return { token: raw, expiresAt: readExpiresAt(raw, null), source: storageKind };
      }
      const parsed = tryParseJson(raw);
      if (parsed) {
        const t = pickTokenFromObject(parsed);
        if (t) return { token: t, expiresAt: readExpiresAt(t, parsed), source: storageKind };
      }
    }
  }
  // 2) Varredura profunda: parseia CADA valor do storage como JSON e procura JWT em qualquer campo
  for (const raw of Object.values(dump)) {
    if (typeof raw !== "string" || raw.length < 20) continue;
    if (looksLikeJwt(raw)) {
      return { token: raw, expiresAt: readExpiresAt(raw, null), source: storageKind };
    }
    const parsed = tryParseJson(raw);
    if (parsed) {
      const t = deepFindJwt(parsed);
      if (t) return { token: t, expiresAt: readExpiresAt(t, parsed), source: storageKind };
    }
  }
  return null;
}

async function tryDocumentCookie(client: any): Promise<ExtractedToken | null> {
  const r = await client.Runtime.evaluate({
    expression: "document.cookie || ''",
    returnByValue: true,
  });
  const cookieStr: string = r?.result?.value || "";
  if (!cookieStr) return null;
  const cookies = cookieStr.split(";").map((s) => {
    const [k, ...rest] = s.trim().split("=");
    return { name: k, value: decodeURIComponent(rest.join("=")) };
  });
  for (const c of cookies) {
    if (typeof c.value !== "string") continue;
    if (/^(access_token|bw_auth|token|jwt|supabase-token)$/i.test(c.name) && looksLikeJwt(c.value)) {
      return { token: c.value, expiresAt: readExpiresAt(c.value, null), source: "cookie" };
    }
    if (looksLikeJwt(c.value)) {
      return { token: c.value, expiresAt: readExpiresAt(c.value, null), source: "cookie" };
    }
  }
  return null;
}

async function tryCdpCookies(client: any, url: string): Promise<ExtractedToken | null> {
  try {
    const { cookies } = await client.Network.getCookies({ urls: [url] });
    if (!Array.isArray(cookies)) return null;
    for (const c of cookies) {
      if (typeof c.value === "string" && looksLikeJwt(c.value)) {
        return { token: c.value, expiresAt: readExpiresAt(c.value, null), source: "cdp-cookie" };
      }
    }
  } catch {
    // ignore
  }
  return null;
}

export async function extractToken(
  client: any,
  snapgenUrl: string,
): Promise<ExtractedToken | null> {
  let token: ExtractedToken | null = null;
  for (const fn of [
    () => tryStorage(client, "localStorage"),
    () => tryStorage(client, "sessionStorage"),
    () => tryDocumentCookie(client),
    () => tryCdpCookies(client, snapgenUrl),
  ]) {
    try {
      const r = await fn();
      if (r) { token = r; break; }
    } catch {
      // continua
    }
  }
  if (!token) return null;
  // Lê o guard_stable_id — é o que vincula o token ao guard gerado pela Edge.
  try {
    const r = await client.Runtime.evaluate({
      expression: "localStorage.getItem('guard_stable_id') || ''",
      returnByValue: true,
    });
    const v = (r?.result?.value || "").toString();
    if (v) token.guardStableId = v;
  } catch { /* ignore */ }
  return token;
}

function tryParseJson(raw: string): any {
  if (!raw) return null;
  if (raw[0] !== "{" && raw[0] !== "[") return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function pickTokenFromObject(obj: any): string | null {
  if (!obj || typeof obj !== "object") return null;
  const candidates = [obj.access_token, obj.token, obj.jwt, obj.session?.access_token];
  for (const c of candidates) {
    if (typeof c === "string" && looksLikeJwt(c)) return c;
  }
  return null;
}

/**
 * Procura recursivamente em um objeto/array por QUALQUER string que pareça JWT.
 * Usado como fallback quando o token está aninhado dentro de um JSON de store
 * (ex: snapgen.ai guarda em `authStore.access_token`).
 * Limite de profundidade e de nós visitados para não travar em estruturas cíclicas.
 */
function deepFindJwt(obj: any, depth = 0, seen: WeakSet<object> = new WeakSet()): string | null {
  if (depth > 6) return null;
  if (obj == null) return null;
  if (typeof obj === "string") {
    return looksLikeJwt(obj) ? obj : null;
  }
  if (typeof obj !== "object") return null;
  if (seen.has(obj)) return null;
  seen.add(obj);
  if (Array.isArray(obj)) {
    for (const v of obj) {
      const r = deepFindJwt(v, depth + 1, seen);
      if (r) return r;
    }
    return null;
  }
  // Ordem de preferência: campos com nome óbvio de token primeiro
  const priorityKeys = ["access_token", "token", "jwt", "idToken", "id_token"];
  for (const k of priorityKeys) {
    if (k in obj) {
      const r = deepFindJwt(obj[k], depth + 1, seen);
      if (r) return r;
    }
  }
  for (const v of Object.values(obj)) {
    const r = deepFindJwt(v, depth + 1, seen);
    if (r) return r;
  }
  return null;
}

function readExpiresAt(token: string, parsedJson: any): number {
  if (parsedJson && typeof parsedJson === "object") {
    if (typeof parsedJson.expires_at === "number") {
      const v = parsedJson.expires_at;
      return v > 1e12 ? v : v * 1000;
    }
    if (typeof parsedJson.expires_in === "number" && typeof parsedJson.issued_at === "number") {
      const issued = parsedJson.issued_at > 1e12 ? parsedJson.issued_at : parsedJson.issued_at * 1000;
      return issued + parsedJson.expires_in * 1000;
    }
  }
  const payload = decodeJwt(token);
  if (payload && typeof payload.exp === "number") {
    return payload.exp > 1e12 ? payload.exp : payload.exp * 1000;
  }
  return 0;
}
