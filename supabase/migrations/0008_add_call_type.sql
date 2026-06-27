-- ============================================================================
-- Categorize 24-hour shifts by call type: Call 1, Call 2, Call 3, OB
-- (for existing databases). Existing shifts default to Call 1.
-- ============================================================================
do $$
begin
  if not exists (select 1 from pg_type where typname = 'call_type') then
    create type call_type as enum ('call_1', 'call_2', 'call_3', 'call_4', 'ob');
  end if;
end$$;

alter table public.resident_24hr
  add column if not exists call_type call_type not null default 'call_1';
