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
  project_name text,
  investment_opportunity boolean not null default false,
  expected_roi numeric(5,2) check (expected_roi is null or expected_roi >= 0),
  completion_date text,
  developer_name text,
  show_developer_to_public boolean not null default false,
  availability text not null default 'available' check (availability in ('available','booked','reserved','sold','rented')),
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
  property_ids uuid[] not null default '{}',
  inquiry text,
  assigned_agent_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  whatsapp_phone text,
  role text not null default 'agent' check (role in ('admin','agent')),
  created_at timestamptz not null default now()
);

create table if not exists public.featured_media (
  id uuid primary key default uuid_generate_v4(),
  title text not null check (char_length(title) between 1 and 160),
  description text not null default '',
  media_type text not null check (media_type in ('image','video')),
  media_url text not null check (media_url ~* '^https://'),
  thumbnail_url text check (thumbnail_url is null or thumbnail_url = '' or thumbnail_url ~* '^https://'),
  placement text not null check (placement in ('homepage_hero','homepage_strip','gallery','dashboard','listing_featured')),
  link_url text check (link_url is null or link_url = '' or link_url ~* '^https://' or (link_url like '/%' and link_url not like '//%')),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint featured_media_schedule_check check (ends_at is null or starts_at is null or ends_at > starts_at)
);

alter table public.properties enable row level security;
alter table public.leads enable row level security;
alter table public.profiles enable row level security;
alter table public.featured_media enable row level security;

create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin');
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create policy "Public can view available properties" on public.properties for select using (availability = 'available' or auth.uid() is not null);
create policy "Agents can add their own properties" on public.properties for insert to authenticated with check (auth.uid() = agent_id);
create policy "Agents can update their own properties" on public.properties for update to authenticated using (true) with check (true);
create policy "Agents can delete their own properties" on public.properties for delete to authenticated using (auth.uid() = agent_id);
create policy "Anyone can submit a lead" on public.leads for insert to anon, authenticated with check (true);
create policy "Agents can view leads" on public.leads for select to authenticated using (true);
create policy "Users can view own profile or admins can view all" on public.profiles for select to authenticated using ((select auth.uid()) = id or (select public.is_admin()));
create policy "Agents can update own profile" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy "Public can view active featured media" on public.featured_media for select to anon, authenticated using ((is_active and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at > now())) or (select public.is_admin()));
create policy "Admins can add featured media" on public.featured_media for insert to authenticated with check ((select public.is_admin()) and created_by = (select auth.uid()));
create policy "Admins can update featured media" on public.featured_media for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins can delete featured media" on public.featured_media for delete to authenticated using ((select public.is_admin()));

create or replace function public.set_updated_at() returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;
drop trigger if exists properties_set_updated_at on public.properties;
create trigger properties_set_updated_at before update on public.properties for each row execute function public.set_updated_at();
create trigger featured_media_set_updated_at before update on public.featured_media for each row execute function public.set_updated_at();

create index if not exists properties_agent_id_idx on public.properties(agent_id);
create index if not exists properties_availability_idx on public.properties(availability);
create index if not exists properties_location_idx on public.properties(lower(location));
create index if not exists properties_project_name_idx on public.properties(project_name);
create index if not exists properties_investment_idx on public.properties(investment_opportunity) where investment_opportunity = true;
create index if not exists leads_created_at_idx on public.leads(created_at desc);
create index if not exists featured_media_public_placement_idx on public.featured_media(placement, sort_order, created_at desc) where is_active = true;
create index if not exists featured_media_created_by_idx on public.featured_media(created_by);

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end; $$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.resolve_lead_route(p_property_ids uuid[])
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_agent_ids uuid[]; v_target_id uuid; v_phone text; v_route text;
begin
  select array_agg(distinct agent_id) into v_agent_ids from public.properties where id = any(coalesce(p_property_ids, '{}'));
  if cardinality(v_agent_ids) = 1 then
    v_target_id := v_agent_ids[1];
    select whatsapp_phone into v_phone from public.profiles where id = v_target_id;
    v_route := 'listing_agent';
  end if;
  if v_phone is null or cardinality(v_agent_ids) <> 1 then
    select id, whatsapp_phone into v_target_id, v_phone from public.profiles where role = 'admin' order by created_at asc limit 1;
    v_route := 'admin';
  end if;
  return jsonb_build_object('agent_id', v_target_id, 'phone', v_phone, 'route', v_route);
end; $$;

grant execute on function public.resolve_lead_route(uuid[]) to anon, authenticated;

create or replace view public.public_properties with (security_barrier = true) as
select id, title, price, location, bedrooms, bathrooms, size, type, description,
features, images, project_name, investment_opportunity, expected_roi, completion_date,
case when show_developer_to_public then developer_name else null end as developer_name,
show_developer_to_public, availability, created_at, updated_at
from public.properties where availability = 'available';

revoke select on public.properties from anon;
grant select on public.public_properties to anon, authenticated;
grant select, insert, update, delete on public.properties to authenticated;
revoke update on public.profiles from authenticated;
grant select on public.profiles to authenticated;
grant update (full_name, whatsapp_phone) on public.profiles to authenticated;
revoke all on public.featured_media from anon, authenticated;
grant select on public.featured_media to anon, authenticated;
grant insert, update, delete on public.featured_media to authenticated;
