
-- Drop the permissive user update policy
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Create a restricted RPC that only allows updating safe columns
CREATE OR REPLACE FUNCTION public.update_own_profile(
  new_full_name text,
  new_whatsapp text,
  new_usage_type text,
  new_payment_method text
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE profiles
  SET full_name = new_full_name,
      whatsapp = new_whatsapp,
      usage_type = new_usage_type,
      payment_method = new_payment_method
  WHERE user_id = auth.uid();
$$;
