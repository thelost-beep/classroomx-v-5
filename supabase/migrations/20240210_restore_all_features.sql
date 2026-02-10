-- RESTORATION SCRIPT: Re-creates missing tables and policies for Besties, Messages, etc.

-- 1. BESTIES (FRIENDSHIPS)
create table if not exists public.besties (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  bestie_id uuid references public.profiles(id) on delete cascade not null,
  status text check (status in ('pending', 'accepted')) default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, bestie_id)
);

-- RLS for besties
alter table public.besties enable row level security;

create policy "Users can view their own bestie relationships"
  on public.besties for select
  using (auth.uid() = user_id or auth.uid() = bestie_id);

create policy "Users can insert bestie requests"
  on public.besties for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own bestie relationships"
  on public.besties for update
  using (auth.uid() = user_id or auth.uid() = bestie_id);

create policy "Users can delete their own bestie relationships"
  on public.besties for delete
  using (auth.uid() = user_id or auth.uid() = bestie_id);


-- 2. MESSAGE REACTIONS
create table if not exists public.message_reactions (
    id uuid default gen_random_uuid() primary key,
    message_id uuid references public.messages(id) on delete cascade not null,
    user_id uuid references public.profiles(id) on delete cascade not null,
    emoji text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.message_reactions enable row level security;

create policy "Anyone in the chat can view reactions"
    on public.message_reactions for select
    using (
        exists (
            select 1 from public.messages m
            join public.chat_members cm on m.chat_id = cm.chat_id
            where m.id = message_reactions.message_id
            and cm.user_id = auth.uid()
        )
    );

create policy "Members can add reactions"
    on public.message_reactions for insert
    with check (
        exists (
            select 1 from public.messages m
            join public.chat_members cm on m.chat_id = cm.chat_id
            where m.id = message_reactions.message_id
            and cm.user_id = auth.uid()
        )
    );

create policy "Users can remove their own reactions"
    on public.message_reactions for delete
    using (auth.uid() = user_id);


-- 3. ENSURE POST COLLABORATIONS EXISTS
create table if not exists public.post_collaborations (
    id uuid default gen_random_uuid() primary key,
    post_id uuid references public.posts(id) on delete cascade not null,
    user_id uuid references public.profiles(id) on delete cascade not null,
    status text check (status in ('pending', 'accepted', 'rejected')) default 'pending',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(post_id, user_id)
);

alter table public.post_collaborations enable row level security;

create policy "Public view accepted collaborations"
    on public.post_collaborations for select
    using (true);

create policy "Post owners can invite collaborators"
    on public.post_collaborations for insert
    with check (
        exists (
            select 1 from public.posts
            where id = post_id
            and user_id = auth.uid()
        )
    );

create policy "Collaborators can accept/reject"
    on public.post_collaborations for update
    using (auth.uid() = user_id);


-- 4. FIX MESSAGES RLS (Ensure it exists and is correct)
alter table public.messages enable row level security;

drop policy if exists "Chat members can view messages" on public.messages;
create policy "Chat members can view messages"
  on public.messages for select
  using (
    exists (
      select 1 from public.chat_members
      where chat_id = messages.chat_id
      and user_id = auth.uid()
    )
  );

drop policy if exists "Chat members can insert messages" on public.messages;
create policy "Chat members can insert messages"
  on public.messages for insert
  with check (
    auth.uid() = sender_id and
    exists (
      select 1 from public.chat_members
      where chat_id = messages.chat_id
      and user_id = auth.uid()
    )
  );

-- 5. FUNCTION TO MARK READ
create or replace function public.mark_message_read(p_message_id uuid)
returns void as $$
begin
  update public.messages
  set read_at = now()
  where id = p_message_id
  and read_at is null;
end;
$$ language plpgsql security definer;
