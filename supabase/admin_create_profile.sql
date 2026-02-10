-- Add admin_create_profile helper
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

    -- Look up the user by email in auth.users
    SELECT id INTO new_user_id FROM auth.users WHERE email = user_email;

    IF new_user_id IS NULL THEN
        -- If user doesn't exist in auth.users, they need to be created via signUp/Invite first
        -- We just raise a more helpful error here for the RPC
        RAISE EXCEPTION 'User email % not found in auth system. Please invite them first or ensure they signed up.', user_email;
    END IF;

    -- Update or insert the profile
    INSERT INTO profiles (id, name, role, is_profile_complete, email)
    VALUES (new_user_id, user_name, user_role, true, user_email)
    ON CONFLICT (id) DO UPDATE
    SET name = user_name,
        role = user_role,
        is_profile_complete = true,
        updated_at = NOW();

    RETURN new_user_id;
END;
$$ LANGUAGE plpgsql;
