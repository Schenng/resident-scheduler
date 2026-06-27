-- ============================================================================
-- Rename Endo rooms to all-caps, no space: "Endo 1" → "END1" (for existing
-- databases). Matches on the old label so it's safe to re-run.
-- ============================================================================
update public.rooms set label = 'END1' where label = 'Endo 1';
update public.rooms set label = 'END2' where label = 'Endo 2';
update public.rooms set label = 'END3' where label = 'Endo 3';
update public.rooms set label = 'END4' where label = 'Endo 4';
update public.rooms set label = 'END5' where label = 'Endo 5';
update public.rooms set label = 'END6' where label = 'Endo 6';
