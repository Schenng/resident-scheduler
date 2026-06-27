# OR Schedule Manager

Mobile-first web app for the chief of anesthesia to manage daily OR assignments
and resident logistics. Next.js 14 (App Router) + Tailwind + Supabase.

## Sections

- **Daily Schedule** — the day's board with a Draft → Active → Archived lifecycle, drag-and-drop (desktop) / tap-to-move (mobile), and an append-only activity log once the day is active.
- **Previous Schedules** — read-only archive of every finished day with its final board and full log.
- **Resident Hub** — roster CRUD plus per-resident vacation/sick/leave and 24-hour-shift calendars (a rotation calendar is stubbed for future use). Board statuses (On / Pre-call / 24 / Post-call / Off) are derived automatically from these calendars; vacation always wins over a 24-hour shift.

## Setup

1. **Create a Supabase project** at https://supabase.com.

2. **Run the SQL** in the Supabase SQL editor, in order:
   - `supabase/migrations/0001_init.sql` — tables, enums, RLS policies, auth trigger
   - `supabase/migrations/0002_seed_rooms.sql` — the fixed room list (run once)
   - `supabase/migrations/0003_allow_multiple_days.sql` — allows starting a new day on the same calendar date (run on existing databases too)
   - `supabase/migrations/0004_remove_free_doctors.sql` — removes the Free Doctors room (existing databases)
   - `supabase/migrations/0005_split_resident_name.sql` — splits `residents.name` into `first_name` / `last_name` (existing databases)
   - `supabase/migrations/0006_add_special_rooms.sql` — adds A.PAIN, C.PAIN, PAT, PACU, SICU, PICU to the Special section (existing databases)
   - `supabase/migrations/0007_rename_endo_rooms.sql` — renames Endo rooms to all-caps, no space, e.g. "Endo 1" → "END1" (existing databases)

   With the Supabase CLI you can apply everything at once with `supabase db push` instead.

3. **Configure env.** Copy `.env.example` to `.env.local` and fill in your project's
   URL and anon key (Supabase → Project Settings → API):

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

4. **Install & run.**

   ```bash
   npm install
   npm run dev
   ```

   Open http://localhost:3000. Create a chief account on the sign-in screen
   (any authenticated user is a chief with full access). If email confirmation
   is enabled in Supabase, confirm the address, then sign in.

## Auth model

Every authenticated user is a chief with full access to everything. RLS requires
a logged-in session but applies no per-row restrictions. The `rooms` table is
read-only from the app (no insert/update/delete policy).

## Scripts

- `npm run dev` — dev server
- `npm run build` / `npm start` — production build & serve
- `npm run typecheck` — `tsc --noEmit` (run after a build so `next-env.d.ts` exists)
- `npm run lint` — Next.js ESLint

## Deploy

Designed for Vercel. Add the two `NEXT_PUBLIC_SUPABASE_*` env vars in the Vercel
project settings and deploy from the repo.

## Notes

- Resident daily status is computed in `lib/utils/status.ts` (`deriveResidentStatus`) — never stored.
- Activity-log writes only occur while a day is `active`; draft-mode moves are silent.
- Archiving (End Day) flips status to `archived` and freezes the live record as read-only at the app layer; no data is copied.
- Rooms are fixed/seeded and never modified by the app.
