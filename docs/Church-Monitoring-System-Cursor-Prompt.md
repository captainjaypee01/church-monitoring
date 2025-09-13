# Re-export the markdown file with a new filename
# Church Monitoring System — Build Prompt for Cursor

Paste this entire document into Cursor and run it as a **project-wide instruction**. Produce a production‑ready repository that can be deployed to **Vercel** with a **Neon (Vercel Postgres)** database. Use **Next.js (App Router) as both frontend and backend**.

---

## Objective
Implement a full Church Monitoring System with role‑based dashboards and workflows covering cell meetings, attendance, training, giving, events, announcements, volunteer scheduling, reports/exports, and VIP insights.

---

## Tech Stack & Constraints
- **Framework:** Next.js (App Router, TypeScript, Server Actions where appropriate)
- **Database:** PostgreSQL on **Vercel (Neon)**
- **ORM:** Drizzle ORM with `@neondatabase/serverless` (HTTP driver) and drizzle-kit migrations
- **Auth:** Auth.js (NextAuth v5) with **Drizzle Adapter**; Credentials (email + password, bcrypt) and optional OAuth slots
- **File Storage:** Vercel Blob for group pictures/attachments
- **Styling/UI:** Tailwind CSS + shadcn/ui (Radix under the hood); Lucide icons
- **Charts:** Recharts (VIP trends, growth metrics)
- **Validation:** Zod
- **Forms:** React Hook Form + zod resolver
- **Tables/Filters:** TanStack Table v8 (for admin/cell/network reporting grids)
- **Email (optional):** Resend or Vercel Email for notifications
- **Scheduling:** Vercel Cron for automated reminders
- **Runtime:** Prefer Edge for read endpoints; Node for auth, bcrypt, and blob uploads
- **Testing (lightweight):** Vitest + Playwright minimal smoke tests for critical flows

---

## Environment Variables (create `.env.local` / Vercel Project Vars)
- `DATABASE_URL` (Neon HTTP connection)
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `VERCEL_BLOB_RW_TOKEN`
- `RESEND_API_KEY` (optional)
- `CRON_SECRET` (for protected scheduled endpoints)

Also generate a **drizzle config** and `drizzle/` migrations folder.

---

## RBAC Policy (Capabilities Matrix)
**Roles:** `ADMIN`, `NETWORK_LEADER`, `CELL_LEADER`, `MEMBER`

- **MEMBER**: View own attendance, training progress, giving contributions (if tracked individually), upcoming events, registrations; self‑register for events/trainings.
- **CELL_LEADER**: All MEMBER capabilities + manage assigned cell; log cell meetings (timestamped), mark attendance, record training updates, record giving (tithes/offerings breakdown), upload group picture; generate/download reports for **their cell** only.
- **NETWORK_LEADER**: Monitor multiple cells in their network; view timestamped cell logs; monthly insights (total members, VIPs in Sunday Service, VIPs in cell groups); view attendance/training/giving/event participation; support/evaluate cell leaders; charts for VIP trends/cell growth; export CSV for their network.
- **ADMIN**: Full access (members, networks, cells, events, announcements, role assignments); create/edit/delete events; publish announcements; monitor attendance/training/giving/VIP counts per network/month; consolidated reports/exports; manage roles and assignments.

### Enforcement
- Implement an `ability()` helper with role checks and scoping (by `cell_id`/`network_id`).
- Use middleware to guard **/admin**, **/network**, **/cell** routes; and server actions for write ops with role assertions.

---

## Data Model (Drizzle Schema)
Create normalized tables with foreign keys and indexes. Use UUID primary keys unless noted.

