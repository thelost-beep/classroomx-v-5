create or replace function public.mark_message_read(p_message_id uuid)
returns void as $$
begin
  update public.messages
  set read_at = now()
  where id = p_message_id
  and read_at is null;
end;
$$ language plpgsql security definer;
