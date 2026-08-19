-- Phase 2: transactions, participants, milestones
--
-- Access control backbone: a user may touch a transaction only if they are its
-- agent or a participant. Membership lives in transaction_participants and is
-- checked through SECURITY DEFINER helper functions. Those helpers bypass RLS
-- internally, which both keeps policies simple and avoids the infinite
-- recursion that would occur if a policy on transaction_participants queried
-- transaction_participants directly.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.profiles (id) on delete cascade,
  property_street text not null,
  property_unit text,
  property_city text not null,
  property_state text not null,
  property_postal_code text not null,
  -- Display info for the invited buyer, captured at creation so the agent sees
  -- the client on the dashboard before the buyer signs up. Once the buyer
  -- accepts an invite they become a participant with their own profile.
  buyer_name text,
  buyer_email text,
  status text not null default 'active'
    check (status in ('active', 'closed', 'cancelled')),
  estimated_closing_date date,
  actual_closing_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists transactions_agent_id_idx
  on public.transactions (agent_id);

create table if not exists public.transaction_participants (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null
    references public.transactions (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  role text not null
    check (role in ('agent', 'buyer', 'co_buyer', 'lender', 'escrow', 'title', 'seller', 'vendor')),
  created_at timestamptz not null default now(),
  unique (transaction_id, profile_id)
);

create index if not exists transaction_participants_profile_idx
  on public.transaction_participants (profile_id);

create table if not exists public.milestones (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null
    references public.transactions (id) on delete cascade,
  template_key text not null,
  name text not null,
  description text not null default '',
  sequence int not null,
  is_complete boolean not null default false,
  needs_attention boolean not null default false,
  due_date date,
  completed_at timestamptz,
  responsible_party text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (transaction_id, sequence)
);

create index if not exists milestones_transaction_idx
  on public.milestones (transaction_id);

-- ---------------------------------------------------------------------------
-- Authorization helpers (SECURITY DEFINER — bypass RLS to prevent recursion)
-- ---------------------------------------------------------------------------

create or replace function public.is_transaction_agent(tx uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.transactions t
    where t.id = tx and t.agent_id = auth.uid()
  );
$$;

create or replace function public.is_transaction_member(tx uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.transaction_participants p
    where p.transaction_id = tx and p.profile_id = auth.uid()
  );
$$;

create or replace function public.shares_transaction_with(other uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.transaction_participants me
    join public.transaction_participants them
      on them.transaction_id = me.transaction_id
    where me.profile_id = auth.uid() and them.profile_id = other
  );
$$;

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger transactions_set_updated_at
  before update on public.transactions
  for each row execute function public.set_updated_at();

create trigger milestones_set_updated_at
  before update on public.milestones
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.transactions enable row level security;
alter table public.transaction_participants enable row level security;
alter table public.milestones enable row level security;

-- transactions: agent owns writes; members (agent + buyers) can read.
create policy "transactions_select_member"
  on public.transactions for select
  using (agent_id = auth.uid() or public.is_transaction_member(id));

create policy "transactions_insert_own"
  on public.transactions for insert
  with check (agent_id = auth.uid());

create policy "transactions_update_agent"
  on public.transactions for update
  using (agent_id = auth.uid())
  with check (agent_id = auth.uid());

create policy "transactions_delete_agent"
  on public.transactions for delete
  using (agent_id = auth.uid());

-- transaction_participants: you can see your own membership rows; the agent can
-- see and manage all participants on their transactions. (Buyer rows created
-- during invite acceptance are inserted server-side with the service role.)
create policy "participants_select_self_or_agent"
  on public.transaction_participants for select
  using (profile_id = auth.uid() or public.is_transaction_agent(transaction_id));

create policy "participants_insert_agent"
  on public.transaction_participants for insert
  with check (public.is_transaction_agent(transaction_id));

create policy "participants_delete_agent"
  on public.transaction_participants for delete
  using (public.is_transaction_agent(transaction_id));

-- milestones: members read; only the agent writes.
create policy "milestones_select_member"
  on public.milestones for select
  using (public.is_transaction_member(transaction_id));

create policy "milestones_insert_agent"
  on public.milestones for insert
  with check (public.is_transaction_agent(transaction_id));

create policy "milestones_update_agent"
  on public.milestones for update
  using (public.is_transaction_agent(transaction_id))
  with check (public.is_transaction_agent(transaction_id));

create policy "milestones_delete_agent"
  on public.milestones for delete
  using (public.is_transaction_agent(transaction_id));

-- Now that participants exist, let people who share a transaction read each
-- other's profile (agent <-> buyer name display).
create policy "profiles_select_shared"
  on public.profiles for select
  using (public.shares_transaction_with(id));