- **users**: id, email (unique), hashed_password, name, phone, avatar_url, created_at, updated_at
- **profiles** (member profile): id, user_id (nullable for guest/visitor records), full_name, birthdate, gender, address, joined_at, is_active
- **roles** (enum or table): `ADMIN`, `NETWORK_LEADER`, `CELL_LEADER`, `MEMBER`
- **user_roles**: id, user_id, role (enum), network_id (nullable), cell_id (nullable) — enables scoped leadership
- **networks**: id, name, description
- **cells**: id, network_id, name, description, meeting_day (enum/string), meeting_time (time)
- **cell_memberships**: id, cell_id, profile_id, role_in_cell (member/assistant/leader), joined_at, active
- **training_levels**: id, code (e.g., L1, L2…), title, order
- **training_progress**: id, profile_id, level_id, completed_at, notes
- **meetings** (cell meetings): id, cell_id, leader_user_id, occurred_at (timestamp, default now), notes, group_picture_url (blob), created_at
- **meeting_attendance**: id, meeting_id, profile_id, is_vip (bool), present (bool), remarks
- **giving** (cell giving for a meeting): id, meeting_id, tithes_amount (decimal), offerings_amount (decimal), currency (default SGD/PHP configurable)
- **services** (Sunday services): id, service_date, notes
- **service_attendance**: id, service_id, profile_id, is_vip (bool), present (bool)
- **events**: id, title, description, start_at, end_at, location, capacity (nullable), allow_registration (bool), attachment_url (nullable), created_by
- **event_registrations**: id, event_id, profile_id, status (registered|waitlisted|cancelled), registered_at
- **announcements**: id, title, body, published_at, author_id, audience (all|leaders|members)
- **volunteer_roles**: id, name, description
- **volunteer_assignments**: id, event_id (nullable), service_id (nullable), profile_id, volunteer_role_id, scheduled_at, notes
- **audit_logs**: id, actor_user_id, action (enum), subject_table, subject_id, created_at, meta (jsonb)

**Indexes**: Add composite indexes for attendance queries by (cell_id, occurred_at), (network_id, month), etc. Add partial indexes where useful (e.g., `is_vip = true`).

---

## Core Workflows & Screens

### 1) Authentication & Onboarding
- Sign in/up with email+password; password reset.
- Admin can assign roles and scope (network/cell) from Admin > Users.

