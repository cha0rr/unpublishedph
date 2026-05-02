-- 1) Tighten user_roles: only service_role may INSERT/UPDATE.
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;

CREATE POLICY "Service role can insert roles"
ON public.user_roles
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can update roles"
ON public.user_roles
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- 2) Allow users to read their own tab violations.
CREATE POLICY "Users can read own violations"
ON public.tab_violations
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 3) Revoke EXECUTE on internal trigger/event functions from public, anon, authenticated.
REVOKE ALL ON FUNCTION public.update_daily_limits_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enforce_image_generations_authoritative_fields() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
