-- ============================================================================
-- Split residents.name into first_name and last_name.
-- Existing rows are backfilled by splitting on the first space: everything
-- before it becomes the first name, the remainder the last name. Single-word
-- names go entirely into first_name (last_name left blank).
-- ============================================================================
alter table public.residents add column if not exists first_name text;
alter table public.residents add column if not exists last_name  text;

update public.residents
set
  first_name = trim(split_part(name, ' ', 1)),
  last_name  = trim(substr(name, length(split_part(name, ' ', 1)) + 2))
where first_name is null;

-- Guarantee non-null values before enforcing the constraint.
update public.residents set first_name = '' where first_name is null;
update public.residents set last_name  = '' where last_name  is null;

alter table public.residents alter column first_name set not null;
alter table public.residents alter column last_name  set not null;

alter table public.residents drop column name;
