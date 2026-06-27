-- ============================================================================
-- Seed residents + their 2026–2027 vacation weeks (each entry = a 7-day week).
-- Idempotent: skips residents and availability rows that already exist.
-- Run in the Supabase SQL Editor.
-- ============================================================================

-- 1. Residents (first_name blank where only a surname is known).
insert into public.residents (first_name, last_name)
select v.first_name, v.last_name
from (values
  ('', 'Ahmad'),
  ('', 'Bansal'),
  ('', 'Bhatt'),
  ('', 'Boah'),
  ('', 'Boyette'),
  ('', 'Churchill'),
  ('', 'Edighoffer'),
  ('', 'Fernandes'),
  ('', 'Gravier-Leon'),
  ('', 'Hess'),
  ('', 'Ivezaj'),
  ('', 'Kim'),
  ('', 'Louis'),
  ('', 'Milford'),
  ('', 'Moi'),
  ('', 'Muchintala'),
  ('', 'Nandlal'),
  ('', 'Oveisitork'),
  ('', 'Owoade'),
  ('M.', 'Patel'),
  ('', 'Rajkumar'),
  ('', 'Richter'),
  ('', 'Silverberg'),
  ('', 'Thomas')
) as v(first_name, last_name)
where not exists (
  select 1 from public.residents r
  where r.last_name = v.last_name and r.first_name = v.first_name
);

-- 2. Vacation weeks. Each (surname, week start) expands to 7 days.
with sched(last_name, week_start) as (values
  ('Bhatt', date '2026-08-03'),
  ('Boah', date '2026-08-03'),
  ('Ivezaj', date '2026-08-10'),
  ('Ahmad', date '2026-08-10'),
  ('Gravier-Leon', date '2026-08-17'),
  ('Nandlal', date '2026-08-17'),
  ('Kim', date '2026-08-24'),
  ('Muchintala', date '2026-08-24'),
  ('Bansal', date '2026-08-31'),
  ('Hess', date '2026-08-31'),
  ('Louis', date '2026-09-07'),
  ('Fernandes', date '2026-09-07'),
  ('Milford', date '2026-09-14'),
  ('Rajkumar', date '2026-09-14'),
  ('Oveisitork', date '2026-09-21'),
  ('Thomas', date '2026-09-21'),
  ('Richter', date '2026-09-28'),
  ('Boyette', date '2026-09-28'),
  ('Churchill', date '2026-10-05'),
  ('Silverberg', date '2026-10-05'),
  ('Moi', date '2026-10-12'),
  ('Nandlal', date '2026-10-12'),
  ('Edighoffer', date '2026-10-19'),
  ('Patel', date '2026-10-19'),
  ('Fernandes', date '2026-10-26'),
  ('Oveisitork', date '2026-10-26'),
  ('Gravier-Leon', date '2026-11-02'),
  ('Milford', date '2026-11-02'),
  ('Hess', date '2026-11-09'),
  ('Bhatt', date '2026-11-09'),
  ('Hess', date '2026-11-16'),
  ('Thomas', date '2026-11-16'),
  ('Owoade', date '2026-11-23'),
  ('Boyette', date '2026-11-23'),
  ('Rajkumar', date '2026-11-30'),
  ('Boah', date '2026-11-30'),
  ('Richter', date '2026-12-07'),
  ('Churchill', date '2026-12-07'),
  ('Louis', date '2026-12-14'),
  ('Edighoffer', date '2026-12-14'),
  ('Kim', date '2026-12-21'),
  ('Patel', date '2026-12-21'),
  ('Muchintala', date '2026-12-28'),
  ('Ahmad', date '2026-12-28'),
  ('Bansal', date '2027-01-04'),
  ('Moi', date '2027-01-04'),
  ('Bansal', date '2027-01-11'),
  ('Thomas', date '2027-01-11'),
  ('Oveisitork', date '2027-01-18'),
  ('Churchill', date '2027-01-18'),
  ('Ivezaj', date '2027-01-25'),
  ('Milford', date '2027-01-25'),
  ('Fernandes', date '2027-02-01'),
  ('Owoade', date '2027-02-01'),
  ('Gravier-Leon', date '2027-02-08'),
  ('Rajkumar', date '2027-02-08'),
  ('Bhatt', date '2027-02-15'),
  ('Silverberg', date '2027-02-15'),
  ('Muchintala', date '2027-02-22'),
  ('Ahmad', date '2027-02-22'),
  ('Hess', date '2027-03-01'),
  ('Edighoffer', date '2027-03-01'),
  ('Louis', date '2027-03-08'),
  ('Ivezaj', date '2027-03-08'),
  ('Boah', date '2027-03-15'),
  ('Churchill', date '2027-03-15'),
  ('Richter', date '2027-03-22'),
  ('Owoade', date '2027-03-22'),
  ('Nandlal', date '2027-03-29'),
  ('Boyette', date '2027-03-29'),
  ('Thomas', date '2027-04-05'),
  ('Edighoffer', date '2027-04-05'),
  ('Moi', date '2027-04-12'),
  ('Owoade', date '2027-04-12'),
  ('Silverberg', date '2027-04-19'),
  ('Kim', date '2027-04-19'),
  ('Milford', date '2027-04-26'),
  ('Patel', date '2027-04-26'),
  ('Ahmad', date '2027-05-03'),
  ('Rajkumar', date '2027-05-03'),
  ('Boah', date '2027-05-10'),
  ('Fernandes', date '2027-05-10'),
  ('Gravier-Leon', date '2027-05-17'),
  ('Muchintala', date '2027-05-17'),
  ('Bhatt', date '2027-05-24'),
  ('Nandlal', date '2027-05-24'),
  ('Richter', date '2027-05-31'),
  ('Bansal', date '2027-05-31'),
  ('Patel', date '2027-06-07'),
  ('Silverberg', date '2027-06-07'),
  ('Louis', date '2027-06-14'),
  ('Moi', date '2027-06-14'),
  ('Oveisitork', date '2027-06-21'),
  ('Ivezaj', date '2027-06-21'),
  ('Boyette', date '2027-06-28'),
  ('Kim', date '2027-06-28')
),
days as (
  select s.last_name, (s.week_start + g)::date as day
  from sched s cross join generate_series(0, 6) as g
)
insert into public.resident_availability (resident_id, date, type)
select r.id, d.day, 'vacation'::availability_type
from days d
join public.residents r on r.last_name = d.last_name
where not exists (
  select 1 from public.resident_availability a
  where a.resident_id = r.id and a.date = d.day
);
