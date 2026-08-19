# Implementation Plan — Home Transaction Tracker (MVP)

**Status:** Approved. Build in progress.

**Progress:** Phases 0–5 complete — this is the full core MVP workflow (agent
signup → create transaction → auto milestones → invite buyer → buyer signup →
mobile tracker → agent updates → buyer sees progress), plus buyer completion
emails. Next: Phase 6 (referral network). Running the app end-to-end needs a live
Supabase project and (for email) a Resend key; the code compiles, lints,
type-checks, and all unit tests pass without them, and the buyer tracker was
visually verified at phone width.

This document holds the recommended architecture, database schema, auth model,
routes, components, and a phased, testable roadmap. It is the working checklist.

---

## A. Recommended architecture (plain-English summary)

- **One Next.js application** (App Router) serves both the agent and buyer
  experiences, with role-aware layouts. Rendering is server-first: pages that
  read private data are Server Components that query Postgres with the user's
  session, so authorization is enforced at the database.
- **Supabase is the backend**: Postgres for data, Supabase Auth for accounts and
  sessions, and Row Level Security (RLS) as the real authorization wall. The app
  mostly talks to the database through a session-scoped client that can only see
  what RLS allows.
- **A small amount of privileged work** (creating/validating invite tokens,
  sending email, anything cross-user) runs only on the server through a
  service-role client that never exists in the browser.
- **Email** goes out through Resend from server code only.
- **Vercel** hosts it. Migrations in `supabase/migrations/` are the only way the
  schema changes.

Why this shape: it is the simplest arrangement that makes the security boundary
(a buyer can only ever see their own transaction) enforced by the database
itself, not by remembering to check in every screen.

---

## B. Database schema (proposed)

All tables have `id uuid primary key default gen_random_uuid()` unless noted, and
`created_at timestamptz default now()`. RLS is **enabled on every table**, with
policies created in the same migration.

### `profiles`

Mirror of `auth.users`, created by a trigger on signup.

- `id uuid pk` (= `auth.users.id`)
- `full_name text`
- `phone text null`
- `role text` — `agent` | `buyer` (reserved later: `lender`,`escrow`,`title`,`seller`,`vendor`)
- `created_at`

### `transactions`

- `agent_id uuid` → `profiles.id`
- `property_street text`, `property_unit text null`, `property_city text`,
  `property_state text`, `property_postal_code text`
- `status text` — `active` | `closed` | `cancelled` (default `active`)
- `estimated_closing_date date null`
- `actual_closing_date date null`
- `created_at`, `updated_at`

### `transaction_participants` _(the access-control backbone)_

- `transaction_id uuid` → `transactions.id` (cascade delete)
- `profile_id uuid` → `profiles.id`
- `role text` — `agent` | `buyer` | `co_buyer` (reserved others later)
- `unique (transaction_id, profile_id)`

### `milestones`

- `transaction_id uuid` → `transactions.id` (cascade delete)
- `template_key text` — stable key from the code template (e.g. `offer_accepted`)
- `name text`, `description text`
- `sequence int`
- `is_complete boolean default false`
- `needs_attention boolean default false`
- `due_date date null`
- `completed_at timestamptz null`
- `responsible_party text null`
- `created_at`, `updated_at`
- `unique (transaction_id, sequence)`

### `invitations`

- `transaction_id uuid` → `transactions.id` (cascade delete)
- `email text` (invited address, lowercased)
- `role text` — role to grant on acceptance (`buyer`)
- `token_hash text` — hash of the single-use token (raw token only in the email)
- `status text` — `pending` | `accepted` | `expired` | `revoked`
- `invited_by uuid` → `profiles.id`
- `expires_at timestamptz`
- `accepted_at timestamptz null`
- `accepted_profile_id uuid null` → `profiles.id`

### `professionals` _(agent's private network)_

- `agent_id uuid` → `profiles.id`
- `name text`, `company text null`
- `category text` — one of the fixed category set
- `phone text null`, `email text null`, `website text null`, `notes text null`
- `is_active boolean default true`
- `created_at`, `updated_at`

### `recommendations`

- `transaction_id uuid` → `transactions.id` (cascade delete)
- `professional_id uuid` → `professionals.id`
- `milestone_id uuid null` → `milestones.id` (stage context, optional)
- `created_by uuid` → `profiles.id` (the agent)
- `status text` — `active` | `dismissed` (default `active`)
- `created_at`
- `unique (transaction_id, professional_id)` _(one live rec per pro per deal)_

### `recommendation_events` _(append-only attribution ledger)_

- `recommendation_id uuid` → `recommendations.id` (cascade delete)
- `event_type text` — `shown` | `viewed` | `call_initiated` | `text_initiated`
  | `quote_requested` | `booked` | `completed`
