-- Create daily_limits table for admin-configurable generation limits
CREATE TABLE public.daily_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  limit_value integer NOT NULL DEFAULT 30,
  enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.daily_limits ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can read (needed for UI counters)
CREATE POLICY "Authenticated can read daily_limits"
ON public.daily_limits FOR SELECT
TO authenticated
USING (true);

-- Only admins can insert
CREATE POLICY "Admins can insert daily_limits"
ON public.daily_limits FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Only admins can update
CREATE POLICY "Admins can update daily_limits"
ON public.daily_limits FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Only admins can delete
CREATE POLICY "Admins can delete daily_limits"
ON public.daily_limits FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_daily_limits_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_daily_limits_updated_at
BEFORE UPDATE ON public.daily_limits
FOR EACH ROW EXECUTE FUNCTION public.update_daily_limits_updated_at();

-- Seed initial limits
INSERT INTO public.daily_limits (key, limit_value, enabled) VALUES
  ('video_basico', 30, true),
  ('video_pro', 30, true),
  ('image_basico', 30, true),
  ('image_pro', 30, true)
ON CONFLICT (key) DO NOTHING;