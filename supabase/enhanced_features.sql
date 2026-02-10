-- Phase 3: Enhanced Features & Social Interaction
-- Run this in Supabase SQL Editor

-- 1. Post Collaborations Table
CREATE TABLE IF NOT EXISTS public.post_collaborations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- RLS for Collaborations
ALTER TABLE public.post_collaborations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view collaborations related to them" ON public.post_collaborations;
CREATE POLICY "Users can view collaborations related to them"
    ON public.post_collaborations FOR SELECT
    USING (auth.uid() = user_id OR EXISTS (
        SELECT 1 FROM public.posts WHERE id = post_id AND user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Post owners can invite collaborators" ON public.post_collaborations;
CREATE POLICY "Post owners can invite collaborators"
    ON public.post_collaborations FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.posts WHERE id = post_id AND user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Collaborators can update their status" ON public.post_collaborations;
CREATE POLICY "Collaborators can update their status"
    ON public.post_collaborations FOR UPDATE
    USING (auth.uid() = user_id);

-- 2. Enhanced Confessions (REFINED)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='confessions' AND column_name='user_id') THEN
        ALTER TABLE public.confessions ADD COLUMN user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='confessions' AND column_name='is_anonymous') THEN
        ALTER TABLE public.confessions ADD COLUMN is_anonymous BOOLEAN DEFAULT TRUE;
    END IF;
END $$;

-- Policy fix: Users MUST be able to see their own unapproved confessions
-- (This fixes the .select().single() error in the frontend)
DROP POLICY IF EXISTS "Users can view own unapproved confessions" ON public.confessions;
CREATE POLICY "Users can view own unapproved confessions"
    ON public.confessions FOR SELECT
    USING (auth.uid() = user_id OR is_approved = true);

-- 3. Notification Trigger for Collaborations (REFINED)
DROP FUNCTION IF EXISTS public.handle_collaboration_invite() CASCADE;
CREATE OR REPLACE FUNCTION public.handle_collaboration_invite()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.notifications (user_id, type, title, message, related_id)
    VALUES (
        NEW.user_id,
        'collaboration_invite',
        'New Collaboration Invite',
        'You have been invited to collaborate on a post.',
        NEW.post_id
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_collaboration_invite
    AFTER INSERT ON public.post_collaborations
    FOR EACH ROW EXECUTE FUNCTION public.handle_collaboration_invite();

-- 4. RPC to accept/reject collaboration (REFINED)
CREATE OR REPLACE FUNCTION public.respond_to_collaboration(collab_id UUID, new_status TEXT)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_post_id UUID;
BEGIN
    -- Check access
    SELECT post_id INTO v_post_id FROM post_collaborations WHERE id = collab_id AND user_id = auth.uid();
    
    IF v_post_id IS NULL THEN
        RAISE EXCEPTION 'Access denied.';
    END IF;

    -- Update status
    UPDATE post_collaborations SET status = new_status WHERE id = collab_id;

    -- Update linked notification
    UPDATE notifications 
    SET is_read = TRUE 
    WHERE user_id = auth.uid() 
    AND type = 'collaboration_invite' 
    AND related_id = v_post_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 5. Unified Posts & Confessions (REFINED)
-- Ensure columns exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='is_anonymous') THEN
        ALTER TABLE public.posts ADD COLUMN is_anonymous BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='is_approved') THEN
        ALTER TABLE public.posts ADD COLUMN is_approved BOOLEAN DEFAULT TRUE;
    END IF;
END $$;

-- Update constraint for post types (dropping old one if exists)
ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_type_check;
ALTER TABLE public.posts ADD CONSTRAINT posts_type_check CHECK (type IN ('media', 'text', 'confession'));

-- Enable Real-time for unified table
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE public.notifications, public.posts, public.messages;
COMMIT;

-- 6. Updated RLS for Posts (Visibility & Moderation)
DROP POLICY IF EXISTS "Anyone can view posts" ON public.posts;
DROP POLICY IF EXISTS "Anyone can view approved posts" ON public.posts;
CREATE POLICY "Anyone can view approved posts"
    ON public.posts FOR SELECT
    USING (is_approved = true OR auth.uid() = user_id);

-- Ensure Insert policy allows confessions
DROP POLICY IF EXISTS "Authenticated users can create posts" ON public.posts;
CREATE POLICY "Authenticated users can create posts"
  ON public.posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own posts" ON public.posts;
CREATE POLICY "Users can update own posts"
  ON public.posts FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own posts" ON public.posts;
CREATE POLICY "Users can delete own posts"
  ON public.posts FOR DELETE
  USING (auth.uid() = user_id);
