-- Bootstrap trigger: create a profiles row when a new auth user signs up.
-- app_role defaults to 'customer', active_mode to 'buyer'.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, full_name, app_role, active_mode, created_at, updated_at)
  VALUES (
    NEW.id::text,
    coalesce(NEW.raw_user_meta_data ->> 'full_name', ''),
    'customer',
    'buyer',
    now(),
    now()
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
