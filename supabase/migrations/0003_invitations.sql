-- Phase 3: invitations
--
-- An invitation is a capability to join a specific transaction in a specific
-- role. The raw token is emailed to the buyer and never stored; only its hash
-- is kept, so a database leak cannot be used to accept invites. Acceptance is
-- performed server-side with the service role (see lib/invitations), which is
-- why buyers need no direct write access here.

create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null
    references public.transactions (id) on delete cascade,
  email text not null,
  role text not null default 'buyer'
    check (role in ('buyer', 'co_buyer')),
  token_hash text not null unique,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'expired', 'revoked')),
  invited_by uuid not null references public.profiles (id) on delete cascade,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  accepted_profile_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists invitations_transaction_idx
  on public.invitations (transaction_id);

alter table public.invitations enable row level security;

-- Only the transaction's agent can see and manage its invitations. Acceptance
-- (buyer side) is handled by the service role, so no buyer policy is needed.
create policy "invitations_select_agent"
  on public.invitations for select
  using (public.is_transaction_agent(transaction_id));

create policy "invitations_insert_agent"
  on public.invitations for insert
  with check (public.is_transaction_agent(transaction_id));

create policy "invitations_update_agent"
  on public.invitations for update
  using (public.is_transaction_agent(transaction_id))
  with check (public.is_transaction_agent(transaction_id));
