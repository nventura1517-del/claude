# CLAUDE.md

Development rules and guardrails for this project. Every Claude Code session must
read this file before making changes and keep it authoritative. When something
here conflicts with a request, surface the conflict instead of silently
diverging.

---

## 1. What this product is

A consumer-friendly home-transaction tracking platform. Think "Domino's Pizza
Tracker for buying a house." It coordinates a real-estate transaction between an
**agent** and a **buyer**, and lets the agent recommend trusted service
**professionals** from their referral network.

The guiding promise to the buyer: *Where am I? What just happened? What happens
next? Do I need to do anything? When do I close? Who can help me?*

The guiding promise to the agent: *Give clients a great experience while staying
at the center of the relationship, and track referrals to my network.*

Full spec: `docs/product-spec.md`. Roadmap: `docs/implementation-plan.md`.

---

## 2. Product principles (do not violate)

1. **Buyer simplicity beats feature richness.** The buyer UI must be
   understandable in seconds by a non-technical, possibly first-time buyer.
   Avoid real-estate jargon; every milestone has a plain-language explanation.
2. **Mobile-first for the buyer.** The buyer experience is designed for a phone
   first and must be excellent there. The agent experience is responsive but
   desktop-primary.
3. **Agent stays central.** Features must reinforce the agent relationship, not
   disintermediate it.
4. **Ship the smallest thing that delivers the value.** When a sophisticated and
   a simple solution both satisfy the MVP, choose the simple one.
5. **Do not expand scope because something is "nice to have."** See the
   Out-of-Scope list below. Adding anything on that list requires explicit
   owner approval.

---

## 3. Scope guardrails

### In scope for MVP
- Agent signup, transaction creation, milestone auto-generation, milestone updates.
- Email-based buyer invitation and buyer signup.
- Mobile-first buyer progress tracker with milestone explanations and action items.
- Agent dashboard of active transactions.
- Agent referral network (manually added professionals, categorized).
- In-app referral recommendations and interaction/attribution tracking.
- Basic agent referral analytics.

### Explicitly OUT of scope for MVP (do not build without owner approval)
MLS integration, mortgage LOS integration, escrow software integration,
e-signature, native mobile apps, payments, full CRM, AI assistant, property
valuation, home-maintenance features, vendor marketplace, advanced/real-time
messaging, tracked phone numbers, SMS infrastructure, contact syncing/import,
document management.

The **data model may leave room** for lender / escrow / title / seller / vendor
roles, but **do not build those user experiences** in V1.

---

## 4. Technology stack (do not change without a documented reason)

- **Framework:** Next.js (App Router) + React, TypeScript everywhere.
- **Styling:** Tailwind CSS.
- **Database:** PostgreSQL via Supabase. All schema changes go through SQL
  migrations in `supabase/migrations/` — never hand-edit the database.
- **Auth:** Supabase Auth (`@supabase/ssr` for server/client session handling).
- **Email:** Resend for transactional email, sent only from server code.
- **Hosting:** Vercel.

Do not add a dependency unless there is a clear, stated reason and no reasonable
way to do it with what we already have. Prefer established, well-maintained
libraries over clever bespoke code.

---

## 5. Architecture rules

- **Server does privileged work.** Anything using the Supabase **service-role**
  key, sending email, minting/validating invite tokens, or reading across users
  runs only in Server Components, Server Actions, or Route Handlers. Never in the
  browser.
- **Two Supabase clients:** an anon/RLS-scoped client for user-context reads and
  writes, and a service-role client that exists **only** on the server for the
  few operations RLS cannot express. Default to the RLS client.
- **RLS is the primary authorization boundary**, not app code. App-layer checks
  are defense-in-depth, never the only line of defense.
- **Access is derived from `transaction_participants`.** A user can touch a
  transaction only if they are a participant (or its agent). This one rule drives
  most RLS policies.
- **Milestone templates live in code** (`lib/milestones/template.ts`) for the
  MVP, applied at transaction creation. Do not build a template-editing UI yet.
- **Progress is computed, not hand-maintained.** See §8.
- **Keep components modular and typed.** No `any` without a written justification.

---

## 6. Security requirements (non-negotiable)

1. A user must **never** be able to read or modify a transaction they are not a
   participant in. Every new table and query is reviewed against this.