- `actor_profile_id uuid null` → `profiles.id`
- `metadata jsonb null`
- `created_at`

**Milestone templates** are **not** a table for MVP; they live in
`lib/milestones/template.ts` as a typed constant and are applied at transaction
creation. Optional read-only SQL view `transaction_progress` may mirror the
progress formula for convenient dashboard queries.

---

## C. Authentication & authorization

- **Auth:** Supabase Auth. ⚑ Method to confirm (email+password recommended,
  magic-link optional). Sessions handled with `@supabase/ssr`.
- **Profile creation:** a Postgres trigger (`handle_new_user`) inserts a
  `profiles` row on signup. Self-signup → `agent`. Invite acceptance → `buyer`.
- **Authorization helpers (SQL):**
  - `is_transaction_member(tx uuid)` — true if `auth.uid()` is in
    `transaction_participants` for `tx`.
  - `is_transaction_agent(tx uuid)` — true if `auth.uid()` is the transaction's agent.
- **Representative RLS policies:**
  - `transactions`: SELECT if `is_transaction_member(id)`; INSERT/UPDATE if
    `agent_id = auth.uid()`.
  - `milestones`: SELECT if `is_transaction_member(transaction_id)`; write only
    if `is_transaction_agent(transaction_id)`.
  - `transaction_participants`: SELECT own rows / rows of transactions you're the
    agent of; inserts happen server-side during invite acceptance.
  - `professionals`: all operations restricted to `agent_id = auth.uid()`.
  - `recommendations`: SELECT if member; INSERT/UPDATE if transaction agent.
  - `recommendation_events`: SELECT if member of the parent transaction; INSERT
    allowed for members (buyers log their own view/contact events; agent/buyer
    log booked/completed). Ledger is insert-only (no update/delete policy).
  - `invitations`: managed server-side; no broad client policies.
- **Privileged/server-only operations** (service-role client): mint & verify
  invite tokens, create the participant row on acceptance, send email. Never in
  the browser.

---

## D. Routes / pages

**Public / auth**

- `/` — marketing/landing + sign-in entry
- `/login`, `/signup`
- `/invite/[token]` — validates token, routes to buyer signup/sign-in, then links the buyer to the transaction

**Agent (desktop-primary, responsive)**

- `/dashboard` — active transactions with attention flags
- `/transactions/new` — create transaction (address, buyer info, closing date)
- `/transactions/[id]` — agent transaction detail; update milestones
- `/transactions/[id]/referrals` — recommend professionals for this buyer
- `/network` — professional list; `/network/new`, `/network/[id]` (edit)
- `/analytics` — basic referral funnel analytics

**Buyer (mobile-first)**

- `/track` — buyer home; their transaction(s)
- `/track/[id]` — the visual progress tracker (default buyer screen)
- milestone detail shown as an in-page sheet/expansion, not a separate route

**Server route handlers / actions**

- invite create, invite accept, milestone toggle, recommendation create, event
  log — all server-side with authorization checks.

Post-login redirect is role-aware: agents → `/dashboard`, buyers → `/track`.

---

## E. Major reusable UI components

- `AppShell` / `MobileNav` — role-aware layout and navigation
- `ProgressTracker` — buyer visual stepper (the centerpiece), mobile-first
- `MilestoneStep` — one node in the stepper (states: upcoming/current/complete/attention)
- `MilestoneDetailSheet` — plain-language "what this means / what's next"
- `StatusBadge` — consistent status pill
- `ActionNeededCard` / `AttentionBanner` — buyer action items
- `TransactionCard` — agent dashboard row/card
- `MilestoneEditorRow` — agent control to complete/flag/date a milestone
- `ProfessionalCard` — network entry display
- `ProfessionalForm` / `CategoryPicker` — add/edit professional
- `RecommendationCard` — buyer-facing, with Call/Text/Quote actions that log events
- `FunnelStat` — analytics aggregate tile
- `InviteForm`, `EmptyState`, `Avatar`, form primitives

---

## F. Progress calculation

Single helper `lib/milestones/progress.ts` (see CLAUDE.md §8):

- `progress_percent = round(completed / total * 100)`, equal weight.
- `current_stage` = lowest-`sequence` incomplete milestone.
- Derived per-milestone display state: complete → attention → current → upcoming.
  Optionally mirrored in a read-only SQL view for dashboard queries. Never duplicate
  the rule in components.

---

## G. Referral attribution model

