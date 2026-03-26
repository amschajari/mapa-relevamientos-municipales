-- Drop existing policies if they exist
DROP POLICY IF EXISTS "enable_read_for_authenticated_users" ON app_config;
DROP POLICY IF EXISTS "enable_admin_modify" ON app_config;
DROP POLICY IF EXISTS "enable_read_for_all" ON app_config;
DROP POLICY IF EXISTS "enable_insert_for_admin" ON app_config;
DROP POLICY IF EXISTS "enable_update_for_admin" ON app_config;
DROP POLICY IF EXISTS "enable_delete_for_admin" ON app_config;

-- Enable RLS
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

-- Recreate policies with correct syntax
CREATE POLICY "enable_read_for_all"
ON app_config FOR SELECT
USING (true);

-- Política de INSERT: verificar si es admin usando email específico
CREATE POLICY "enable_insert_for_admin"
ON app_config FOR INSERT
WITH CHECK (
  auth.uid() IN (SELECT id FROM auth.users WHERE email = 'a.m.saposnik@gmail.com')
);

-- Política de UPDATE: verificar si es admin usando email específico
CREATE POLICY "enable_update_for_admin"
ON app_config FOR UPDATE
USING (
  auth.uid() IN (SELECT id FROM auth.users WHERE email = 'a.m.saposnik@gmail.com')
)
WITH CHECK (
  auth.uid() IN (SELECT id FROM auth.users WHERE email = 'a.m.saposnik@gmail.com')
);

-- Política de DELETE: verificar si es admin usando email específico
CREATE POLICY "enable_delete_for_admin"
ON app_config FOR DELETE
USING (
  auth.uid() IN (SELECT id FROM auth.users WHERE email = 'a.m.saposnik@gmail.com')
);
