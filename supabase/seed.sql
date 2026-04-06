-- Dev dataset: 20 courses, 20 grade-distribution rows, rich rag_chunks (Reddit + RateMyProfessors).
--
-- CONSTRAINTS (see 20260405190000_baseline_schema.sql):
--   • courses.course_code UNIQUE
--   • course_distributions (course_id, term) UNIQUE; course_id FK → courses(id)
--   • rag_chunks.source CHECK IN ('reddit','ratemyprofessors'); tags NOT NULL jsonb
--   • distribution_uploads.status / user_profiles semester checks (seed does not touch those)
-- Professors are plain text on rag_chunks — no prof table / FK.
--
-- Layout:
--   • 14 courses: one term of grade data each
--   • 3 courses: two terms each
--   • 3 courses: comments-only (no course_distributions): FILM 110, KNPE 103, PSYC 100
--   • 2 courses: grade data, no rag_chunks: ELEC 252, STAT 263
--
-- Truncate resets UUIDs; course_distributions and rag_chunks rows resolve course_id / codes via
-- JOIN so reruns stay consistent even if you only rerun part of this file after changing courses.

truncate table public.rag_chunks;

truncate table public.courses cascade;

-- ---------------------------------------------------------------------------
-- Courses (canonical course_code spelling: "DEPT NNN" single space — matches API normalization)
-- ---------------------------------------------------------------------------

insert into public.courses (
  id,
  course_code,
  course_name,
  course_description,
  course_requirements,
  course_units,
  offering_faculty,
  course_level
)
values
  ('11111111-1111-4111-8111-111111111101', 'CISC 101', 'Elements of Computer Programming', 'Problem solving, algorithms, and elementary programming.', null, 3.0, 'Faculty of Arts and Science', 1),
  ('11111111-1111-4111-8111-111111111102', 'CISC 124', 'Introduction to Computer Science II', 'Data structures, object-oriented design, and recursion.', 'CISC 101 or APSC 142', 3.0, 'Faculty of Arts and Science', 1),
  ('11111111-1111-4111-8111-111111111103', 'CISC 223', 'Software Specifications', 'Formal and semi-formal specification of software systems.', 'CISC 124', 3.0, 'Faculty of Arts and Science', 2),
  ('11111111-1111-4111-8111-111111111104', 'ELEC 252', 'Electronics I', 'Diodes, transistors, and small-signal models.', 'ELEC 221 or permission of the department', 3.0, 'Faculty of Engineering and Applied Science', 2),
  ('11111111-1111-4111-8111-111111111105', 'APSC 142', 'Introduction to Computer Science for Engineers', 'Programming and problem solving for engineering students.', null, 3.0, 'Faculty of Engineering and Applied Science', 1),
  ('11111111-1111-4111-8111-111111111106', 'MATH 110', 'Linear Algebra', 'Vectors, matrices, linear systems, eigenvalues.', null, 6.0, 'Faculty of Arts and Science', 1),
  ('11111111-1111-4111-8111-111111111107', 'MATH 120', 'Differential and Integral Calculus', 'Limits, derivatives, integrals, applications.', null, 6.0, 'Faculty of Arts and Science', 1),
  ('11111111-1111-4111-8111-111111111108', 'STAT 263', 'Probability and Statistics for Engineers', 'Probability models, estimation, hypothesis tests.', 'MATH 120', 3.0, 'Faculty of Arts and Science', 2),
  ('11111111-1111-4111-8111-111111111109', 'ECON 110', 'Principles of Microeconomics', 'Consumer and producer theory; competitive markets.', null, 3.0, 'Faculty of Arts and Science', 1),
  ('11111111-1111-4111-8111-111111111110', 'COMM 163', 'Business Foundations', 'Overview of business disciplines and teamwork.', null, 3.0, 'Smith School of Business', 1),
  ('11111111-1111-4111-8111-111111111111', 'CHEM 112', 'General Chemistry II', 'Equilibrium, thermodynamics, electrochemistry.', 'CHEM 111 or equivalent', 3.0, 'Faculty of Arts and Science', 1),
  ('11111111-1111-4111-8111-111111111112', 'PHYS 117', 'Introductory Physics I: Mechanics', 'Kinematics, dynamics, work and energy.', null, 3.0, 'Faculty of Arts and Science', 1),
  ('11111111-1111-4111-8111-111111111113', 'BIOL 102', 'Introductory Cell and Molecular Biology', 'Cell structure, genetics, and molecular biology.', null, 3.0, 'Faculty of Arts and Science', 1),
  ('11111111-1111-4111-8111-111111111114', 'MECH 211', 'Mechanics II', 'Kinematics and kinetics of particles and rigid bodies.', 'APSC 181 or permission', 3.0, 'Faculty of Engineering and Applied Science', 2),
  ('11111111-1111-4111-8111-111111111115', 'CLST 200', 'Greek and Roman Mythology', 'Major myths and their reception in literature and art.', null, 3.0, 'Faculty of Arts and Science', 2),
  ('11111111-1111-4111-8111-111111111116', 'GPHY 101', 'Human Geography', 'Population, migration, cities, and economic geography.', null, 3.0, 'Faculty of Arts and Science', 1),
  ('11111111-1111-4111-8111-111111111117', 'MTHE 224', 'Applied Mathematical Analysis', 'Ordinary differential equations and applications.', 'MATH 120 or MATH 121', 3.0, 'Faculty of Arts and Science', 2),
  ('11111111-1111-4111-8111-111111111118', 'FILM 110', 'Film Form and Analysis', 'Introduction to film language, genres, and criticism.', null, 3.0, 'Faculty of Arts and Science', 1),
  ('11111111-1111-4111-8111-111111111119', 'KNPE 103', 'Human Physiological Basis of Activity', 'Introductory anatomy and physiology for kinesiology.', null, 3.0, 'Faculty of Arts and Science', 1),
  ('11111111-1111-4111-8111-111111111120', 'PSYC 100', 'Principles of Psychology', 'Introduction to scientific study of behaviour and mind.', null, 3.0, 'Faculty of Arts and Science', 1);

