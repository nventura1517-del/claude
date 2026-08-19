# Product Specification — Home Transaction Tracker (MVP)

**Status:** Draft for owner review — implementation not yet approved.
**Last updated:** 2026-08-19

This is the refined specification. It restates the owner's vision, resolves
ambiguities with recommended decisions (marked ⚑ where owner input is needed),
and defines the MVP boundary precisely.

---

## 1. Vision and value

A consumer-friendly platform that makes buying a home as easy to understand as
tracking a pizza delivery. It coordinates the transaction between agents,
buyers, lenders, escrow/title, and home-service professionals. **V1 builds only
the agent and buyer experiences**; the data model leaves room for the others.

- **Buyer value:** always know what's happening, what's next, who's responsible,
  and whether action is needed.
- **Agent value:** deliver a premium client experience while staying central to
  the relationship, and organize/track referrals to a trusted network.
- **Long-term:** a referral-attribution network around the transaction and, later,
  ongoing homeownership. (Out of scope for MVP beyond the basic attribution
  ledger.)

---

## 2. MVP workflow (the milestone that defines "done")

1. Agent creates an account.
2. Agent creates a transaction: property address, buyer info, estimated closing date.
3. System auto-creates the standard homebuying milestones.
4. Agent invites the buyer by email.
5. Buyer creates an account from the invite.
6. Buyer sees a beautiful, mobile-first visual progress tracker.
7. Agent marks milestones complete.
8. Buyer immediately sees updated progress and the current stage.

Then, the referral layer:

9. Agent adds trusted professionals, categorized by service.
10. Relevant professionals can be recommended to the buyer at the appropriate stage.
11. System tracks when a recommendation is shown, viewed, contacted, quote-requested, booked, completed.
12. Agent sees basic referral analytics.

---

## 3. User roles (V1)

**Agent** — create/manage transactions, invite buyers, update milestones, manage
their professional network, view referral activity and basic analytics.

**Buyer** — see transactions they participate in, view progress and milestone
explanations, see action items, see recommended professionals, and interact with
recommendations.

**Reserved for later (schema only, no UI):** lender, escrow/title, seller, vendor.

⚑ **Decision — multi-role people & co-buyers.** Recommended: a person can hold
different roles on different transactions, and a transaction can have more than
one buyer (e.g. spouses). This is cheap to support via a participants table and
avoids painful rework. Confirm we want co-buyers supported in V1.

---

## 4. Transactions

A transaction represents one home purchase.

Fields: property address (street, unit, city, state, postal code), status
(`active`, `closed`, `cancelled`), estimated closing date, actual closing date
(set at closing), owning agent, timestamps.

---

## 5. Milestones

Each transaction is created with a standard milestone template:

1. Offer Accepted
2. Escrow Opened
3. Deposit Received
4. Home Inspection
5. Inspection Contingency
6. Appraisal
7. Loan Underwriting
8. Loan Approved
9. Final Walkthrough
10. Closing Documents
11. Funds Received
12. Recorded
13. Keys Received

Each milestone supports: name, plain-language description, sequence, status, due
date, completion date, responsible party.

### Status model (resolved)

The four statuses `upcoming / current / complete / attention` are a **display
concept**. To avoid inconsistent stored state, we store only two facts per
milestone — `is_complete` and `needs_attention` — plus `completed_at` and
`due_date`. The four statuses are **derived** (see CLAUDE.md §8):

- `complete` if completed;
- else `attention` if flagged for attention;
- else `current` if it is the lowest-sequence incomplete milestone;
- else `upcoming`.

This guarantees exactly one "current" milestone and no drift between a stored
status and reality.

⚑ **Decision — due dates.** Recommended for MVP: due dates are **optional and
manually set** by the agent, with the template optionally carrying suggested
day-offsets from the closing date that pre-fill them. Full automatic scheduling
can wait. Confirm this is acceptable.

`responsible_party` is a label (e.g. agent, buyer, lender, escrow) used to tell
the buyer who owns the current step. In V1 it is informational, not an account link.

---

## 6. Buyer experience

Model: Domino's Pizza Tracker + package tracking + a premium consumer finance
app. Mobile-first and jargon-free.

The buyer screen answers, at a glance:

