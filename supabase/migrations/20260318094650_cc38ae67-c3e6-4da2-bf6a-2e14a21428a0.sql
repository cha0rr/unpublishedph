
-- Fix tab_violations: constrain email to match JWT email
DROP POLICY IF EXISTS "Users can insert own violations" ON public.tab_violations;
CREATE POLICY "Users can insert own violations" ON public.tab_violations
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND email = (auth.jwt() ->> 'email')
  );
