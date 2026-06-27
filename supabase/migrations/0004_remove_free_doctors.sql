-- ============================================================================
-- Remove the Free Doctors holding area (for existing databases).
-- The Unassigned pool (room_id = null) now serves this purpose.
-- Moves any slots still pointing at the Free Doctors room into the pool,
-- then deletes the room.
-- ============================================================================
update public.schedule_slots
set room_id = null
where room_id in (
  select id from public.rooms where section = 'free_doctors'
);

delete from public.rooms where section = 'free_doctors';
