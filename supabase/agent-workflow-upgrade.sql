-- Run once in Supabase SQL Editor for agent-wide inventory, WhatsApp lead routing,
-- developer privacy controls, and booked status. Safe to rerun.

alter table public.properties add column if not exists developer_name text;
alter table public.properties add column if not exists show_developer_to_public boolean not null default false;
alter table public.properties drop constraint if exists properties_availability_check;
alter table public.properties add constraint properties_availability_check
  check (availability in ('available','booked','reserved','sold','rented'));

alter table public.leads add column if not exists property_ids uuid[] not null default '{}';
alter table public.leads add column if not exists inquiry text;
alter table public.leads add column if not exists assigned_agent_id uuid references auth.users(id) on delete set null;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  whatsapp_phone text,
  role text not null default 'agent' check (role in ('admin','agent')),
  created_at timestamptz not null default now()
);

insert into public.profiles (id, email)
select id, email from auth.users
on conflict (id) do update set email = excluded.email;

update public.profiles set role = 'admin'
where id = (select id from auth.users order by created_at asc limit 1)
and not exists (select 1 from public.profiles where role = 'admin');

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
drop policy if exists "Agents can view profiles" on public.profiles;
create policy "Agents can view profiles" on public.profiles for select to authenticated using (true);
drop policy if exists "Agents can update own profile" on public.profiles;
create policy "Agents can update own profile" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "Public can view available properties" on public.properties;
create policy "Public can view available properties" on public.properties for select
using (availability = 'available' or auth.uid() is not null);

drop policy if exists "Agents can update their own properties" on public.properties;
create policy "Agents can update their own properties" on public.properties for update to authenticated
using (true) with check (true);

create or replace function public.resolve_lead_route(p_property_ids uuid[])
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_agent_ids uuid[];
  v_target_id uuid;
  v_phone text;
  v_route text;
begin
  select array_agg(distinct agent_id) into v_agent_ids
  from public.properties where id = any(coalesce(p_property_ids, '{}'));

  if cardinality(v_agent_ids) = 1 then
    v_target_id := v_agent_ids[1];
    select whatsapp_phone into v_phone from public.profiles where id = v_target_id;
    v_route := 'listing_agent';
  end if;

  if v_phone is null or cardinality(v_agent_ids) <> 1 then
    select id, whatsapp_phone into v_target_id, v_phone
    from public.profiles where role = 'admin' and whatsapp_phone is not null
    order by created_at asc limit 1;
    v_route := 'admin';
  end if;

  return jsonb_build_object('agent_id', v_target_id, 'phone', v_phone, 'route', v_route);
end; $$;

grant execute on function public.resolve_lead_route(uuid[]) to anon, authenticated;

-- Public clients read only this safe view. Developer names are returned only when
-- an agent explicitly enables show_developer_to_public on that listing.
create or replace view public.public_properties with (security_barrier = true) as
select
  id, title, price, location, bedrooms, bathrooms, size, type, description,
  features, images, project_name, investment_opportunity, expected_roi,
  completion_date,
  case when show_developer_to_public then developer_name else null end as developer_name,
  show_developer_to_public, availability, created_at, updated_at
from public.properties
where availability = 'available';

revoke select on public.properties from anon;
grant select on public.public_properties to anon, authenticated;
grant select, insert, update, delete on public.properties to authenticated;

-- Always identify the admin even before their WhatsApp number is configured.
create or replace function public.resolve_lead_route(p_property_ids uuid[])
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_agent_ids uuid[];
  v_target_id uuid;
  v_phone text;
  v_route text;
begin
  select array_agg(distinct agent_id) into v_agent_ids
  from public.properties where id = any(coalesce(p_property_ids, '{}'));

  if cardinality(v_agent_ids) = 1 then
    v_target_id := v_agent_ids[1];
    select whatsapp_phone into v_phone from public.profiles where id = v_target_id;
    v_route := 'listing_agent';
  end if;

  if v_phone is null or cardinality(v_agent_ids) <> 1 then
    select id, whatsapp_phone into v_target_id, v_phone
    from public.profiles where role = 'admin'
    order by created_at asc limit 1;
    v_route := 'admin';
  end if;

  return jsonb_build_object('agent_id', v_target_id, 'phone', v_phone, 'route', v_route);
end; $$;

grant execute on function public.resolve_lead_route(uuid[]) to anon, authenticated;
