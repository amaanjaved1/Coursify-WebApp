-- Baseline schema for Coursify-WebApp (derived from app usage).
-- If production drifted, maintainers should generate a new migration via Supabase CLI (`db pull` / `db diff`) rather than editing this file in place.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.courses (
  id uuid primary key default gen_random_uuid (),
  course_code text not null,
  course_name text not null,
  course_description text,
  course_requirements text,
  course_units numeric default 3,
  offering_faculty text not null default 'Faculty of Arts and Science',
  course_level integer not null default 1,
  constraint courses_course_code_unique unique (course_code),
  constraint courses_course_level_check check (
    course_level >= 1
    and course_level <= 6
  )
);

create table public.course_distributions (
  id bigint generated always as identity primary key,
  course_id uuid not null references public.courses (id) on delete cascade,
  term text not null,
  enrollment integer not null default 0,
  average_gpa numeric not null default 0,
  grade_counts jsonb not null default '[]'::jsonb,
  constraint course_distributions_course_term_unique unique (course_id, term)
);

create table public.rag_chunks (
  id uuid primary key default gen_random_uuid (),
  source text not null,
  course_code text not null,
  text text not null,
  professor_name text,
  source_url text,
  tags jsonb not null default '[]'::jsonb,
  upvotes integer not null default 0,
  quality_rating numeric,
  difficulty_rating numeric,
  sentiment_label text not null default 'neutral',
  created_at timestamptz not null default now(),
  constraint rag_chunks_source_check check (
    source = any (array['reddit'::text, 'ratemyprofessors'::text])
  )
);

create index rag_chunks_course_code_idx on public.rag_chunks (course_code);

create index course_distributions_course_id_idx on public.course_distributions (course_id);

create table public.user_profiles (
  id uuid not null references auth.users (id) on delete cascade primary key,
  display_name text,
  semesters_completed integer not null default 0,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_profiles_semesters_check check (
    semesters_completed >= 0
    and semesters_completed <= 8
  )
);

create table public.distribution_uploads (
  id uuid primary key default gen_random_uuid (),
  user_id uuid not null references auth.users (id) on delete cascade,
  file_path text not null,
  original_filename text not null,
  term text not null,
  status text not null,
  processed_at timestamptz not null default now(),
  constraint distribution_uploads_status_check check (
    status = any (
      array[
        'processed'::text,
        'rejected'::text,
        'already_uploaded'::text
      ]
    )
  )
);

create index distribution_uploads_user_id_idx on public.distribution_uploads (user_id);

-- ---------------------------------------------------------------------------
-- Aggregated listing view (used by /api/courses and related list endpoints)
-- ---------------------------------------------------------------------------

create or replace view public.courses_with_stats as
select
  c.id,
  c.course_code,
  c.course_name,
  c.course_description,
  c.course_units,
  c.offering_faculty,
  c.course_level,
  coalesce(agg.computed_avg_gpa, 0::numeric) as computed_avg_gpa,
  coalesce(agg.computed_avg_enrollment, 0::numeric) as computed_avg_enrollment,
  exists (
    select
      1
    from
      public.rag_chunks r
    where
      r.course_code = c.course_code
  ) as has_comments
from
  public.courses c
  left join (
    select
      cd.course_id,
      avg(cd.average_gpa)::numeric as computed_avg_gpa,
      avg(cd.enrollment::numeric)::numeric as computed_avg_enrollment
    from
      public.course_distributions cd
    group by
      cd.course_id
  ) agg on agg.course_id = c.id;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.courses enable row level security;

alter table public.course_distributions enable row level security;

alter table public.rag_chunks enable row level security;

alter table public.user_profiles enable row level security;

alter table public.distribution_uploads enable row level security;

-- Public read for catalog + comments sources (anon + authenticated).
create policy "courses_select_public" on public.courses for select using (true);

create policy "course_distributions_select_public" on public.course_distributions for select using (true);

create policy "rag_chunks_select_public" on public.rag_chunks for select using (true);

-- User-owned rows (browser uses anon key; service role still bypasses RLS for API routes).
create policy "user_profiles_select_own" on public.user_profiles for select using (auth.uid () = id);

create policy "user_profiles_insert_own" on public.user_profiles for insert
with
  check (auth.uid () = id);

create policy "user_profiles_update_own" on public.user_profiles for update using (auth.uid () = id)
with
  check (auth.uid () = id);

create policy "distribution_uploads_select_own" on public.distribution_uploads for select using (auth.uid () = user_id);

create policy "distribution_uploads_insert_own" on public.distribution_uploads for insert
with
  check (auth.uid () = user_id);

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

grant select on table public.courses to anon, authenticated;

grant select on table public.course_distributions to anon, authenticated;

grant select on table public.rag_chunks to anon, authenticated;

grant select on table public.courses_with_stats to anon, authenticated;

grant select, insert, update on table public.user_profiles to authenticated;

grant select, insert on table public.distribution_uploads to authenticated;
