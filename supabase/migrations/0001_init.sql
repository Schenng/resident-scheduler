-- ============================================================================
-- OR Schedule Manager — initial schema
-- Run in the Supabase SQL editor (or via the Supabase CLI) on a fresh project.
-- ============================================================================

-- ---------- Enums ----------------------------------------------------------
create type availability_type as enum ('vacation', 'sick', 'leave');
create type room_section      as enum ('main_or', 'sds', 'endo', 'special', 'free_doctors');
create type day_status        as enum ('draft', 'active', 'archived');
create type person_type       as enum ('attending', 'resident', 'crna');
create type action_type       as enum ('move', 'add', 'remove', 'swap');

-- ---------- users ----------------------------------------------------------
-- All authenticated users are chiefs with full access. Mirrors auth.users.
create table public.users (
  id    uuid primary key references auth.users (id) on delete cascade,
  email text not null
);

-- Keep public.users in sync with auth.users on signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- residents ------------------------------------------------------
create table public.residents (
  id         uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name  text not null,
  level      text,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- resident_availability (vacation / sick / leave) -----------------
create table public.resident_availability (
  id          uuid primary key default gen_random_uuid(),
  resident_id uuid not null references public.residents (id) on delete cascade,
  date        date not null,
  type        availability_type not null,
  note        text
);
create index resident_availability_resident_date_idx
  on public.resident_availability (resident_id, date);

-- ---------- resident_24hr (24-hour call shifts) ----------------------------
create table public.resident_24hr (
  id          uuid primary key default gen_random_uuid(),
  resident_id uuid not null references public.residents (id) on delete cascade,
  date        date not null,
  unique (resident_id, date)
);
create index resident_24hr_resident_date_idx
  on public.resident_24hr (resident_id, date);

-- ---------- resident_rotations (future use) --------------------------------
create table public.resident_rotations (
  id            uuid primary key default gen_random_uuid(),
  resident_id   uuid not null references public.residents (id) on delete cascade,
  rotation_name text not null,
  start_date    date not null,
  end_date      date not null
);

-- ---------- rooms (seeded once, never modified by the app) -----------------
create table public.rooms (
  id         uuid primary key default gen_random_uuid(),
  label      text not null,
  section    room_section not null,
  sort_order int not null
);

-- ---------- schedule_days --------------------------------------------------
create table public.schedule_days (
  id         uuid primary key default gen_random_uuid(),
  date       date not null unique,
  status     day_status not null default 'draft',
  started_at timestamptz,
  ended_at   timestamptz
);

-- ---------- schedule_slots -------------------------------------------------
create table public.schedule_slots (
  id          uuid primary key default gen_random_uuid(),
  day_id      uuid not null references public.schedule_days (id) on delete cascade,
  room_id     uuid references public.rooms (id),          -- null = unassigned pool
  person_name text not null,
  person_type person_type not null,
  resident_id uuid references public.residents (id),      -- set when person_type = resident
  position    int not null default 0
);
create index schedule_slots_day_idx      on public.schedule_slots (day_id);
create index schedule_slots_resident_idx on public.schedule_slots (resident_id);

-- ---------- activity_log ---------------------------------------------------
create table public.activity_log (
  id          uuid primary key default gen_random_uuid(),
  day_id      uuid not null references public.schedule_days (id) on delete cascade,
  timestamp   timestamptz not null default now(),
  action_type action_type not null,
  person_name text not null,
  person_type person_type not null,
  from_room   text,
  to_room     text,
  changed_by  uuid references public.users (id)
);
create index activity_log_day_idx on public.activity_log (day_id);

-- ============================================================================
-- Row Level Security
-- Every authenticated user is a chief with full access. Policies simply
-- require an authenticated session; there are no per-row restrictions.
-- ============================================================================
alter table public.users                 enable row level security;
alter table public.residents             enable row level security;
alter table public.resident_availability enable row level security;
alter table public.resident_24hr         enable row level security;
alter table public.resident_rotations    enable row level security;
alter table public.rooms                 enable row level security;
alter table public.schedule_days         enable row level security;
alter table public.schedule_slots        enable row level security;
alter table public.activity_log          enable row level security;

-- Full read/write for any authenticated user on the operational tables.
do $$
declare
  t text;
begin
  foreach t in array array[
    'residents', 'resident_availability', 'resident_24hr',
    'resident_rotations', 'schedule_days', 'schedule_slots', 'activity_log'
  ]
  loop
    execute format(
      'create policy %I on public.%I for all to authenticated using (true) with check (true);',
      t || '_authenticated_all', t
    );
  end loop;
end $$;

-- users: a chief may read all chief records and update only their own row.
create policy users_select_authenticated
  on public.users for select to authenticated using (true);
create policy users_modify_self
  on public.users for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- rooms: read-only from the app. No insert/update/delete policies → blocked.
create policy rooms_select_authenticated
  on public.rooms for select to authenticated using (true);
