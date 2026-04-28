-- Enforce at the DB level that a user can only have one processed upload per term.
-- The application already guards this in the upload route (step 6), but without a
-- DB-level constraint a race condition can produce duplicate processed rows.
create unique index distribution_uploads_user_term_processed_unique
  on public.distribution_uploads (user_id, term)
  where status = 'processed';
