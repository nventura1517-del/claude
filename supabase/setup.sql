-- Homeward — combined database bootstrap (GENERATED, do not edit by hand).
-- Source of truth is the individual files in supabase/migrations/.
-- Paste this whole file into the Supabase SQL editor and Run, once, on a fresh project.

-- ============================================================
-- supabase/migrations/0001_profiles.sql
-- ============================================================
-- Phase 1: profiles
--
-- A `profiles` row mirrors each auth.users row and holds app-level identity
-- (name, phone, default role). It is created automatically by a trigger on
-- signup so application code never has to remember to create it.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  phone text,
  -- Global default role. Per-transaction role lives in transaction_participants.
  -- V1 uses 'agent' | 'buyer'; others are reserved for later.
  role text not null default 'agent'
    check (role in ('agent', 'buyer', 'lender', 'escrow', 'title', 'seller', 'vendor')),
  created_at timestamptz not null default now()
);

-- Row Level Security: deny-by-default, then allow a user to see/update only
-- their own profile. Cross-participant visibility is added in a later phase
-- once transaction_participants exists.
alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (id = auth.uid());

create policy "profiles_update_own"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- Insert is handled by the signup trigger (security definer) below; we do not
-- grant a broad insert policy to end users.

-- Create the profile automatically when an auth user is created. Role and name
-- come from the signup metadata; role defaults to 'agent' for self-signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    case
      when new.raw_user_meta_data ->> 'role' in ('agent', 'buyer')
        then new.raw_user_meta_data ->> 'role'
      else 'agent'
    end
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- supabase/migrations/0002_transactions.sql
-- ============================================================
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

-- ============================================================
-- supabase/migrations/0003_invitations.sql
-- ============================================================
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

-- ============================================================
-- supabase/migrations/0004_professionals.sql
-- ============================================================
-- Phase 6: professionals (agent's private referral network)
--
-- Each professional belongs to exactly one agent and is visible only to that
-- agent. Buyers never read this table directly; they see professionals only
-- through recommendations (Phase 7), which expose a controlled subset.

create table if not exists public.professionals (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  company text,
  category text not null check (
    category in (
      'mortgage', 'escrow_title', 'home_inspection', 'home_insurance',
      'home_warranty', 'moving', 'cleaning', 'plumbing', 'electrical', 'hvac',
      'general_contractor', 'roofing', 'landscaping', 'pool_service', 'handyman'
    )
  ),
  phone text,
  email text,
  website text,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists professionals_agent_idx
  on public.professionals (agent_id);

create trigger professionals_set_updated_at
  before update on public.professionals
  for each row execute function public.set_updated_at();

alter table public.professionals enable row level security;

-- The owning agent has full control; nobody else can see these rows.
create policy "professionals_select_own"
  on public.professionals for select
  using (agent_id = auth.uid());

create policy "professionals_insert_own"
  on public.professionals for insert
  with check (agent_id = auth.uid());

create policy "professionals_update_own"
  on public.professionals for update
  using (agent_id = auth.uid())
  with check (agent_id = auth.uid());

create policy "professionals_delete_own"
  on public.professionals for delete
  using (agent_id = auth.uid());

-- ============================================================
-- supabase/migrations/0005_recommendations.sql
-- ============================================================
-- Phase 7: recommendations + attribution ledger
--
-- A recommendation links one of the agent's professionals to a transaction
-- (optionally to a milestone/stage). recommendation_events is an append-only
-- ledger of funnel activity. Analytics count DISTINCT recommendations that
-- reached each stage, so duplicate events never distort the funnel.

create table if not exists public.recommendations (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null
    references public.transactions (id) on delete cascade,
  professional_id uuid not null
    references public.professionals (id) on delete cascade,
  milestone_id uuid references public.milestones (id) on delete set null,
  created_by uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'active'
    check (status in ('active', 'dismissed')),
  -- Snapshot of the professional at recommendation time. Lets buyers see the
  -- contact details (they cannot read the agent-only professionals table) and
  -- preserves what was actually recommended even if the pro is later edited.
  prof_name text not null,
  prof_company text,
  prof_category text not null,
  prof_phone text,
  prof_email text,
  prof_website text,
  created_at timestamptz not null default now(),
  unique (transaction_id, professional_id)
);

create index if not exists recommendations_transaction_idx
  on public.recommendations (transaction_id);

create table if not exists public.recommendation_events (
  id uuid primary key default gen_random_uuid(),
  recommendation_id uuid not null
    references public.recommendations (id) on delete cascade,
  event_type text not null check (
    event_type in (
      'shown', 'viewed', 'call_initiated', 'text_initiated',
      'quote_requested', 'booked', 'completed'
    )
  ),
  actor_profile_id uuid references public.profiles (id) on delete set null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists recommendation_events_rec_idx
  on public.recommendation_events (recommendation_id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.recommendations enable row level security;
alter table public.recommendation_events enable row level security;

-- recommendations: members read; only the transaction agent writes.
create policy "recommendations_select_member"
  on public.recommendations for select
  using (public.is_transaction_member(transaction_id));

create policy "recommendations_insert_agent"
  on public.recommendations for insert
  with check (public.is_transaction_agent(transaction_id));

create policy "recommendations_update_agent"
  on public.recommendations for update
  using (public.is_transaction_agent(transaction_id))
  with check (public.is_transaction_agent(transaction_id));

create policy "recommendations_delete_agent"
  on public.recommendations for delete
  using (public.is_transaction_agent(transaction_id));

-- recommendation_events: any member of the parent transaction may read and
-- append (buyers log their own view/contact/booking events). Append-only:
-- there are deliberately no update or delete policies.
create policy "recommendation_events_select_member"
  on public.recommendation_events for select
  using (
    exists (
      select 1 from public.recommendations r
      where r.id = recommendation_id
        and public.is_transaction_member(r.transaction_id)
    )
  );

create policy "recommendation_events_insert_member"
  on public.recommendation_events for insert
  with check (
    exists (
      select 1 from public.recommendations r
      where r.id = recommendation_id
        and public.is_transaction_member(r.transaction_id)
    )
  );

