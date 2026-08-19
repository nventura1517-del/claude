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
