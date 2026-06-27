-- ============================================================================
-- Add the "Call 4" value to the call_type enum (for databases that created the
-- enum before Call 4 existed). Safe to re-run.
-- Note: run this on its own — a new enum value can't be used in the same
-- transaction that adds it.
-- ============================================================================
alter type call_type add value if not exists 'call_4';
