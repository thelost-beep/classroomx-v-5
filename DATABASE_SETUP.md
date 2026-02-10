# ClassroomX - Database Setup Required

## 📋 Missing Tables for Phase 2 Features

To use all the features you just implemented, you need to create the following tables in your Supabase database:

### 1. Chats Table
```sql
create table chats (
  id uuid default gen_random_uuid() primary key,
  type text not null check (type in ('dm', 'group', 'class')),
  name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

### 2. Chat Members Table
```sql
create table chat_members (
  id uuid default gen_random_uuid() primary key,
  chat_id uuid references chats(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(chat_id, user_id)
);
```

### 3. Messages Table
```sql
create table messages (
  id uuid default gen_random_uuid() primary key,
  chat_id uuid references chats(id) on delete cascade not null,
  sender_id uuid references profiles(id) on delete cascade not null,
  content text not null,
  media_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index for fast message retrieval
create index messages_chat_id_created_at_idx on messages(chat_id, created_at desc);
```

### 4. Stories Table
```sql
create table stories (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  media_url text not null,
  media_type text not null check (media_type in ('image', 'video')),
  seen_by uuid[] default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  expires_at timestamp with time zone not null
);

-- Index for fetching active stories
create index stories_expires_at_idx on stories(expires_at);
```

### 5. Confessions Table
```sql
create table confessions (
  id uuid default gen_random_uuid() primary key,
  content text not null,
  is_approved boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

### 6. Reports Table
```sql
create table reports (
  id uuid default gen_random_uuid() primary key,
  reporter_id uuid references profiles(id) on delete cascade not null,
  reported_type text not null check (reported_type in ('post', 'user', 'comment')),
  reported_id uuid not null,
  reason text not null,
  status text default 'pending' check (status in ('pending', 'resolved')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

### 7. Notifications Table
```sql
create table notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  type text not null,
  title text not null,
  message text not null,
  related_id uuid,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index for fast notification retrieval
create index notifications_user_id_created_at_idx on notifications(user_id, created_at desc);
```

## 🗄️ Storage Bucket

Create a storage bucket for stories:

```sql
-- Run in Supabase SQL Editor
insert into storage.buckets (id, name, public)
values ('stories', 'stories', true);
```

## 🔐 RLS Policies (Row Level Security)

You'll need to set up RLS policies for each table. Here are examples for the chats system:

```sql
-- Enable RLS
alter table chats enable row level security;
alter table chat_members enable row level security;
alter table messages enable row level security;

-- Chats: Users can see chats they're a member of
create policy "Users can view their chats"
  on chats for select
  using (id in (
    select chat_id from chat_members where user_id = auth.uid()
  ));

-- Messages: Users can view messages in their chats
create policy "Users can view messages in their chats"
  on messages for select
  using (chat_id in (
    select chat_id from chat_members where user_id = auth.uid()
  ));

-- Messages: Users can insert messages in their chats
create policy "Users can send messages in their chats"
  on messages for insert
  with check (
    sender_id = auth.uid() and
    chat_id in (select chat_id from chat_members where user_id = auth.uid())
  );
```

## 🔧 Database Functions  

Create helper function for DM chat lookup:

```sql
create or replace function get_dm_chat(user1 uuid, user2 uuid)
returns table (
  id uuid,
  type text,
  name text,
  created_at timestamp with time zone
)
language sql
as $$
  select c.*
  from chats c
  where c.type = 'dm'
    and c.id in (
      select cm1.chat_id
      from chat_members cm1
      join chat_members cm2 on cm1.chat_id = cm2.chat_id
      where cm1.user_id = user1 and cm2.user_id = user2
    )
  limit 1;
$$;
```

## ⚡ Realtime Setup

Enable Realtime for messages:

1. Go to Database → Replication in Supabase Dashboard
2. Enable replication for the `messages` table
3. Enable realtime for `INSERT` events

## 📝 Quick Setup Script

Run this complete script in your Supabase SQL Editor:

```sql
-- Create all tables
-- (Copy all the CREATE TABLE statements from above)

-- Enable RLS
alter table chats enable row level security;
alter table chat_members enable row level security;
alter table messages enable row level security;
alter table stories enable row level security;
alter table confessions enable row level security;
alter table reports enable row level security;
alter table notifications enable row level security;

-- Create storage bucket
insert into storage.buckets (id, name, public)
values ('stories', 'stories', true)
on conflict do nothing;

-- Create helper function
-- (Copy the get_dm_chat function from above)
```

After running this, your app will be fully functional!
