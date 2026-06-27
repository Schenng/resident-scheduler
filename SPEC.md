# OR Schedule Manager — Technical Specification

> Reflects the current state of the build, including changes made after the
> original spec: the Free Doctors section was removed, multiple schedule days
> per calendar date are allowed, and the activity log was simplified.

## Overview

A mobile-first web app for the chief of anesthesia to manage daily operating room assignments and resident logistics. Only chiefs can log in and they have full access to everything.

---

## Tech Stack

- **Frontend:** Next.js 14 (App Router) + Tailwind CSS, mobile-first
- **Backend / DB / Auth:** Supabase — Postgres database, Supabase Auth
- **Hosting:** Vercel

---

## Three Core Sections

### 1. Daily Schedule
The current day's operations board. All logged-in users (chiefs) have full edit access.

### 2. Previous Schedules
A browsable archive of every completed day. Read-only by nature — archived days are frozen records.

### 3. Resident Hub
Resident roster and calendar management.

---

## Section 1: Daily Schedule

### Day Lifecycle

```
Draft → [Start Day] → Active → [End Day] → Archived
                         ↕
                     Activity log (append-only)
```

- The Daily Schedule shows the current **open** day — the one whose status is `draft` or `active`. Archived days move to the Previous tab.
- After **End Day**, there is no open day, so the chief can immediately **Start a new day** — even on the same calendar date. Multiple schedule days per date are allowed (there is no unique constraint on the date).

#### Draft Mode
- Chief creates a new schedule for the current day
- Enters attending names and their initial room assignments (attendings arrive pre-paired with a room)
- Fills in residents and CRNAs into room slots
- Resident statuses are derived automatically from the Resident Hub — no manual status entry
- Schedule is editable with no logging yet
- A "Start Day" button is visible when the draft is ready

#### Active Mode
- Triggered by chief pressing "Start Day"
- Records `started_at` timestamp on `schedule_days`
- Every subsequent change is timestamped and appended to the activity log
- Chief can still move anyone freely: attendings, residents, CRNAs
- An "Activity Log" page is accessible showing all changes since start
- An "End Day" button is visible

#### End Day
- Chief presses "End Day" to close out
- Records `ended_at` timestamp
- Status changes to `archived`
- The final schedule state and complete activity log are frozen as a read-only record
- The chief can immediately start a new draft (same date or any date)

### Board Layout

Rooms are **fixed and hardcoded** — they never change. The chief cannot add or remove rooms. The board is always organized into the following sections and rooms, displayed in this exact order:

#### Main OR
OR1, OR2, OR3, OR4, OR5, OR6, OR7, OR8, OR9/10, OR11, OR12

#### SDS (Same Day Surgery)
SDS1, SDS2, SDS3, SDS4, SDS5

#### Endo
END1, END2, END3, END4, END5, END6

#### Special
OA, OB, NITV, TEE, CT, CATH, A.PAIN, C.PAIN, PAT, PACU, SICU, PICU

> **Note:** The "Free Doctors" section has been removed. The Unassigned pool at
> the bottom of the board already serves as the holding area for personnel who
> are available but not yet placed in a room.

Each room card contains slots for:
- One or more **attendings** (blue chip)
- One or more **residents** (green chip, with status label if applicable)
- One or more **CRNAs** (amber chip)

An **unassigned pool** at the bottom holds any personnel not yet placed in any room.

### Personnel Types

| Type | Managed in app? | Calendars? | How they appear on the board |
|---|---|---|---|
| Attending | No | No | Chief types name freeform; starts paired with a room; can be moved |
| CRNA | No | No | Chief types name freeform; placed into any room slot freely |
| Resident | Yes (Resident Hub) | Yes | Pulled from roster; status derived automatically |

### Resident Status on the Board

Statuses are computed from the Resident Hub calendars. The chief does not set these manually on the Daily Schedule.