- **Where am I?** — a visual stepper with the current stage highlighted.
- **What just happened?** — the most recently completed milestone.
- **What happens next?** — the next milestone and its plain-language explanation.
- **Do I need to do anything?** — action items (milestones flagged `attention`
  or whose responsible party is the buyer).
- **When do I close?** — estimated closing date and overall progress percent.
- **Who can help me?** — professionals the agent has recommended for the current
  stage.

Tapping a milestone reveals a plain-language explanation of what it means and why
it matters.

⚑ **Decision — how "immediately" the buyer sees updates.** Recommended for MVP:
the buyer sees updates on next page load/refresh (no live push). Real-time
updates via Supabase Realtime are a small, well-scoped later add. Confirm refresh-
on-load is acceptable for V1.

⚑ **Decision — milestone-completion email to the buyer.** High value, low cost
with Resend, but it is added scope. Recommended: include a simple "milestone
completed" email in MVP. Confirm include or defer.

---

## 7. Agent experience

Responsive, desktop-primary dashboard showing active transactions with: buyer/
client, property address, current milestone, progress percent, estimated closing
date, and items requiring attention.

Opening a transaction lets the agent update milestones quickly (mark complete,
flag attention, set due dates) and manage recommendations for that buyer.

---

## 8. Referral network

An agent maintains a private list of trusted professionals, each categorized.

Initial categories: Mortgage, Escrow/Title, Home Inspection, Home Insurance,
Home Warranty, Moving, Cleaning, Plumbing, Electrical, HVAC, General Contractor,
Roofing, Landscaping, Pool Service, Handyman.

Professional fields: name, company, category, phone, email, website, notes,
active flag. **Manual entry only** for MVP — no contact import/sync.

---

## 9. Referral attribution

We want to eventually know whether a buyer actually uses the agent's network.
The MVP models the funnel as an append-only event ledger per recommendation:

`shown → viewed → call_initiated → text_initiated → quote_requested → booked → completed`

MVP behavior:

- Events are logged from **in-app** interactions (e.g. buyer taps "Call", "Text",
  or "Request a quote"; agent or buyer confirms "Booked"/"Completed").
- **No** tracked phone numbers, SMS infrastructure, payments, or external booking
  integrations.
- Analytics for the agent are simple aggregates: per professional and per
  category, how many recommendations reached each funnel stage.

⚑ **Decision — who can confirm `booked` / `completed`.** Recommended: either the
agent or the buyer can confirm, and we record which actor did it. Confirm.

---

## 10. Non-functional requirements

- **Security & authorization:** a user can only access transactions they
  participate in; enforced primarily by Postgres Row Level Security. No secret
  ever reaches the browser. (See CLAUDE.md §6.)
- **Mobile responsiveness:** required across the app, excellent for the buyer.
- **Accessibility:** semantic, labeled, keyboard-operable, sufficient contrast —
  from the start.
- **Data integrity:** all schema changes via migrations; progress derived from a
  single source of truth.

---

## 11. Out of scope for MVP

MLS, mortgage LOS, escrow-software integration, e-signature, native mobile apps,
payments, full CRM, AI assistant, property valuation, home-maintenance, vendor
marketplace, advanced/real-time messaging, tracked phone numbers, SMS, contact
sync/import, document management. These may come later and must not be started
without owner approval.

---

## 12. Open decisions for the owner (consolidated)

| #   | Decision                                              | Recommendation                           |
| --- | ----------------------------------------------------- | ---------------------------------------- |
| 1   | Product / brand name (for UI, emails, sending domain) | Owner to provide                         |
| 2   | Co-buyers / multi-role people supported in V1         | Yes — cheap via participants table       |
| 3   | Milestone due dates: manual vs automatic              | Manual, with optional template offsets   |
| 4   | Buyer sees updates: refresh-on-load vs real-time      | Refresh-on-load for MVP                  |
| 5   | Milestone-completion email to buyer in MVP            | Include (simple, high value)             |
| 6   | Who confirms `booked`/`completed` referral events     | Agent or buyer; record actor             |
| 7   | Auth method: password, magic link, or both            | Email+password, with magic-link optional |
| 8   | Resend verified sending domain (DNS access)           | Owner to provide domain                  |
| 9   | Milestone template editable by agents in V1           | No — fixed in code for MVP               |

These are product/business choices, not technical blockers; sensible defaults are
proposed so implementation can proceed on approval.
