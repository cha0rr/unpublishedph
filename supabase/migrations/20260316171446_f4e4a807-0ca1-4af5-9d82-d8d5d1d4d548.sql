CREATE TABLE public.tab_violations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.tab_violations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read violations" ON public.tab_violations
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can insert own violations" ON public.tab_violations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);