-- ============================================================================
-- Allow more than one schedule day per calendar date.
-- The chief can End Day and immediately start a fresh day, even on the same
-- date. Drops the unique(date) constraint added in 0001.
-- ============================================================================
alter table public.schedule_days drop constraint if exists schedule_days_date_key;

-- The activity log no longer records who made each change, so the foreign key
-- to users is unnecessary. Drop it if present (column kept, now always null).
alter table public.activity_log drop constraint if exists activity_log_changed_by_fkey;
