-- =====================================================
-- Feature Restore Migration
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Add missing columns to messages table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='messages' AND column_name='type') THEN
        ALTER TABLE public.messages ADD COLUMN type TEXT DEFAULT 'text';
        -- Set types for existing media messages
        UPDATE public.messages SET type = 'image' WHERE media_url IS NOT NULL;
        -- Now add the constraint
        ALTER TABLE public.messages ADD CONSTRAINT messages_type_check CHECK (type IN ('text', 'image', 'post', 'profile'));
    ELSE
        -- Update any existing data that violates the new constraint
        UPDATE public.messages SET type = 'image' WHERE (type IS NULL OR type NOT IN ('text', 'image', 'post', 'profile')) AND media_url IS NOT NULL;
        UPDATE public.messages SET type = 'text' WHERE type IS NULL OR type NOT IN ('text', 'image', 'post', 'profile');
        
        -- Update existing constraint
        ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_type_check;
        ALTER TABLE public.messages ADD CONSTRAINT messages_type_check CHECK (type IN ('text', 'image', 'post', 'profile'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='messages' AND column_name='extra_data') THEN
        ALTER TABLE public.messages ADD COLUMN extra_data JSONB;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='messages' AND column_name='read_at') THEN
        ALTER TABLE public.messages ADD COLUMN read_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='messages' AND column_name='delivered_at') THEN
        ALTER TABLE public.messages ADD COLUMN delivered_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='messages' AND column_name='reply_to_id') THEN
        ALTER TABLE public.messages ADD COLUMN reply_to_id UUID REFERENCES public.messages(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 2. Add status column to besties table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='besties' AND column_name='status') THEN
        ALTER TABLE public.besties ADD COLUMN status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted'));
    END IF;
END $$;

-- 3. Add activity column to profiles
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='activity') THEN
        ALTER TABLE public.profiles ADD COLUMN activity TEXT;
    END IF;
END $$;

-- 4. Message status tracking (per-user read/delivered for group chats)
CREATE TABLE IF NOT EXISTS public.message_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    UNIQUE(message_id, user_id)
);

ALTER TABLE public.message_status ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view message status" ON public.message_status;
CREATE POLICY "Users can view message status"
    ON public.message_status FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Users can update own message status" ON public.message_status;
CREATE POLICY "Users can update own message status"
    ON public.message_status FOR ALL
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert message status" ON public.message_status;
CREATE POLICY "System can insert message status"
    ON public.message_status FOR INSERT
    WITH CHECK (true);

-- 5. Saved posts table
CREATE TABLE IF NOT EXISTS public.saved_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, post_id)
);

ALTER TABLE public.saved_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own saved posts" ON public.saved_posts;
CREATE POLICY "Users can manage own saved posts"
    ON public.saved_posts FOR ALL
    USING (auth.uid() = user_id);

-- 6. Hidden posts table
CREATE TABLE IF NOT EXISTS public.hidden_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, post_id)
);

ALTER TABLE public.hidden_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own hidden posts" ON public.hidden_posts;
CREATE POLICY "Users can manage own hidden posts"
    ON public.hidden_posts FOR ALL
    USING (auth.uid() = user_id);

-- 7. Notification trigger for bestie requests
CREATE OR REPLACE FUNCTION public.handle_bestie_request()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.notifications (user_id, type, title, message, related_id)
    VALUES (
        NEW.bestie_id,
        'bestie_request',
        'New Bestie Request',
        'Someone sent you a bestie request!',
        NEW.id
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_bestie_request ON public.besties;
CREATE TRIGGER on_bestie_request
    AFTER INSERT ON public.besties
    FOR EACH ROW EXECUTE FUNCTION public.handle_bestie_request();

-- 8. Add last_message_at to chats if missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='chats' AND column_name='last_message_at') THEN
        ALTER TABLE public.chats ADD COLUMN last_message_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- 9. Indexes for new tables
CREATE INDEX IF NOT EXISTS idx_message_status_message_id ON public.message_status(message_id);
CREATE INDEX IF NOT EXISTS idx_message_status_user_id ON public.message_status(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_posts_user_id ON public.saved_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_hidden_posts_user_id ON public.hidden_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_besties_user_id ON public.besties(user_id);
CREATE INDEX IF NOT EXISTS idx_besties_bestie_id ON public.besties(bestie_id);

-- 10. Storage setup (media bucket)
-- Ensure the bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- RLS for Storage (Media Bucket)
DROP POLICY IF EXISTS "Users can upload media" ON storage.objects;
CREATE POLICY "Users can upload media"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'media');

DROP POLICY IF EXISTS "Public can view media" ON storage.objects;
CREATE POLICY "Public can view media"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'media');

DROP POLICY IF EXISTS "Users can delete own media" ON storage.objects;
CREATE POLICY "Users can delete own media"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'media' AND auth.uid() = owner);