### 2) Dashboards (Role‑based)
- **Member Dashboard**: personal attendance history (services, cell, events), training progress timeline, personal giving history (if recorded by profile_id), upcoming events/registrations, quick “Register” actions.
- **Cell Leader Dashboard**: shortcuts to “Log Cell Meeting”, recent meetings list, attendance snapshot, training updates feed, cell giving summary, latest announcements.
- **Network Leader Dashboard**: KPIs (total members, # cells, monthly VIPs in Sunday Service/Cell Groups), trend charts (VIPs, growth), tables of recent cell meetings and leader activity.
- **Admin Dashboard**: global KPIs, recent activity, management shortcuts (Events, Announcements, Users/Roles, Networks/Cells), VIP by network chart.

### 3) Cell Meeting Logging
- Form fields: auto‑timestamp (occurred_at now, editable), attendance multi‑select (members from cell), per‑member present + VIP toggle + remarks, training updates (select members + completed level), giving breakdown (tithes, offerings), optional photo upload (Vercel Blob). Persist to **meetings**, **meeting_attendance**, **giving**, and **training_progress**.
- After submit: show recap view + print/export.

### 4) Training Progress
- Admin defines `training_levels` once (seed data). Leaders mark completions either during meeting logging or via member profile.

### 5) Attendance Tracking
- **Sunday Service**: Admin/NL can create services; mark attendance (bulk import or UI). VIP flag captured per attendance row.
- **Cells**: via meeting logging flow.
- **Events**: registration records and check‑in flag (extendable).

### 6) Events & Announcements (Admin)
- CRUD for events (title, description, schedule, location, attachments), toggle `allow_registration`.
- Announcements: create/publish, audience scoping; visible on all dashboards.

### 7) Volunteer Scheduling
- Assign volunteers to **services** or **events** with roles and scheduled times.

### 8) Reports & Exports
- CSV exports for attendance (service/cell/event), training completions, cell giving, and VIP summaries, scoped by role (cell/network/global). Include month filters and network filters.

### 9) VIP Insights (Network Leader)
- Roll‑ups per month:
  - Total members in their network
  - Total VIPs in Sunday Service (per month)
  - Total VIPs in Cell Groups (per month)
- Render Recharts line/area charts for trends; show tables with drill‑downs.

---

## API & Routing (App Router)
Create route handlers under `/api/*` with proper role checks and Zod schemas. Examples (no code, just endpoints to implement):
- `POST /api/auth/*` (Auth.js)
- `GET /api/me` — current user + roles + scoping
- `GET /api/dashboard` — role‑aware widgets
- `POST /api/meetings` | `GET /api/meetings` | `GET /api/meetings/:id`
- `POST /api/meetings/:id/attendance`
- `POST /api/meetings/:id/giving`
- `POST /api/training/progress`
- `GET /api/reports/vip` — query by month/network
- `GET /api/reports/attendance` — scoped
- `GET /api/reports/giving` — scoped
- `GET /api/reports/training` — scoped
- `POST /api/events` | `GET /api/events` | `POST /api/events/:id/register`
- `POST /api/announcements` | `GET /api/announcements`
- `POST /api/volunteers/assign`
- `POST /api/upload` — Vercel Blob signed upload helper

Implement server actions for form submissions where it simplifies UX.

---

## UI Routes & Pages
- `/login` `/(auth)` — sign in/up/reset
- `/dashboard` — auto‑routes to role‑specific dashboard
- `/cell` — leader views (list of meetings, log new)
- `/cell/meetings/new` — logging flow
- `/network` — KPIs, charts, recent activity
- `/admin` — overview + nav
  - `/admin/users` (roles/assignments)
  - `/admin/networks` and `/admin/cells`
  - `/admin/events` and `/admin/announcements`
  - `/admin/reports` (download CSVs)
- `/events` — list + detail + register
- `/profile` — member profile, personal history

Use shadcn/ui components (Cards, DataTable, Dialog, Form, Input, Select, DatePicker, Tabs, Toasts). All pages mobile‑friendly.

---

## Automations & Notifications (Nice‑to‑Have)
- Vercel Cron endpoints to send reminder emails for upcoming cell meetings/events/training.
- Notification center: in‑app toast + bell dropdown for new announcements and registration confirmations.

---

## Seed Data & Admin Bootstrap
- Seed default roles, an `ADMIN` user, a demo network, a demo cell with members, basic training levels, and a few events/announcements for quick verification.
- Provide a minimal onboarding wizard for first admin login (optional).

---

## Quality Gates
- Type‑safe database access via Drizzle; Zod validation on all inputs.
- RBAC enforced in API route handlers and server actions.
- Rate limiting on write endpoints.
- Audit log entries on significant actions (meeting created, giving recorded, role assigned, announcement published).
- Basic tests: 
  - can create a meeting with attendance + giving
  - member sees personal dashboard data
  - network leader VIP monthly aggregation works
  - admin can CRUD events and publish announcements

---

## Deployment
- Provide `vercel.json` with route overrides as needed.
- Include a `README.md` with:
  - local dev setup (Neon shadow DB + drizzle migrations)
  - env var instructions
  - how to run seeds
  - how to run Vercel Cron locally (if applicable)
- Confirm cold‑start friendly connection (neon-http) and Node runtime for bcrypt/Auth.js.

---

## Acceptance Criteria (Map to Success Criteria)
- **Cell Leaders** can: log cell meetings with timestamps; add attendance with VIP flags; record training completions; input tithes/offerings; upload photo; export cell‑scoped reports.
- **Network Leaders** can: see network‑scoped attendance/training/giving; monthly VIP totals (Sunday Service + Cell Groups); charts for VIP trends and cell growth; export network‑scoped CSVs.
- **Admins** can: manage members, networks, cells; create/manage events & announcements; assign roles; view VIP counts per network/month; generate consolidated reports/exports.
- **Members** can: see personal attendance/training/giving; view upcoming events/announcements; register for activities.

---

## Implementation Plan (What Cursor Should Do Now)
1) Scaffold Next.js + Tailwind + shadcn/ui + Drizzle (Neon HTTP) + Auth.js (Drizzle Adapter). Commit: `chore: scaffold app stack`.
2) Implement Drizzle schema & migrations for all tables above. Commit: `feat(db): initial schema + migrations + seeds`.
3) Configure Auth.js credentials provider with bcrypt, Drizzle Adapter; add middleware and `ability()` RBAC helper. Commit: `feat(auth): nextauth + drizzle adapter + rbac`.
4) Build UI shells and role‑based dashboards with server components + client forms. Commit: `feat(ui): dashboards for member/cell/network/admin`.
5) Implement Meeting Logging flow (forms, server actions, blob upload). Commit: `feat(meetings): create/log attendance + giving + photo`.
6) Implement Events & Announcements CRUD (admin) + member registration. Commit: `feat(events,announcements): admin + member flows`.
7) Add Reports API + CSV exports + charts for VIP trends. Commit: `feat(reports): csv exports + recharts kpis`.
8) Add Volunteer Scheduling (services/events). Commit: `feat(volunteers): assignments and views`.
9) Add automations (cron endpoints) + email notifications (optional). Commit: `feat(automations): reminders via vercel cron`.
10) Write smoke tests + README + deploy to Vercel (include envs). Commit: `docs: readme and deploy guidance`.

Deliver a working app that meets all Acceptance Criteria above, with clean, typed modules and clear separation of concerns (entities, features, UI, API).
