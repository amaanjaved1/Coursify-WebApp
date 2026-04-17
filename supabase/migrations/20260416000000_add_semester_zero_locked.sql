alter table public.user_profiles
  add column if not exists semester_zero_locked boolean not null default false;
