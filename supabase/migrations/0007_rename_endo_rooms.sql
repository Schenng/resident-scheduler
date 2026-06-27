-- ============================================================================
-- Rename Endo rooms to all-caps, no space: "Endo 1" → "ENDO1" (for existing
-- databases). Matches on the old label so it's safe to re-run.
-- ============================================================================
update public.rooms set label = 'ENDO1' where label = 'Endo 1';
update public.rooms set label = 'ENDO2' where label = 'Endo 2';
update public.rooms set label = 'ENDO3' where label = 'Endo 3';
update public.rooms set label = 'ENDO4' where label = 'Endo 4';
update public.rooms set label = 'ENDO5' where label = 'Endo 5';
update public.rooms set label = 'ENDO6' where label = 'Endo 6';
