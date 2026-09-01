/**
 * Decodifica o payload de um JWT sem validar a assinatura.
 * Devolve `null` se o token estiver malformado.
 */
export function decodeJwt(token: string): Record<string, unknown> | null {
  if (typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    const json =
      typeof atob === "function"
        ? atob(padded)
        : Buffer.from(padded, "base64").toString("utf8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function looksLikeJwt(s: string): boolean {
  if (typeof s !== "string") return false;
  if (s.length < 20) return false;
  if (s.split(".").length !== 3) return false;
  return decodeJwt(s) !== null;
}
