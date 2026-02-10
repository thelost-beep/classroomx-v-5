-- ClassroomX 100% PERFECT ADMIN FIX
-- Run this script to fix ALL Admin Panel issues (Users & Reports)

-- 1. FIX REPORTS TABLE (Add missing column and policy)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reports' AND column_name='resolved_at') THEN
        ALTER TABLE reports ADD COLUMN resolved_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

DROP POLICY IF EXISTS "Admins can update reports" ON reports;
CREATE POLICY "Admins can update reports"
  ON reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 2. DROP OLD FUNCTIONS FIRST (Clean Slate)
DROP FUNCTION IF EXISTS get_all_users() CASCADE;
DROP FUNCTION IF EXISTS admin_create_profile(TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS admin_update_user_role(UUID, TEXT) CASCADE;

-- 2. CREATE PERFECT USER FETCHING
CREATE OR REPLACE FUNCTION get_all_users()
RETURNS TABLE (
    id UUID,
    email TEXT,
    name TEXT,
    role TEXT,
    avatar_url TEXT,
    is_profile_complete BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Check if calling user is admin
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin') THEN
        RAISE EXCEPTION 'Access denied. Admin role required.';
    END IF;

    RETURN QUERY
    SELECT 
        p.id,
        u.email::TEXT,
        p.name,
        p.role,
        p.avatar_url,
        p.is_profile_complete,
        p.created_at,
        p.updated_at
    FROM profiles p
    JOIN auth.users u ON p.id = u.id
    ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 3. CREATE PERFECT ROLE UPDATE
CREATE OR REPLACE FUNCTION admin_update_user_role(target_user_id UUID, new_role TEXT)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin') THEN
        RAISE EXCEPTION 'Access denied. Admin role required.';
    END IF;

    UPDATE profiles
    SET role = new_role,
        updated_at = NOW()
    WHERE id = target_user_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 4. CREATE PERFECT USER CREATION/FIX
CREATE OR REPLACE FUNCTION admin_create_profile(user_email TEXT, user_name TEXT, user_role TEXT)
RETURNS UUID
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_user_id UUID;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin') THEN
        RAISE EXCEPTION 'Access denied. Admin role required.';
    END IF;

    SELECT auth.users.id INTO new_user_id FROM auth.users WHERE auth.users.email = user_email;

    IF new_user_id IS NOT NULL THEN
        INSERT INTO profiles (id, name, role, email, is_profile_complete)
        VALUES (new_user_id, user_name, user_role, user_email, true)
        ON CONFLICT (id) DO UPDATE
        SET name = user_name,
            role = user_role,
            email = user_email,
            is_profile_complete = true,
            updated_at = NOW();
    END IF;

    RETURN new_user_id;
END;
$$ LANGUAGE plpgsql;

-- 5. SELF-FIX: Run this line if you are not an admin yet
-- Replace 'your-email@example.com' with your account email
-- UPDATE profiles SET role = 'admin' WHERE email = 'your-email@example.com';
