-- Migration for Notification & Unread System
-- Enables tracking of unread states and auto-triggers for mentions/replies

-- 1. TRACKING IMPROVEMENTS
-- Add last_read_at to chat_members
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='chat_members' AND column_name='last_read_at') THEN
        ALTER TABLE public.chat_members ADD COLUMN last_read_at TIMESTAMPTZ DEFAULT NOW();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='chats' AND column_name='last_message_at') THEN
        ALTER TABLE public.chats ADD COLUMN last_message_at TIMESTAMPTZ DEFAULT NOW();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='chats' AND column_name='last_message_preview') THEN
        ALTER TABLE public.chats ADD COLUMN last_message_preview TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='messages' AND column_name='extra_data') THEN
        ALTER TABLE public.messages ADD COLUMN extra_data JSONB;
    END IF;
END $$;

-- 2. NOTIFICATION ENHANCEMENTS
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notifications' AND column_name='priority') THEN
        ALTER TABLE public.notifications ADD COLUMN priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notifications' AND column_name='action_url') THEN
        ALTER TABLE public.notifications ADD COLUMN action_url TEXT;
    END IF;
END $$;

-- 3. CHAT METADATA TRIGGER
-- Updates the chat's last_message_at and preview whenever a message is sent
CREATE OR REPLACE FUNCTION public.update_chat_metadata()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.chats
    SET 
        last_message_at = NEW.created_at,
        last_message_preview = CASE 
            WHEN NEW.content IS NOT NULL THEN (
                CASE WHEN length(NEW.content) > 50 THEN substring(NEW.content from 1 for 47) || '...' ELSE NEW.content END
            )
            WHEN NEW.media_url IS NOT NULL THEN '[Media]'
            ELSE 'New message'
        END
    WHERE id = NEW.chat_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_message_sent_update_chat ON public.messages;
CREATE TRIGGER on_message_sent_update_chat
    AFTER INSERT ON public.messages
    FOR EACH ROW EXECUTE FUNCTION public.update_chat_metadata();

-- 4. MENTION TRIGGER (@user)
-- Scans content for @username and creates notifications
CREATE OR REPLACE FUNCTION public.handle_mentions()
RETURNS TRIGGER AS $$
DECLARE
    mentioned_username TEXT;
    v_target_user_id UUID;
BEGIN
    -- This is a simplified regex-based mention extract for profiles.name
    -- In a real app, you might want a more robust way to match user names
    -- For now, we'll look for @ followed by word characters
    FOR mentioned_username IN SELECT unnest(regexp_matches(NEW.content, '@(\w+)', 'g'))
    LOOP
        -- Find the user by name
        SELECT id INTO v_target_user_id FROM public.profiles WHERE name = mentioned_username LIMIT 1;
        
        -- If user exists and is not the sender, notify
        IF v_target_user_id IS NOT NULL AND v_target_user_id != NEW.sender_id THEN
            INSERT INTO public.notifications (user_id, type, title, message, related_id, priority, action_url)
            VALUES (
                v_target_user_id,
                'mention',
                'New Mention',
                'Someone mentioned you in a message',
                NEW.id,
                'high',
                '/chats' -- We'll refine this in the frontend
            );
        END IF;
    END LOOP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_message_mention ON public.messages;
CREATE TRIGGER on_message_mention
    AFTER INSERT ON public.messages
    FOR EACH ROW 
    WHEN (NEW.content IS NOT NULL AND NEW.content ~ '@\w+')
    EXECUTE FUNCTION public.handle_mentions();

-- 5. STORY REPLY TRIGGER
-- Note: This requires the feature where story replies go to chat
-- We will implement the frontend side to send the message, 
-- and this trigger will handle notification if needed.

-- 6. COMMENT NOTIFICATION TRIGGER
-- Handles @mentions in comments and replies to own posts
CREATE OR REPLACE FUNCTION public.handle_comment_notifications()
RETURNS TRIGGER AS $$
DECLARE
    mentioned_username TEXT;
    v_target_user_id UUID;
    v_post_owner_id UUID;
