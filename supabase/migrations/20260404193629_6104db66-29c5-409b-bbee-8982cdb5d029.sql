-- Remove the overly permissive SELECT policy on system_prompts
DROP POLICY IF EXISTS "Authenticated users can read system_prompts" ON public.system_prompts;