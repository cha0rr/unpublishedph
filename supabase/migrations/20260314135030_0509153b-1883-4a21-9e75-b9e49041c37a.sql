CREATE TABLE public.image_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL,
  plan text,
  model text NOT NULL,
  prompt text NOT NULL,
  uuid text,
  status text DEFAULT 'pending',
  status_percentage integer DEFAULT 0,
  image_url text,
  used_credit numeric DEFAULT 0,
  estimated_credit numeric DEFAULT 0,
  ai_credit numeric DEFAULT 0,
  request_payload jsonb,
  response_payload jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE POLICY "Users can read own generations"
  ON public.image_generations FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all generations"
  ON public.image_generations FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service can insert generations"
  ON public.image_generations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own generations"
  ON public.image_generations FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can update all generations"
  ON public.image_generations FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));