BEGIN
    -- 1. Notify Post Owner
    SELECT user_id INTO v_post_owner_id FROM public.posts WHERE id = NEW.post_id;
    IF v_post_owner_id IS NOT NULL AND v_post_owner_id != NEW.user_id THEN
        INSERT INTO public.notifications (user_id, type, title, message, related_id, priority, action_url)
        VALUES (
            v_post_owner_id,
            'comment',
            'New Comment',
            'Someone commented on your post',
            NEW.post_id,
            'medium',
            '/post/' || NEW.post_id
        );
    END IF;

    -- 2. Handle @mentions in comments
    FOR mentioned_username IN SELECT unnest(regexp_matches(NEW.content, '@(\w+)', 'g'))
    LOOP
        SELECT id INTO v_target_user_id FROM public.profiles WHERE name = mentioned_username LIMIT 1;
        IF v_target_user_id IS NOT NULL AND v_target_user_id != NEW.user_id THEN
            INSERT INTO public.notifications (user_id, type, title, message, related_id, priority, action_url)
            VALUES (
                v_target_user_id,
                'mention',
                'Mentioned in Comment',
                'Someone mentioned you in a comment',
                NEW.id,
                'high',
                '/post/' || NEW.post_id
            );
        END IF;
    END LOOP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_comment_posted ON public.comments;
CREATE TRIGGER on_comment_posted
    AFTER INSERT ON public.comments
    FOR EACH ROW EXECUTE FUNCTION public.handle_comment_notifications();

-- 7. STORY MENTION TRIGGER
-- Handles @mentions in stories (via a separate tags table)
CREATE OR REPLACE FUNCTION public.handle_story_tags()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.notifications (user_id, type, title, message, related_id, priority, action_url)
    VALUES (
        NEW.user_id,
        'story_mention',
        'Mentioned in Story',
        'Someone tagged you in their story',
        NEW.story_id,
        'high',
        '/home' -- Story viewing is on home
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_story_tag ON public.story_tags;
CREATE TRIGGER on_story_tag
    AFTER INSERT ON public.story_tags
    FOR EACH ROW EXECUTE FUNCTION public.handle_story_tags();

-- 8. ADMIN BROADCAST
-- Helper function for admin to send a global notification
CREATE OR REPLACE FUNCTION public.admin_broadcast(p_title TEXT, p_message TEXT, p_url TEXT DEFAULT NULL)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.notifications (user_id, type, title, message, action_url, priority)
    SELECT id, 'broadcast', p_title, p_message, p_url, 'high'
    FROM public.profiles;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. SERVER-SIDE MARK AS READ
-- Avoids client-side clock drift by using NOW() on the server
CREATE OR REPLACE FUNCTION public.mark_chat_as_read(v_chat_id UUID, v_user_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Update chat_members
    UPDATE public.chat_members
    SET last_read_at = NOW()
    WHERE chat_id = v_chat_id AND user_id = v_user_id;

    -- Update legacy messages read_at
    UPDATE public.messages
    SET read_at = NOW()
    WHERE chat_id = v_chat_id 
    AND sender_id != v_user_id 
    AND read_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. CHAT MESSAGE NOTIFICATION TRIGGER
-- Notifies recipients when a message is sent
CREATE OR REPLACE FUNCTION public.handle_chat_message_notifications()
RETURNS TRIGGER AS $$
DECLARE
    v_member_id UUID;
    v_sender_name TEXT;
BEGIN
    -- Get sender name
    SELECT name INTO v_sender_name FROM public.profiles WHERE id = NEW.sender_id;

    -- Create notifications for all other members
    FOR v_member_id IN 
        SELECT user_id FROM public.chat_members 
        WHERE chat_id = NEW.chat_id AND user_id != NEW.sender_id
    LOOP
        -- Check if a mention notification was already created for this message/user
        -- to avoid double notifications (optional but cleaner)
        IF NOT EXISTS (
            SELECT 1 FROM public.notifications 
            WHERE user_id = v_member_id AND related_id = NEW.id AND type = 'mention'
        ) THEN
            INSERT INTO public.notifications (user_id, type, title, message, related_id, priority, action_url)
            VALUES (
                v_member_id,
                'chat_message',
                'New Message from ' || COALESCE(v_sender_name, 'Student'),
                CASE 
                    WHEN NEW.content IS NOT NULL THEN (
                        CASE WHEN length(NEW.content) > 100 THEN substring(NEW.content from 1 for 97) || '...' ELSE NEW.content END
                    )
                    ELSE '[Media]'
                END,
                NEW.chat_id,
                'high',
                '/chats/' || NEW.chat_id
            );
        END IF;
    END LOOP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_message_posted_notify ON public.messages;
CREATE TRIGGER on_message_posted_notify
    AFTER INSERT ON public.messages
    FOR EACH ROW EXECUTE FUNCTION public.handle_chat_message_notifications();
