ALTER TABLE public.image_generations
  ADD COLUMN IF NOT EXISTS aspect_ratio text,
  ADD COLUMN IF NOT EXISTS resolution text,
  ADD COLUMN IF NOT EXISTS style text,
  ADD COLUMN IF NOT EXISTS output_format text,
  ADD COLUMN IF NOT EXISTS provider text DEFAULT 'geminigen',
  ADD COLUMN IF NOT EXISTS thumbnail_small text,
  ADD COLUMN IF NOT EXISTS file_size bigint,
  ADD COLUMN IF NOT EXISTS error_code text,
  ADD COLUMN IF NOT EXISTS error_message text;