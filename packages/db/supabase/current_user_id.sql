-- Supabase override: current_user_id() wraps auth.uid()
-- This replaces the portable version from the migration.

CREATE OR REPLACE FUNCTION app.current_user_id()
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  SELECT auth.uid()::text;
$$;