| Status | Condition | Board display |
|---|---|---|
| On | Default — no calendar entries for this date | Assignable, no label |
| Pre-call | The day before an entered 24-hour shift | Assignable, labeled "pre-call" |
| 24-hour | A 24-hour shift is entered for this date | Assignable, labeled "24" |
| Post-call | The day after an entered 24-hour shift | Greyed out, unassignable |
| Off | Vacation/sick/leave covers this date | Greyed out, unassignable |

Post-call and Off residents appear in the unassigned pool greyed out (visible but not draggable/assignable).

### Interactions

- **Desktop:** drag-and-drop to move personnel between rooms and the pool
- **Mobile:** tap a chip to select, then tap a destination room to place
- **Adding to a room:** tap/click an empty slot to type in an attending or CRNA name, or select a resident from the pool
- **Removing from a room:** tap/click a chip and remove, returning them to the pool

### Activity Log (simplified)

Displayed as a panel/drawer accessible while the day is active, and shown read-only on each archived day. The log records **only who moved and where they moved to** — intentionally minimal.

Each entry shows:

- Time
- Person name
- Destination — the room they were placed in, or "Unassigned" when removed from the board

No actor ("changed by"), no from→to room pair, and no action verb are surfaced. Log writes occur only while the day is `active`; draft-mode setup is silent. A failed log write never blocks or undoes the move itself.

---

## Section 2: Previous Schedules

- List of all archived days, sorted by date descending; each item shows the date and the end time (so multiple days on the same date are distinguishable)
- Each day shows:
  - Date
  - Final room assignments grouped by section (read-only snapshot)
  - Full activity log for that day (person → destination)
- Read-only for all users

---

## Section 3: Resident Hub

Chief-only. Manage the resident roster and per-resident calendars.

### Resident Roster

- Add a new resident (name, year/level)
- Edit a resident's name or year/level
- Deactivate a resident (soft delete — preserves history)
- View a resident's full calendar and assignment history

### Per-Resident Calendars

Each resident has three calendars:

#### Vacation Schedule
- The chief marks individual dates or date ranges as: Vacation, Sick, or Leave
- On any covered date the resident's status is **Off** (greyed out, unassignable)

#### 24-Hour Schedule
- The chief enters individual dates when the resident is on a 24-hour call shift
- The system automatically derives:
  - Day before → **Pre-call**
  - The entered date → **24-hour**
  - Day after → **Post-call** (off, unassignable)
- No times are tracked — all statuses are day-level only

#### Rotation Schedule *(stubbed for future use)*
- Tracks which clinical rotation a resident is on (e.g. cardiac, OB, pain, general)
- Stored with start and end dates; not used in any scheduling logic currently

### Conflict Handling

If a vacation entry and a 24-hour shift entry overlap on the same date, **vacation takes priority** and the resident is marked Off. The chief is shown a warning when this occurs.

### Resident Assignment History

Each resident's profile shows a read-only log of every room they've been assigned to, pulled from the archived `schedule_slots`, ordered by date descending.

---

## Database Schema

### `users` *(currently unused)*
Mirrors Supabase `auth.users` via a trigger. It was originally referenced by `activity_log.changed_by`, but the simplified log no longer records the actor, so this table is not used by the app. Authentication relies on Supabase's built-in `auth.users`. The table can be kept (harmless) or dropped.

| Column | Type | Notes |
|---|---|---|
| id | uuid | Supabase auth UID |
| email | text | |

### `residents`
| Column | Type | Notes |
|---|---|---|
| id | uuid | |
| first_name | text | |
| last_name | text | |
| level | text | e.g. PGY-1, PGY-2 |
| active | bool | Soft delete flag |
| created_at | timestamp | |

### `resident_availability`
| Column | Type | Notes |
|---|---|---|
| id | uuid | |
| resident_id | uuid FK | |
| date | date | |
| type | enum | `vacation`, `sick`, `leave` |
| note | text | Optional |

### `resident_24hr`
| Column | Type | Notes |
|---|---|---|
| id | uuid | |
| resident_id | uuid FK | |
| date | date | The date of the 24-hour shift |

