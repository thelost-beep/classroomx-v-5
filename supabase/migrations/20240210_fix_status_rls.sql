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