Funnel over `recommendation_events` (append-only):
`shown → viewed → call_initiated → text_initiated → quote_requested → booked → completed`.
Analytics = counts per professional and per category reaching each stage, plus a
simple conversion view (e.g. recommended → contacted → booked). MVP logs only
in-app interactions; `booked`/`completed` confirmed by an in-app action recording
the acting user.

---

## H. Phased roadmap (small, testable milestones)

Each phase must end in a demonstrable state. Do not start a phase before its
predecessors are green (typecheck + lint + the phase's checks).

### Phase 0 — Foundation

- [ ] Scaffold Next.js + TypeScript + Tailwind; ESLint/Prettier; `tsc --noEmit` clean.
- [ ] Supabase project; `@supabase/ssr` clients (RLS client + server-only service client).
- [ ] `.env.example` (no secrets); Vercel project connected.
- [ ] Base layout, design tokens, role-aware `AppShell`.
- **Done when:** app builds and deploys a blank authenticated shell.

### Phase 1 — Auth & profiles

- [ ] Signup/login; `handle_new_user` trigger creates `profiles`.
- [ ] `profiles` table + RLS; role-aware post-login redirect.
- **Done when:** an agent can sign up, land on `/dashboard`; session persists.

### Phase 2 — Transactions & milestone generation

- [ ] `transactions`, `transaction_participants`, `milestones` tables + RLS + helpers.
- [ ] Milestone template constant + application on transaction create.
- [ ] `/transactions/new`, `/dashboard`, `/transactions/[id]` (agent view).
- **Tests:** template application; RLS — a second agent cannot read the first's transaction.
- **Done when:** agent creates a transaction and sees its 13 milestones.

### Phase 3 — Buyer invitation

- [ ] `invitations` table + hashed tokens; server actions to create/accept.
- [ ] Resend integration (server-only); invite email.
- [ ] `/invite/[token]` → buyer signup → participant row created.
- **Tests:** token single-use, expiry, wrong-token rejection; acceptance grants access to only that transaction.
- **Done when:** invited buyer signs up and is linked to the transaction.

### Phase 4 — Buyer tracker experience

- [ ] `ProgressTracker`, `MilestoneStep`, `MilestoneDetailSheet`; `/track`, `/track/[id]`.
- [ ] Progress helper wired in; action-items surfaced.
- **Checks:** mobile viewport, accessibility (keyboard, contrast, labels).
- **Done when:** buyer sees a beautiful mobile progress view of their purchase.

### Phase 5 — Milestone updates & progress

- [ ] Agent milestone editor (complete / flag attention / due date).
- [ ] Buyer view reflects changes on refresh; progress recalculates.
- [ ] ⚑ Optional: milestone-completion email to buyer (if approved).
- **Tests:** progress/stage derivation across sequences and attention flag.
- **Done when:** agent marks complete → buyer sees updated stage & percent.

**← This completes the core MVP workflow.**

### Phase 6 — Referral network

- [ ] `professionals` table + RLS; `/network`, add/edit, `CategoryPicker`.
- **Done when:** agent manages a categorized professional list.

### Phase 7 — Recommendations & attribution

- [ ] `recommendations`, `recommendation_events` tables + RLS.
- [ ] Agent recommends pros per transaction/stage; buyer sees `RecommendationCard`.
- [ ] In-app event logging (shown/viewed/call/text/quote/booked/completed).
- **Tests:** ledger insert-only; buyer can log own events; member-only reads.
- **Done when:** buyer interactions produce attribution events.

### Phase 8 — Agent analytics

- [ ] `/analytics` funnel aggregates per professional/category.
- **Done when:** agent sees basic referral funnel numbers.

### Phase 9 — Hardening

- [ ] Accessibility & responsive QA pass; empty/error/loading states.
- [ ] Security review of all RLS policies against the "no cross-transaction access" rule.
- [ ] ⚑ Optional: Supabase Realtime for live buyer updates (if approved).
- **Done when:** the MVP is demonstrable end-to-end and passes the security review.

---

## I. MVP vs. deliberately deferred

**In the MVP (Phases 0–9):** agent auth, transaction + milestone generation,
buyer invite + signup, mobile buyer tracker, milestone updates + progress,
referral network, recommendations + attribution ledger, basic analytics.

**Deliberately deferred (not in MVP):** real-time push (unless approved as a small
Phase 9 add), rich email/notification center, template-editing UI, automatic due-
date scheduling, lender/escrow/title/seller/vendor experiences, and everything on
the product spec's out-of-scope list.

---

## J. Owner decisions required before implementation

See `docs/product-spec.md` §12 for the consolidated table. The build can start on
approval using the recommended defaults; only items 1 (brand name) and 8 (Resend
sending domain) are hard external dependencies, and both are needed by Phase 3.
