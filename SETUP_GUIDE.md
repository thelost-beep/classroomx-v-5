# 🚀 ClassroomX - Complete Setup Guide

## Step-by-Step Database Setup

Follow these steps **in order** to set up your ClassroomX database with ALL features working:

---

## 📋 Prerequisites

- Supabase account with a project created
- `.env` file with Supabase credentials (URL and anon key)

---

## 🗄️ Step 1: Run Main Migration

Copy and paste the **ENTIRE** contents of [`COMPLETE_MIGRATION.sql`](file:///c:/Users/aftab/OneDrive/Desktop/classroomx-v-5/supabase/COMPLETE_MIGRATION.sql) into your Supabase SQL Editor and run it.

This creates:
✅ All 12 tables (profiles, posts, comments, likes, stories, chats, messages, etc.)
✅ All indexes for performance
✅ Auto-create profile trigger
✅ Helper functions

---

## 🔐 Step 2: Run Security Policies

Copy and paste [`security.sql`](file:///c:/Users/aftab/OneDrive/Desktop/classroomx-v-5/supabase/security.sql) into Supabase SQL Editor and run it.

This sets up:
✅ Row Level Security (RLS) on all tables
✅ Policies for read/write access
✅ Privacy controls

---

## 📁 Step 3: Set Up Storage Buckets

Copy and paste [`storage.sql`](file:///c:/Users/aftab/OneDrive/Desktop/classroomx-v-5/supabase/storage.sql) into Supabase SQL Editor and run it.

This creates:
✅ 5 storage buckets (avatars, banners, posts, stories, messages)
✅ Storage policies for uploads/downloads
✅ Support for images AND videos

---

## ⚡ Step 4: Enable Realtime

**Go to:** Database → Replication in your Supabase Dashboard

**Enable replication for these tables:**
1. ✅ `messages` - For real-time chat
2. ✅ `notifications` - For real-time notifications
3. ✅ `stories` - For real-time story updates
4. ✅ `likes` - For real-time like counters
5. ✅ `comments` - For real-time comments

**How to enable:**
- Click on each table
- Toggle "Enable Realtime"
- Select events: `INSERT`, `UPDATE`, `DELETE`

---

## 👥 Step 5: Create Users

You have two options:

### Option A: Manual (Supabase Dashboard)
1. Go to Authentication → Users
2. Click "Add user"
3. Create each of the 23 students manually
4. Use emails from [`users.sql`](file:///c:/Users/aftab/OneDrive/Desktop/classroomx-v-5/supabase/users.sql)

### Option B: Programmatic (Recommended)
1. Update [`users-setup.js`](file:///c:/Users/aftab/OneDrive/Desktop/classroomx-v-5/supabase/users-setup.js) with your service role key
2. Run: `node supabase/users-setup.js`
3. All 23 users created automatically!

---

## 🎬 Step 6: Configure Your App

### Update `.env`:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### Start the app:
```bash
npm run dev
```

Visit: http://localhost:5173/

---

## ✅ Verification Checklist

Run these queries in Supabase SQL Editor to verify setup:

```sql
-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check users created
SELECT COUNT(*) FROM auth.users;

-- Check profiles auto-created
SELECT COUNT(*) FROM profiles;

-- Check storage buckets
SELECT * FROM storage.buckets;

-- Check RLS enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

Expected results:
- ✅ 12+ tables created
- ✅ 23 users (if you created them)
- ✅ 23 profiles (auto-created via trigger)
- ✅ 5 storage buckets
- ✅ All tables have `rowsecurity = true`

---

## 🎯 What Each Component Does

### Tables:
- **profiles** - User profiles (auto-created on signup)
- **posts** - User posts with captions
- **post_media** - Images/videos for posts
- **likes** - Post likes
- **comments** - Post comments
- **stories** - 24-hour stories with seen tracking
- **chats** - Chat rooms (DM, group, class)
- **chat_members** - Who's in each chat
- **messages** - Chat messages
- **notifications** - In-app notifications
- **confessions** - Anonymous confessions (admin moderation)
- **reports** - User reports (bugs, content)
- **besties** - Bestie connections (max 3)

### Storage Buckets:
- **avatars** - Profile pictures
- **banners** - Profile banners
- **posts** - Post media (images + videos)
- **stories** - Story media (images + videos)
- **messages** - Message attachments

### Realtime Features:
- **Chat** - Messages appear instantly
- **Notifications** - Live notification updates
- **Stories** - New stories appear in real-time
- **Likes** - Like counts update instantly
- **Comments** - New comments appear live

---

## 🐛 Troubleshooting

### "RLS policy prevents access"
- Make sure you ran `security.sql`
- Check you're logged in as an authenticated user

### "Storage bucket not found"
- Run `storage.sql` again
- Verify buckets exist: `SELECT * FROM storage.buckets;`

### "Profile not created"
- Check trigger exists: `SELECT * FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created';`
- Manually create profile if needed

### "Realtime not working"
- Go to Database → Replication
- Ensure tables are enabled
- Check browser console for WebSocket errors

---

## 🎉 You're Done!

Your ClassroomX app is now **fully configured** with:
- ✅ Real-time chat
- ✅ Stories with 24h expiration
- ✅ Like & comment system
- ✅ Admin dashboard
- ✅ Media grid
- ✅ Profile editing
- ✅ Settings page
- ✅ Video + image support

**Start building! 🚀**
