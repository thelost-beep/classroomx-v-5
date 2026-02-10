-- 0. POWER UP: Make yourself admin if you aren't already
-- Change 'your-email@example.com' to YOUR actual email before running
-- UPDATE profiles SET role = 'admin' WHERE email = 'your-email@example.com';

-- 1. Ensure updated_at columns exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='updated_at') THEN
        ALTER TABLE profiles ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='updated_at') THEN
        ALTER TABLE posts ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- 2. Fixed Admin Functions
DROP FUNCTION IF EXISTS get_all_users() CASCADE;
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
    IF (SELECT role FROM profiles WHERE id = auth.uid()) != 'admin' THEN
        RAISE EXCEPTION 'Access denied. Admin role required.';
    END IF;

    RETURN QUERY
    SELECT 
        p.id,
        u.email,
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

-- 3. Fix admin_create_profile to handle email correctly
DROP FUNCTION IF EXISTS admin_create_profile(TEXT, TEXT, TEXT) CASCADE;
CREATE OR REPLACE FUNCTION admin_create_profile(user_email TEXT, user_name TEXT, user_role TEXT)
RETURNS UUID
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_user_id UUID;
BEGIN
    -- Check if calling user is admin
    IF (SELECT role FROM profiles WHERE id = auth.uid()) != 'admin' THEN
        RAISE EXCEPTION 'Access denied. Admin role required.';
    END IF;

    -- Look up user in auth.users
    SELECT id INTO new_user_id FROM auth.users WHERE email = user_email;

    -- If user exists, create/update profile
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

-- 4. Automatic timestamp triggers
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_profiles_updated ON public.profiles;
CREATE TRIGGER on_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS on_posts_updated ON public.posts;
CREATE TRIGGER on_posts_updated
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 5. Broadcast Cleanup
CREATE OR REPLACE FUNCTION send_broadcast_notification(title TEXT, message TEXT)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_record RECORD;
BEGIN
    -- Check if calling user is admin
    IF (SELECT role FROM profiles WHERE id = auth.uid()) != 'admin' THEN
        RAISE EXCEPTION 'Access denied. Admin role required.';
    END IF;

    FOR user_record IN SELECT id FROM profiles LOOP
        INSERT INTO notifications (user_id, title, content, type)
        VALUES (user_record.id, title, message, 'broadcast');
    END LOOP;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