### `resident_rotations` *(future)*
| Column | Type | Notes |
|---|---|---|
| id | uuid | |
| resident_id | uuid FK | |
| rotation_name | text | e.g. Cardiac, OB, Pain |
| start_date | date | |
| end_date | date | |

### `rooms` *(seeded at setup — never modified by the app)*
| Column | Type | Notes |
|---|---|---|
| id | uuid | |
| label | text | e.g. "OR1", "SDS2", "END3" |
| section | enum | `main_or`, `sds`, `endo`, `special` |
| sort_order | int | Controls display order within section |

Seed list (Free Doctors removed):

**main_or (sort 1–11):** OR1, OR2, OR3, OR4, OR5, OR6, OR7, OR8, OR9/10, OR11, OR12
**sds (sort 1–5):** SDS1, SDS2, SDS3, SDS4, SDS5
**endo (sort 1–6):** END1, END2, END3, END4, END5, END6
**special (sort 1–12):** OA, OB, NITV, TEE, CT, CATH, A.PAIN, C.PAIN, PAT, PACU, SICU, PICU

### `schedule_days`
| Column | Type | Notes |
|---|---|---|
| id | uuid | |
| date | date | **Not unique** — multiple days per date allowed |
| status | enum | `draft`, `active`, `archived` |
| started_at | timestamp | Set when chief hits Start Day |
| ended_at | timestamp | Set when chief hits End Day |

### `schedule_slots`
| Column | Type | Notes |
|---|---|---|
| id | uuid | |
| day_id | uuid FK | |
| room_id | uuid FK | Nullable — null means unassigned pool |
| person_name | text | Freeform for attendings and CRNAs |
| person_type | enum | `attending`, `resident`, `crna` |
| resident_id | uuid FK | Nullable — populated if person_type is resident |
| position | int | Slot order within a room |

### `activity_log` *(simplified)*
| Column | Type | Notes |
|---|---|---|
| id | uuid | |
| day_id | uuid FK | |
| timestamp | timestamp | |
| action_type | enum | `move`, `add`, `remove`, `swap` (stored, not surfaced) |
| person_name | text | |
| person_type | enum | `attending`, `resident`, `crna` |
| from_room | text | Now written as null |
| to_room | text | Destination label, or "Unassigned" |
| changed_by | uuid | No longer written (FK removed) |

---

## Migrations (run order)

1. `0001_init.sql` — tables, enums, RLS policies, auth trigger
2. `0002_seed_rooms.sql` — fixed room list (Free Doctors removed)
3. `0003_allow_multiple_days.sql` — drops `unique(date)`; drops `activity_log.changed_by` FK
4. `0004_remove_free_doctors.sql` — moves any slots out of the Free Doctors room to the pool and deletes the room (for existing databases)
5. `0005_split_resident_name.sql` — splits `residents.name` into `first_name` / `last_name` (for existing databases)
6. `0006_add_special_rooms.sql` — adds A.PAIN, C.PAIN, PAT, PACU, SICU, PICU to the Special section (for existing databases)
7. `0007_rename_endo_rooms.sql` — renames Endo rooms to all-caps, no space (e.g. "Endo 1" → "END1") (for existing databases)

---

## Auth & Permissions

All authenticated users are chiefs with full access to every section and action. Auth is handled by Supabase Auth. RLS requires a logged-in session but applies no per-row restrictions. The `rooms` table is read-only from the app.

---

## Key Implementation Notes

1. **Status derivation** — `deriveResidentStatus(date, availability, shifts)` in `lib/utils/status.ts`; computed when building the board, never stored.
2. **Conflict rule** — vacation wins over a 24-hour shift on the same date; warning surfaced in the Resident Hub.
3. **Freeform names** — attending/CRNA names are plain text in `schedule_slots.person_name`; no roster table.
4. **Activity log** — writes only while `active`; records person → destination only; failures never block a move.
5. **Archiving** — End Day flips status to `archived`; the live record is frozen as read-only at the app layer (no copy).
6. **Rooms are fixed** — seeded at setup, never modified by the app.
7. **New day anytime** — the schedule page loads the open day; once archived the chief can start a fresh day on any date, including the same one.
