create table if not exists public.besties (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  bestie_id uuid references public.profiles(id) on delete cascade not null,
  status text check (status in ('pending', 'accepted')) default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, bestie_id)
);

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
