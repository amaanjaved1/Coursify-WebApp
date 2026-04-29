-- Replaces Redis qa:user:<id> counters with a Postgres table.
-- The qa_consume_question function is SECURITY DEFINER so the service-role
-- client used by API routes can call it even under RLS.

create table public.qa_daily_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null default current_date,
  count integer not null default 0,
  constraint qa_daily_usage_pkey primary key (user_id, date),
  constraint qa_daily_usage_count_check check (count >= 0)
);

alter table public.qa_daily_usage enable row level security;

create policy "qa_daily_usage_select_own" on public.qa_daily_usage
  for select using (auth.uid () = user_id);

-- Atomic gate-then-increment. Returns { new_count, allowed }.
-- SECURITY DEFINER lets authenticated callers execute this without direct table INSERT/UPDATE rights.
-- FOR UPDATE prevents concurrent requests from both passing the cap check.
create or replace function public.qa_consume_question (p_user_id uuid, p_daily_limit integer)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_count integer;
begin
  insert into public.qa_daily_usage (user_id, date, count)
  values (p_user_id, current_date, 0)
  on conflict (user_id, date) do nothing;

  select count into v_count
  from public.qa_daily_usage
  where user_id = p_user_id and date = current_date
  for update;

  if v_count >= p_daily_limit then
    -- denied: v_count is the current (non-incremented) count, returned as new_count for client consistency
    return jsonb_build_object('new_count', v_count, 'allowed', false);
  end if;

  update public.qa_daily_usage
  set count = count + 1
  where user_id = p_user_id and date = current_date
  returning count into v_count;

  return jsonb_build_object('new_count', v_count, 'allowed', true);
end;
$$;

grant execute on function public.qa_consume_question (uuid, integer) to authenticated;
