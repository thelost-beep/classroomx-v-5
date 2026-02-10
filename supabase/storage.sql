-- ClassroomX Storage Buckets Setup
-- Run this in your Supabase SQL Editor

-- =====================================================
-- CREATE STORAGE BUCKETS
-- =====================================================
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('avatars', 'avatars', true),
  ('banners', 'banners', true),
  ('posts', 'posts', true),
  ('stories', 'stories', true),
  ('messages', 'messages', true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- STORAGE POLICIES - AVATARS
-- =====================================================
CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update own avatars"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own avatars"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- =====================================================
-- STORAGE POLICIES - BANNERS
-- =====================================================
CREATE POLICY "Anyone can view banners"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'banners');

CREATE POLICY "Authenticated users can upload banners"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'banners'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update own banners"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'banners'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own banners"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'banners'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- =====================================================
-- STORAGE POLICIES - POSTS
-- =====================================================
CREATE POLICY "Anyone can view post media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'posts');

CREATE POLICY "Authenticated users can upload post media"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'posts'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Authenticated users can update post media"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'posts'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Authenticated users can delete post media"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'posts'
    AND auth.role() = 'authenticated'
  );

-- =====================================================
-- STORAGE POLICIES - STORIES
-- =====================================================
CREATE POLICY "Anyone can view stories"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'stories');

CREATE POLICY "Authenticated users can upload stories"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'stories'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can delete own stories"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'stories'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- =====================================================
-- STORAGE POLICIES - MESSAGES
-- =====================================================
CREATE POLICY "Authenticated users can view message media"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'messages'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Authenticated users can upload message media"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'messages'
    AND auth.role() = 'authenticated'
  );
