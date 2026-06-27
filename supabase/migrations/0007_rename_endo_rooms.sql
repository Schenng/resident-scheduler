-- ============================================================================
-- Rename Endo rooms to all-caps, no space: END1..END6 (for existing databases).
-- Keyed on section + sort_order so it works regardless of the current label
-- text (e.g. "Endo 1", "ENDO1", …). Safe to re-run.
-- ============================================================================
update public.rooms
set label = 'END' || sort_order
where section = 'endo';
