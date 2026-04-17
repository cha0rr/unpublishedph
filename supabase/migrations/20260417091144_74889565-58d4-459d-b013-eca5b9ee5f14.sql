-- Trigger function to enforce authoritative values on image_generations inserts
CREATE OR REPLACE FUNCTION public.enforce_image_generations_authoritative_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  auth_email text;
  is_admin boolean;
  user_plan text;
BEGIN
  -- Get email from auth.users (authoritative source)
  SELECT email INTO auth_email FROM auth.users WHERE id = NEW.user_id;

  -- Determine role from user_roles table
  is_admin := public.has_role(NEW.user_id, 'admin'::app_role);

  -- Get plan from profiles
  SELECT plan INTO user_plan FROM public.profiles WHERE user_id = NEW.user_id;

  -- Override client-provided values with authoritative ones
  NEW.email := COALESCE(auth_email, NEW.email);
  NEW.role := CASE WHEN is_admin THEN 'admin' ELSE 'user' END;
  NEW.plan := user_plan;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_image_generations_fields ON public.image_generations;

CREATE TRIGGER enforce_image_generations_fields
BEFORE INSERT ON public.image_generations
FOR EACH ROW
EXECUTE FUNCTION public.enforce_image_generations_authoritative_fields();