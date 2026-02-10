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
