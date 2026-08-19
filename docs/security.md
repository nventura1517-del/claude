# Security & Authorization Model

This documents how Homeward enforces its core invariant and records the Phase 9
review. Read alongside `CLAUDE.md` §6–7.

## Core invariant

> A user can only read or modify a transaction (and its milestones, invitations,
> recommendations, and events) if they are a **participant** in it, or its
> **agent**.

This is enforced primarily in the **database** via Row Level Security, not in
application code. App-layer checks (`requireRole`, ownership comparisons) are
defense-in-depth.

## How access is derived

- Membership lives in `transaction_participants`.
- Three `SECURITY DEFINER` helper functions answer the access questions without
  causing RLS recursion:
  - `is_transaction_agent(tx)` — is the caller the transaction's agent?
  - `is_transaction_member(tx)` — is the caller a participant?
  - `shares_transaction_with(other)` — do caller and `other` share a transaction?
- Because the helpers are `SECURITY DEFINER`, a policy on
  `transaction_participants` can call them without querying that table under RLS
  (which would recurse).

## Policy matrix

| Table                      | SELECT                                             | INSERT                     | UPDATE          | DELETE          |
| -------------------------- | -------------------------------------------------- | -------------------------- | --------------- | --------------- |
| `profiles`                 | own row, or a profile you share a transaction with | via signup trigger only    | own row         | —               |
| `transactions`             | agent or member                                    | agent (self as `agent_id`) | agent           | agent           |
| `transaction_participants` | self rows, or agent of the tx                      | agent of the tx            | —               | agent of the tx |
| `milestones`               | member                                             | agent                      | agent           | agent           |
| `invitations`              | agent of the tx                                    | agent of the tx            | agent of the tx | —               |
| `professionals`            | owner agent                                        | owner agent                | owner agent     | owner agent     |
| `recommendations`          | member                                             | agent                      | agent           | agent           |
| `recommendation_events`    | member of parent tx                                | member of parent tx        | — (append-only) | — (append-only) |

Every table has RLS **enabled**; a table with RLS on and no matching policy
denies the operation. Absent UPDATE/DELETE rows above are intentional.

## Privileged (service-role) operations

The service-role key bypasses RLS and lives only on the server
(`lib/supabase/admin.ts`, guarded by `server-only`). It is used for exactly:

1. **Reading an invitation by token** on the public accept page (buyer has no
   session yet) — reads only the single invitation the token unlocks.
2. **Accepting an invitation** — creating the confirmed buyer account, inserting
   the participant row (RLS only lets the _agent_ add participants), and marking
   the invitation accepted.

No other code path uses the service role.

## Secrets

- `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `EMAIL_FROM` are server-only.
- Only `NEXT_PUBLIC_*` values reach the browser, and those are non-secret.
- `.env.local` is git-ignored; `.env.example` carries placeholders only.

## Invitation tokens

- 32 bytes of CSPRNG randomness, URL-safe.
- Only the SHA-256 **hash** is stored; the raw token appears only in the emailed
  link. A database leak cannot be used to accept invites.
- Single-use (status flips to `accepted`) and expiring (14 days).
- Bound to a specific transaction and role; acceptance grants nothing beyond
  that transaction.

## Reviewed and accepted for MVP

- **Buyer contact details** (phone/email) are snapshotted onto recommendations
  so buyers can see them without access to the agent-only `professionals` table.
  Intended exposure — the agent chose to recommend that professional.
- **Dual-role users:** a person who is a global `agent` but is invited as a buyer
  becomes a buyer participant, yet `/track` is gated to global `buyer` role, so
  they would not see the tracker. Rare; acceptable for MVP. Revisit if needed by
  gating buyer pages on membership instead of global role.
- **`viewed` event volume:** the buyer card logs at most one `viewed` per load
  (skipped if already viewed). Analytics dedupe by recommendation, so the funnel
  is unaffected regardless.