-- ---------------------------------------------------------------------------
-- Distributions: resolve course_id from course_code so FK always matches catalog rows
-- ---------------------------------------------------------------------------

insert into public.course_distributions (course_id, term, enrollment, average_gpa, grade_counts)
select
  c.id,
  v.term,
  v.enrollment,
  v.average_gpa,
  v.grade_counts
from
  (
    values
      ('CISC 101', 'Fall 2024', 248, 3.22, '[10, 16, 22, 32, 18, 12]'::jsonb),
      ('CISC 124', 'Winter 2025', 198, 3.05, '[12, 18, 24, 28, 14, 4]'::jsonb),
      ('CISC 223', 'Fall 2024', 156, 2.88, '[8, 14, 26, 34, 16, 2]'::jsonb),
      ('ELEC 252', 'Winter 2025', 132, 2.71, '[6, 12, 28, 36, 14, 4]'::jsonb),
      ('APSC 142', 'Fall 2024', 412, 3.12, '[14, 20, 26, 26, 10, 4]'::jsonb),
      ('MATH 110', 'Fall 2024', 520, 2.64, '[22, 28, 30, 24, 18, 8]'::jsonb),
      ('MATH 120', 'Winter 2025', 480, 2.78, '[18, 24, 32, 26, 16, 4]'::jsonb),
      ('STAT 263', 'Fall 2024', 310, 2.93, '[10, 18, 28, 32, 18, 12]'::jsonb),
      ('ECON 110', 'Winter 2025', 540, 3.18, '[16, 22, 28, 24, 12, 8]'::jsonb),
      ('COMM 163', 'Fall 2024', 290, 3.35, '[18, 24, 26, 22, 8, 2]'::jsonb),
      ('CHEM 112', 'Winter 2025', 420, 2.69, '[14, 22, 28, 28, 14, 4]'::jsonb),
      ('PHYS 117', 'Fall 2024', 380, 2.81, '[12, 20, 30, 30, 16, 2]'::jsonb),
      ('BIOL 102', 'Fall 2024', 360, 3.02, '[14, 20, 26, 28, 18, 4]'::jsonb),
      ('MECH 211', 'Winter 2025', 220, 2.77, '[8, 16, 28, 36, 16, 6]'::jsonb),
      ('CLST 200', 'Fall 2024', 185, 3.41, '[20, 26, 24, 20, 8, 2]'::jsonb),
      ('CLST 200', 'Winter 2025', 172, 3.38, '[18, 28, 26, 18, 8, 2]'::jsonb),
      ('GPHY 101', 'Fall 2024', 210, 3.08, '[14, 22, 28, 26, 14, 6]'::jsonb),
      ('GPHY 101', 'Winter 2025', 198, 3.11, '[16, 22, 28, 24, 14, 6]'::jsonb),
      ('MTHE 224', 'Fall 2024', 142, 2.58, '[6, 12, 26, 38, 18, 6]'::jsonb),
      ('MTHE 224', 'Winter 2025', 138, 2.62, '[8, 14, 28, 36, 16, 4]'::jsonb)
  ) as v(course_code, term, enrollment, average_gpa, grade_counts)
  inner join public.courses c on c.course_code = v.course_code;