-- 11. Enhanced Notification trigger for bestie requests (HANDLES BOTH INSERT AND UPDATE)
CREATE OR REPLACE FUNCTION public.handle_bestie_notification()
RETURNS TRIGGER AS $$
DECLARE
    target_user_id UUID;
    notif_type TEXT;
    notif_title TEXT;
    notif_message TEXT;
    sender_name TEXT;
BEGIN
    -- Get sender name
    SELECT name INTO sender_name FROM public.profiles WHERE id = (CASE WHEN TG_OP = 'INSERT' THEN NEW.user_id ELSE NEW.bestie_id END);

    IF (TG_OP = 'INSERT') THEN
        -- New request
        target_user_id := NEW.bestie_id;
        notif_type := 'bestie_request';
        notif_title := 'New Bestie Request';
        notif_message := sender_name || ' sent you a bestie request!';
    ELSIF (TG_OP = 'UPDATE' AND OLD.status = 'pending' AND NEW.status = 'accepted') THEN
        -- Request accepted
        target_user_id := NEW.user_id;
        notif_type := 'bestie_accepted';
        notif_title := 'Request Accepted! ✨';
        notif_message := sender_name || ' accepted your bestie request. You are now besties!';
    ELSE
        RETURN NEW;
    END IF;

    INSERT INTO public.notifications (user_id, type, title, message, related_id)
    VALUES (target_user_id, notif_type, notif_title, notif_message, NEW.id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_bestie_change ON public.besties;
CREATE TRIGGER on_bestie_change
    AFTER INSERT OR UPDATE ON public.besties
    FOR EACH ROW EXECUTE FUNCTION public.handle_bestie_notification();

-- Delete the old trigger if it exists
DROP TRIGGER IF EXISTS on_bestie_request ON public.besties;

-- 12. Chat activity tracking and Nicknames
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='chats' AND column_name='last_message_preview') THEN
        ALTER TABLE public.chats ADD COLUMN last_message_preview TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='chat_members' AND column_name='nickname') THEN
        ALTER TABLE public.chat_members ADD COLUMN nickname TEXT;
    END IF;
END $$;

-- Update last_message_at and last_message_preview on new message
CREATE OR REPLACE FUNCTION public.handle_new_message_activity()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.chats
    SET 
        last_message_at = NEW.created_at,
        last_message_preview = (CASE WHEN NEW.type = 'text' THEN NEW.content ELSE '[Media]' END)
    WHERE id = NEW.chat_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_message_activity ON public.messages;
CREATE TRIGGER on_new_message_activity
    AFTER INSERT ON public.messages
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_message_activity();

-- 13. Common chat lookup helper
CREATE OR REPLACE FUNCTION public.find_common_chats(user1 UUID, user2 UUID)
RETURNS TABLE (chat_id UUID, chat_type TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT c.id, c.type
    FROM public.chats c
    JOIN public.chat_members cm1 ON c.id = cm1.chat_id
    JOIN public.chat_members cm2 ON c.id = cm2.chat_id
    WHERE cm1.user_id = user1 AND cm2.user_id = user2;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 14. Membership check helper (Bypasses RLS to prevent recursion)
CREATE OR REPLACE FUNCTION public.check_chat_membership(cid UUID, uid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.chat_members
        WHERE chat_id = cid AND user_id = uid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 15. Essential RLS for Chats
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their chats" ON public.chats;
CREATE POLICY "Users can view their chats"
    ON public.chats FOR SELECT
    USING (public.check_chat_membership(id, auth.uid()));

DROP POLICY IF EXISTS "Users can create chats" ON public.chats;
CREATE POLICY "Users can create chats"
    ON public.chats FOR INSERT
    WITH CHECK (true);

-- 16. Essential RLS for Chat Members
ALTER TABLE public.chat_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view members of their chats" ON public.chat_members;
CREATE POLICY "Users can view members of their chats"
    ON public.chat_members FOR SELECT
    USING (public.check_chat_membership(chat_id, auth.uid()));

DROP POLICY IF EXISTS "Users can add members" ON public.chat_members;
CREATE POLICY "Users can add members"
    ON public.chat_members FOR INSERT
    WITH CHECK (true);

-- 17. Stored procedure for atomic chat creation
CREATE OR REPLACE FUNCTION public.create_new_chat(
    p_type TEXT,
    p_member_ids UUID[],
    p_name TEXT DEFAULT NULL
)
RETURNS public.chats AS $$
DECLARE
    v_chat public.chats;
    v_uid UUID;
BEGIN
    -- Create the chat
    INSERT INTO public.chats (type, name)
    VALUES (p_type, p_name)
    RETURNING * INTO v_chat;

    -- Add all members
    FOREACH v_uid IN ARRAY p_member_ids
    LOOP
        INSERT INTO public.chat_members (chat_id, user_id, role)
        VALUES (v_chat.id, v_uid, 'member');
    END LOOP;

    RETURN v_chat;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 18. Add realtime for new tables
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE
    public.notifications,
    public.posts,
    public.messages,
    public.message_status,
    public.besties,
    public.profiles,
    public.chats,
    public.chat_members;
COMMIT;
