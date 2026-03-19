
-- Allow DELETE on profiles for service_role (used by admin-delete-user edge function)
CREATE POLICY "Service role can delete profiles"
ON public.profiles
FOR DELETE
TO service_role
USING (true);

-- Allow DELETE on image_generations for service_role
CREATE POLICY "Service role can delete generations"
ON public.image_generations
FOR DELETE
TO service_role
USING (true);

-- Allow DELETE on tab_violations for service_role
CREATE POLICY "Service role can delete violations"
ON public.tab_violations
FOR DELETE
TO service_role
USING (true);

-- Allow DELETE on user_roles for service_role
CREATE POLICY "Service role can delete roles"
ON public.user_roles
FOR DELETE
TO service_role
USING (true);
