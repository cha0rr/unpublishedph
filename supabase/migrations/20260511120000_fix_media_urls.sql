-- Strip bogus "https://<s3-host>/" prefix that GeminiGen sometimes prepends to
-- signed media URLs (causes SignatureDoesNotMatch on download/preview).
UPDATE public.image_generations
SET image_url = regexp_replace(image_url, '^https?://[^/]+/(https?://)', '\1')
WHERE image_url ~ '^https?://[^/]+/https?://';
