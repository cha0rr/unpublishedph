
CREATE TABLE public.system_prompts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  content text NOT NULL DEFAULT '',
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.system_prompts ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can select system_prompts"
  ON public.system_prompts FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert system_prompts"
  ON public.system_prompts FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update system_prompts"
  ON public.system_prompts FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete system_prompts"
  ON public.system_prompts FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Authenticated users can read (needed for edge function to fetch system prompt)
-- Edge function uses service_role, so this policy is for direct client reads if needed
CREATE POLICY "Authenticated users can read system_prompts"
  ON public.system_prompts FOR SELECT
  TO authenticated
  USING (true);