2. **Never expose** the Supabase service-role key, Resend key, or any secret to
   the browser. Secrets live in server-only env vars. Only `NEXT_PUBLIC_*` vars
   reach the client, and those must be non-secret.
3. Every table with user data has RLS **enabled** with explicit policies. A table
   with RLS enabled and no policy denies all access — that is the safe default;
   add policies deliberately.
4. Invitation tokens are single-use, expiring, and stored hashed (never the raw
   token). The raw token appears only in the emailed link.
5. Validate and authorize on the server for every mutation. Do not trust
   client-supplied ids for ownership.
6. Bind an invitation to its transaction and role at acceptance time; do not let
   acceptance grant access to anything the invite did not specify.

---

## 7. Roles and authorization model

- Global roles: `agent`, `buyer` for V1 (schema reserves room for `lender`,
  `escrow`, `title`, `seller`, `vendor` later).
- A person may be an agent on one transaction and a buyer on another. Global role
  is a default; **per-transaction role comes from `transaction_participants`.**
- Agent can: create/manage their transactions, invite buyers, update milestones,
  manage their own professionals, create recommendations, view their analytics.
- Buyer can: view transactions they participate in, view progress and milestone
  explanations, see action items, see recommendations, and log their own
  interaction events (view/call/text/quote). Buyers never write milestones.

---

## 8. Progress calculation (single source of truth)

- `progress_percent = round(completed_milestones / total_milestones * 100)`,
  equal weight per milestone for MVP.
- `current_stage` = the incomplete milestone with the lowest `sequence`.
- Derived milestone display state:
  - `complete` — `is_complete = true`.
  - `attention` — `needs_attention = true` and not complete (overrides current).
  - `current` — the lowest-sequence incomplete milestone (that isn't attention).
  - `upcoming` — every other incomplete milestone.
- Implement this in one typed helper (`lib/milestones/progress.ts`) and, if
  convenient, mirror it in a read-only SQL view. Do not scatter the rule.

---

## 9. Referral attribution model

- `professionals` are owned by an agent (their private network).
- A `recommendation` links a professional to a transaction (optionally to a
  milestone/stage context).
- `recommendation_events` is an **append-only ledger**. Event types:
  `shown`, `viewed`, `call_initiated`, `text_initiated`, `quote_requested`,
  `booked`, `completed`. Analytics are aggregates over this ledger.
- For MVP, events are logged from in-app interactions only. No call/SMS tracking,
  no external booking integrations. `booked`/`completed` are confirmed by a
  simple in-app action.

---

## 10. Testing and quality expectations

- **Typecheck and lint must pass** before every commit (`tsc --noEmit`, ESLint,
  Prettier). Treat a red typecheck as a broken build.
- **Test the logic that has rules**, at minimum: progress/stage derivation,
  milestone template application, invite token lifecycle, and RLS behavior
  (a buyer cannot read another transaction). Prefer a few meaningful tests over
  broad shallow ones.
- Every phase in the implementation plan ends in a **manually verifiable**
  state; do not merge a phase that cannot be demonstrated end-to-end.
- Accessibility is a first-class requirement: semantic HTML, labeled controls,
  visible focus, adequate color contrast, and keyboard operability. Check it as
  you build, not at the end.
- Verify mobile layout (narrow viewport) for every buyer-facing screen.

---

## 11. Database change workflow

1. Write a new migration file in `supabase/migrations/` (timestamped, forward-only).
2. Include the RLS enablement and policies for any new table **in the same
   migration** as the table.
3. Regenerate TypeScript types from the schema after applying migrations.
4. Never modify an already-applied migration; add a new one.

---

## 12. Git and delivery

- Development branch: `claude/real-estate-transaction-mvp-iukpe5` (do not push
  elsewhere without explicit permission).
- Commit in small, descriptive, working increments aligned to the plan's
  milestones.
- Do not open a pull request unless the owner explicitly asks.
- Do not commit secrets. `.env*` files are git-ignored; provide `.env.example`
  with non-secret placeholders.

---

## 13. When in doubt

Prefer the simpler solution, protect the authorization boundary, keep the buyer
experience dead simple, and ask the owner when a choice is a product or business
decision rather than a technical one. Flag those explicitly rather than guessing.
