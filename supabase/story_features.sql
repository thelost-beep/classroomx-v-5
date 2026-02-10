-- =====================================================
-- Story System Enhancements
-- Features: Floating Comments, Viewer List, User Tagging
-- =====================================================

-- 1. Story Comments (Circular Floating Bubbles)
CREATE TABLE IF NOT EXISTS public.story_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    pos_x FLOAT DEFAULT 0.5, -- Normalized position (0 to 1)
    pos_y FLOAT DEFAULT 0.5, -- Normalized position (0 to 1)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Story Views (Who viewed)
CREATE TABLE IF NOT EXISTS public.story_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    viewed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(story_id, user_id)
);

-- 3. Story Tagging
CREATE TABLE IF NOT EXISTS public.story_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(story_id, user_id)
);

-- Enable RLS
ALTER TABLE public.story_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_tags ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Comments
DROP POLICY IF EXISTS "Anyone can view story comments" ON public.story_comments;
CREATE POLICY "Anyone can view story comments" ON public.story_comments
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can comment on stories" ON public.story_comments;
CREATE POLICY "Authenticated users can comment on stories" ON public.story_comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Views
DROP POLICY IF EXISTS "Story owners can view their story views" ON public.story_views;
CREATE POLICY "Story owners can view their story views" ON public.story_views
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.stories
            WHERE stories.id = story_id AND stories.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can record story views" ON public.story_views;
CREATE POLICY "Users can record story views" ON public.story_views
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Tags
DROP POLICY IF EXISTS "Anyone can view story tags" ON public.story_tags;
CREATE POLICY "Anyone can view story tags" ON public.story_tags
    FOR SELECT USING (true);

-- 5. Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.story_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.story_views;
ALTER PUBLICATION supabase_realtime ADD TABLE public.story_tags;
