-- Run this entire file in Supabase > SQL Editor.
create extension if not exists "uuid-ossp";

create table if not exists public.properties (
  id uuid primary key default uuid_generate_v4(),
  agent_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  price numeric(14,2) not null check (price >= 0),
  location text not null,
  bedrooms integer not null default 0 check (bedrooms >= 0),
  bathrooms numeric(4,1) not null default 0 check (bathrooms >= 0),
  size numeric(12,2) not null default 0 check (size >= 0),
  type text not null,
  description text not null default '',
  features text[] not null default '{}',
  images text[] not null default '{}',
  availability text not null default 'available' check (availability in ('available','reserved','sold','rented')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.leads (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  phone text not null,
  budget numeric(14,2) not null check (budget >= 0),
  preferred_area text not null,
  move_in_date date,
  requested_property_type text not null,
  created_at timestamptz not null default now()
);

alter table public.properties enable row level security;
alter table public.leads enable row level security;

create policy "Public can view available properties" on public.properties for select using (availability = 'available' or auth.uid() = agent_id);
create policy "Agents can add their own properties" on public.properties for insert to authenticated with check (auth.uid() = agent_id);
create policy "Agents can update their own properties" on public.properties for update to authenticated using (auth.uid() = agent_id) with check (auth.uid() = agent_id);
create policy "Agents can delete their own properties" on public.properties for delete to authenticated using (auth.uid() = agent_id);
create policy "Anyone can submit a lead" on public.leads for insert to anon, authenticated with check (true);
create policy "Agents can view leads" on public.leads for select to authenticated using (true);

create or replace function public.set_updated_at() returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;
drop trigger if exists properties_set_updated_at on public.properties;
create trigger properties_set_updated_at before update on public.properties for each row execute function public.set_updated_at();

create index if not exists properties_agent_id_idx on public.properties(agent_id);
create index if not exists properties_availability_idx on public.properties(availability);
create index if not exists properties_location_idx on public.properties(lower(location));
create index if not exists leads_created_at_idx on public.leads(created_at desc);
