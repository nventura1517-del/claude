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
