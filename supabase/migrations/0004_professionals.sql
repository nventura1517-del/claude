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
