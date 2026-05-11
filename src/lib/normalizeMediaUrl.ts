/**
 * GeminiGen sometimes returns URLs like:
 *   https://s3.us-east-1.idrivee2.com/https://edge-files.geminigen.ai/...
 * The S3 host is bogus and breaks the signature (SignatureDoesNotMatch).
 * Strip everything before the second "https://" so the signed URL works.
 */
export function normalizeMediaUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== "string") return url ?? null;
  const idx = url.indexOf("https://", 8);
  if (idx > 0) return url.slice(idx);
  const httpIdx = url.indexOf("http://", 8);
  if (httpIdx > 0) return url.slice(httpIdx);
  return url;
}
