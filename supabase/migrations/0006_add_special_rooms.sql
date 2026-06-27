-- ============================================================================
-- Add new Special-section rooms (for existing databases). Idempotent: skips
-- any room whose label is already present.
-- ============================================================================
insert into public.rooms (label, section, sort_order)
select v.label, 'special'::room_section, v.sort_order
from (values
  ('A.PAIN', 7),
  ('C.PAIN', 8),
  ('PAT',    9),
  ('PACU',   10),
  ('SICU',   11),
  ('PICU',   12)
) as v(label, sort_order)
where not exists (
  select 1 from public.rooms r where r.label = v.label
);
