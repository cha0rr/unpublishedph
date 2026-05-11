-- Strip bogus "https://s3.us-east-1.idrivee2.com/" prefix that GeminiGen
-- sometimes prepends to signed media URLs (causes SignatureDoesNotMatch).
UPDATE public.image_generations
SET image_url = substring(image_url FROM position('https://' IN substring(image_url FROM 9)) + 8)
WHERE image_url LIKE 'https://%/https://%';
