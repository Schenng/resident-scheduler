-- ============================================================================
-- Fixed room seed. Run once after 0001_init.sql.
-- Rooms are never created, edited, or deleted through the app.
-- ============================================================================
insert into public.rooms (label, section, sort_order) values
  -- Main OR
  ('OR1',     'main_or', 1),
  ('OR2',     'main_or', 2),
  ('OR3',     'main_or', 3),
  ('OR4',     'main_or', 4),
  ('OR5',     'main_or', 5),
  ('OR6',     'main_or', 6),
  ('OR7',     'main_or', 7),
  ('OR8',     'main_or', 8),
  ('OR9/10',  'main_or', 9),
  ('OR11',    'main_or', 10),
  ('OR12',    'main_or', 11),
  -- SDS
  ('SDS1',    'sds', 1),
  ('SDS2',    'sds', 2),
  ('SDS3',    'sds', 3),
  ('SDS4',    'sds', 4),
  ('SDS5',    'sds', 5),
  -- Endo
  ('Endo 1',  'endo', 1),
  ('Endo 2',  'endo', 2),
  ('Endo 3',  'endo', 3),
  ('Endo 4',  'endo', 4),
  ('Endo 5',  'endo', 5),
  ('Endo 6',  'endo', 6),
  -- Special
  ('OA',      'special', 1),
  ('OB',      'special', 2),
  ('NITV',    'special', 3),
  ('TEE',     'special', 4),
  ('CT',      'special', 5),
  ('CATH',    'special', 6),
  ('A.PAIN',  'special', 7),
  ('C.PAIN',  'special', 8),
  ('PAT',     'special', 9),
  ('PACU',    'special', 10),
  ('SICU',    'special', 11),
  ('PICU',    'special', 12);
