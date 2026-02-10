-- Admin functions to manage users and content
-- These functions bypass RLS and should be used carefully

-- Get all users with their profile data
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

-- Update user role
CREATE OR REPLACE FUNCTION admin_update_user_role(target_user_id UUID, new_role TEXT)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Check if calling user is admin
    IF (SELECT role FROM profiles WHERE id = auth.uid()) != 'admin' THEN
        RAISE EXCEPTION 'Access denied. Admin role required.';
    END IF;

    -- Validate role
    IF new_role NOT IN ('student', 'teacher', 'admin') THEN
        RAISE EXCEPTION 'Invalid role specified.';
    END IF;

    UPDATE profiles
    SET role = new_role,
        updated_at = NOW()
    WHERE id = target_user_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Delete user post (Admin action)
CREATE OR REPLACE FUNCTION admin_delete_post(post_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Check if calling user is admin
    IF (SELECT role FROM profiles WHERE id = auth.uid()) != 'admin' THEN
        RAISE EXCEPTION 'Access denied. Admin role required.';
    END IF;

    DELETE FROM posts WHERE id = post_id;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Send broadcast notification to all users
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

    -- Insert into notifications for all users
    FOR user_record IN SELECT id FROM profiles LOOP
        INSERT INTO notifications (user_id, title, content, type)
        VALUES (user_record.id, title, message, 'broadcast');
    END LOOP;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