-- FILM 110, KNPE 103, PSYC 100: no rows here (comments-only tier).

-- Fail fast if JOIN missed a row (unknown course_code in VALUES) or duplicates slipped in
do $$
begin
  if (select count(*) from public.courses) <> 20 then
    raise exception 'seed: expected 20 courses, got %', (select count(*) from public.courses);
  end if;

  if (select count(*) from public.course_distributions) <> 20 then
    raise exception
      'seed: expected 20 course_distributions (check course_code in VALUES), got %',
      (select count(*) from public.course_distributions);
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- rag_chunks: each (source, course_code, ...) row joined to courses by course_code
-- ---------------------------------------------------------------------------

insert into public.rag_chunks (
  source,
  course_code,
  text,
  professor_name,
  source_url,
  tags,
  upvotes,
  quality_rating,
  difficulty_rating,
  sentiment_label,
  created_at
)
select
  v.source,
  c.course_code,
  v.chunk_text,
  v.professor_name,
  v.source_url,
  v.tags,
  v.upvotes,
  v.quality_rating,
  v.difficulty_rating,
  v.sentiment_label,
  v.created_at::timestamptz
from
  (
    values
      ('reddit', 'CISC 101', 'Labs are a bit long but the specs are clear. Midterm was easier than practice tests if you drill the coding exercises.', 'Prof. Ada Morgan', 'https://example.com/dev/reddit/cisc101-a', '[]'::jsonb, 42, null::numeric, null::numeric, 'positive', '2024-09-18 14:20:00+00'),
      ('reddit', 'CISC 101', 'First-year taking it online — Piazza was active, TAs responded within a day. Final project was the hardest part.', null, 'https://example.com/dev/reddit/cisc101-b', '[]'::jsonb, 19, null, null, 'neutral', '2024-10-02 18:05:00+00'),
      ('ratemyprofessors', 'CISC 101', 'Explains recursion slowly and draws lots of diagrams. Evals are fair; weekly quizzes keep you honest.', 'Prof. Ada Morgan', 'https://example.com/dev/rmp/cisc101-a', '["Caring", "Clear grading criteria", "Amazing lectures"]'::jsonb, 0, 4.3, 2.4, 'positive', '2024-08-11 12:00:00+00'),
      ('ratemyprofessors', 'CISC 101', 'High workload but you learn a ton. Office hours saved me before the midterm.', 'Prof. Ada Morgan', 'https://example.com/dev/rmp/cisc101-b', '["Lots of homework", "Gives good feedback"]'::jsonb, 0, 4.0, 3.5, 'positive', '2024-09-01 09:15:00+00'),
      ('reddit', 'CISC 124', 'Projects ramp up fast after reading week — pair programming helped.', 'Prof. Jordan Lee', 'https://example.com/dev/reddit/cisc124-a', '[]'::jsonb, 31, null, null, 'neutral', '2025-01-10 16:40:00+00'),
      ('ratemyprofessors', 'CISC 124', 'Tough but organized. Code style matters on assignments.', 'Prof. Jordan Lee', 'https://example.com/dev/rmp/cisc124-a', '["Tough grader", "Test heavy", "Respected"]'::jsonb, 0, 3.6, 4.1, 'neutral', '2025-01-22 11:30:00+00'),
      ('reddit', 'CISC 223', 'Heavy on notation — start assignments the day they drop.', null, 'https://example.com/dev/reddit/cisc223-a', '[]'::jsonb, 12, null, null, 'neutral', '2024-11-05 20:10:00+00'),
      ('ratemyprofessors', 'CISC 223', 'Dry lectures but exams match the homework closely.', 'Prof. Sam Okonkwo', 'https://example.com/dev/rmp/cisc223-a', '["Lecture heavy", "Clear grading criteria"]'::jsonb, 0, 3.2, 3.9, 'neutral', '2024-10-19 15:00:00+00'),
      ('reddit', 'APSC 142', 'Python + MATLAB mix — engineering schedulers have no mercy. Worth it once you survive midterms.', null, 'https://example.com/dev/reddit/apsc142-a', '[]'::jsonb, 55, null, null, 'positive', '2024-09-25 17:50:00+00'),
      ('ratemyprofessors', 'APSC 142', 'Fast pace; use the practice workshop sessions.', 'Prof. Lin Chen', 'https://example.com/dev/rmp/apsc142-a', '["Test heavy", "Accessible outside class"]'::jsonb, 0, 3.8, 3.2, 'neutral', '2024-08-30 14:40:00+00'),
      ('reddit', 'MATH 110', 'WebWork every week — keep up or the late policy will hurt.', null, 'https://example.com/dev/reddit/math110-a', '[]'::jsonb, 27, null, null, 'neutral', '2024-10-14 12:12:00+00'),
      ('ratemyprofessors', 'MATH 110', 'Clear proofs on the board; final was long but fair.', 'Prof. Mara Singh', 'https://example.com/dev/rmp/math110-a', '["Graded by few things", "Extra credit"]'::jsonb, 0, 4.2, 2.8, 'positive', '2024-07-20 16:00:00+00'),
      ('reddit', 'MATH 120', 'Integration unit hits hard — do every suggested problem.', null, 'https://example.com/dev/reddit/math120-a', '[]'::jsonb, 22, null, null, 'neutral', '2025-01-18 19:00:00+00'),
      ('ratemyprofessors', 'MATH 120', 'Weekly quizzes saved my grade; go to DGD.', 'Prof. Eli Frost', 'https://example.com/dev/rmp/math120-a', '["Beware of pop quizzes", "Gives good feedback"]'::jsonb, 0, 3.9, 3.4, 'neutral', '2024-12-03 11:11:00+00'),
      ('reddit', 'ECON 110', 'Term paper was chill; exams are all multiple choice if you have Prof section A.', null, 'https://example.com/dev/reddit/econ110-a', '[]'::jsonb, 33, null, null, 'positive', '2025-02-14 21:00:00+00'),
      ('ratemyprofessors', 'ECON 110', 'Uses lots of real-world examples; curve helped.', 'Prof. Alex Roy', 'https://example.com/dev/rmp/econ110-a', '["Hilarious", "Inspirational"]'::jsonb, 0, 4.4, 2.1, 'positive', '2024-08-22 13:45:00+00'),
      ('reddit', 'COMM 163', 'Group contracts matter in week 2 — do not skip that lecture.', null, 'https://example.com/dev/reddit/comm163-a', '[]'::jsonb, 18, null, null, 'neutral', '2024-10-30 15:15:00+00'),
      ('ratemyprofessors', 'COMM 163', 'Smith curve myth — still work hard on the presentation.', 'Prof. Taylor Brooks', 'https://example.com/dev/rmp/comm163-a', '["Participation matters", "So many papers"]'::jsonb, 0, 3.7, 3.0, 'neutral', '2024-09-14 09:00:00+00'),
      ('reddit', 'CHEM 112', 'Lab TAs grade harsh on notebook — be extra detailed in procedure notes.', null, 'https://example.com/dev/reddit/chem112-a', '[]'::jsonb, 24, null, null, 'neutral', '2025-01-05 12:50:00+00'),
      ('ratemyprofessors', 'CHEM 112', 'Clicker questions every lecture; keeps you awake in the 8:30.', 'Prof. Nina Volkov', 'https://example.com/dev/rmp/chem112-a', '["Test heavy", "Graded by few things"]'::jsonb, 0, 3.1, 4.0, 'neutral', '2024-07-11 14:20:00+00'),
      ('reddit', 'PHYS 117', 'MasteringPhysics is the real course — lectures are supplementary.', null, 'https://example.com/dev/reddit/phys117-a', '[]'::jsonb, 41, null, null, 'negative', '2024-09-19 08:00:00+00'),
      ('ratemyprofessors', 'PHYS 117', 'Demo-heavy; midterm averages were low historically.', 'Prof. Chris Dalton', 'https://example.com/dev/rmp/phys117-a', '["Tough grader", "Skip class? You won''t pass."]'::jsonb, 0, 2.9, 4.2, 'negative', '2024-08-05 17:00:00+00'),
      ('reddit', 'BIOL 102', 'Memorization heavy — Anki decks from upper years help.', null, 'https://example.com/dev/reddit/biol102-a', '[]'::jsonb, 16, null, null, 'neutral', '2024-10-21 19:30:00+00'),
      ('ratemyprofessors', 'BIOL 102', 'Engaging stories in lecture; exam detail level is intense.', 'Prof. Harper Quinn', 'https://example.com/dev/rmp/biol102-a', '["Get ready to read", "Caring"]'::jsonb, 0, 4.0, 3.3, 'positive', '2024-07-30 10:10:00+00'),
      ('reddit', 'MECH 211', 'Dynamics problems are all about free-body diagrams — drill F=ma setups.', null, 'https://example.com/dev/reddit/mech211-a', '[]'::jsonb, 9, null, null, 'neutral', '2025-02-02 14:00:00+00'),
      ('ratemyprofessors', 'MECH 211', 'Exams are open-formula sheet; time pressure is real.', 'Prof. Samira Haddad', 'https://example.com/dev/rmp/mech211-a', '["Test heavy", "Clear grading criteria"]'::jsonb, 0, 3.5, 4.0, 'neutral', '2025-01-12 11:45:00+00'),
      ('reddit', 'CLST 200', 'Reading is manageable if you skim — essays need citations from lecture slides.', null, 'https://example.com/dev/reddit/clst200-a', '[]'::jsonb, 21, null, null, 'positive', '2024-09-12 13:00:00+00'),
      ('ratemyprofessors', 'CLST 200', 'Passionate about Ovid; take good notes on themes.', 'Prof. Julian Marks', 'https://example.com/dev/rmp/clst200-a', '["Inspirational", "Amazing lectures"]'::jsonb, 0, 4.5, 2.0, 'positive', '2024-08-18 15:30:00+00'),
      ('reddit', 'GPHY 101', 'Map assignments in GIS are fun once you get the hang of layers.', null, 'https://example.com/dev/reddit/gphy101-a', '[]'::jsonb, 11, null, null, 'positive', '2024-10-01 12:00:00+00'),
      ('ratemyprofessors', 'GPHY 101', 'Field trip day is worth dressing for the weather.', 'Prof. Riley Kim', 'https://example.com/dev/rmp/gphy101-a', '["Group projects", "Accessible outside class"]'::jsonb, 0, 3.8, 2.6, 'positive', '2024-07-25 09:20:00+00'),
      ('reddit', 'MTHE 224', 'ODE section is fine; systems of equations unit needs more practice than you think.', null, 'https://example.com/dev/reddit/mthe224-a', '[]'::jsonb, 7, null, null, 'neutral', '2024-11-14 20:00:00+00'),
      ('ratemyprofessors', 'MTHE 224', 'Weekly assignments; half the class lives in the math help centre.', 'Prof. Wei Zhang', 'https://example.com/dev/rmp/mthe224-a', '["Lots of homework", "Lecture heavy"]'::jsonb, 0, 3.0, 3.8, 'neutral', '2024-08-29 16:45:00+00'),
      ('reddit', 'FILM 110', 'Weekly film screenings are not optional — they show up on the quiz.', null, 'https://example.com/dev/reddit/film110-a', '[]'::jsonb, 28, null, null, 'positive', '2024-09-22 18:00:00+00'),
      ('ratemyprofessors', 'FILM 110', 'Paper grading is subjective; go to office hours for thesis feedback.', 'Prof. Casey Lowell', 'https://example.com/dev/rmp/film110-a', '["Gives good feedback", "Get ready to read"]'::jsonb, 0, 4.1, 2.9, 'positive', '2024-08-14 13:10:00+00'),
      ('reddit', 'KNPE 103', 'Anatomy lab photos for exams — make your own labeled atlas early.', null, 'https://example.com/dev/reddit/knpe103-a', '[]'::jsonb, 15, null, null, 'neutral', '2024-10-08 10:20:00+00'),
      ('ratemyprofessors', 'KNPE 103', 'High volume of memorization; pacing is relentless after midterm.', 'Prof. Morgan Reyes', 'https://example.com/dev/rmp/knpe103-a', '["Test heavy", "Extra credit"]'::jsonb, 0, 3.6, 3.5, 'neutral', '2024-07-19 11:00:00+00'),
      ('reddit', 'PSYC 100', 'Research participation credits are easy if you sign up early in the term.', null, 'https://example.com/dev/reddit/psyc100-a', '[]'::jsonb, 61, null, null, 'positive', '2024-09-30 17:45:00+00'),
      ('ratemyprofessors', 'PSYC 100', 'Big auditorium class — clickers for attendance.', 'Prof. Avery Cole', 'https://example.com/dev/rmp/psyc100-a', '["Online savvy", "Hilarious"]'::jsonb, 0, 4.0, 2.2, 'positive', '2024-08-01 14:00:00+00'),
      ('reddit', 'PHYS 117', 'If you did 4U physics this course starts slow then slams you week 6.', null, 'https://example.com/dev/reddit/phys117-b', '[]'::jsonb, 6, null, null, 'neutral', '2024-10-05 09:00:00+00'),
      ('reddit', 'COMM 163', 'Accounting mini-module was surprisingly the hardest part for our group.', null, 'https://example.com/dev/reddit/comm163-b', '[]'::jsonb, 4, null, null, 'neutral', '2024-11-18 22:10:00+00'),
      ('ratemyprofessors', 'MECH 211', 'Good use of tutorial time for sample exam problems.', 'Prof. Samira Haddad', 'https://example.com/dev/rmp/mech211-b', '["Respected"]'::jsonb, 0, 3.6, 3.9, 'neutral', '2025-02-01 08:15:00+00')
  ) as v(source, course_code, chunk_text, professor_name, source_url, tags, upvotes, quality_rating, difficulty_rating, sentiment_label, created_at)
  inner join public.courses c on c.course_code = v.course_code;

-- ELEC 252, STAT 263 deliberately have no rag_chunks (grade-only tier).

do $$
begin
  -- INNER JOIN above drops rows if course_code typos; exact count catches that.
  if (select count(*) from public.rag_chunks) <> 41 then
    raise exception
      'seed: expected 41 rag_chunks (check for typo in VALUES course_code), got %',
      (select count(*) from public.rag_chunks);
  end if;

  if exists (
    select
      1
    from
      public.rag_chunks r
      left join public.courses c on c.course_code = r.course_code
    where
      c.id is null
  ) then
    raise exception 'seed integrity: rag_chunks references unknown course_code';
  end if;

  if exists (
    select
      1
    from
      public.course_distributions d
      left join public.courses c on c.id = d.course_id
    where
      c.id is null
  ) then
    raise exception 'seed integrity: orphaned course_distributions row';
  end if;
end $$;
