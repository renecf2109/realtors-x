-- Secure Realtors X admin roles and featured website media.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- Agents may edit contact details, but never promote their own account.
revoke update on public.profiles from authenticated;
grant select on public.profiles to authenticated;
grant update (full_name, whatsapp_phone) on public.profiles to authenticated;

drop policy if exists "Agents can view profiles" on public.profiles;
drop policy if exists "Users can view own profile or admins can view all" on public.profiles;
create policy "Users can view own profile or admins can view all"
on public.profiles for select to authenticated
using ((select auth.uid()) = id or (select public.is_admin()));

create table if not exists public.featured_media (
  id uuid primary key default uuid_generate_v4(),
  title text not null check (char_length(title) between 1 and 160),
  description text not null default '',
  media_type text not null check (media_type in ('image', 'video')),
  media_url text not null check (media_url ~* '^https://'),
  thumbnail_url text check (thumbnail_url is null or thumbnail_url = '' or thumbnail_url ~* '^https://'),
  placement text not null check (placement in ('homepage_hero', 'homepage_strip', 'gallery', 'dashboard', 'listing_featured')),
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

alter table public.featured_media enable row level security;

drop policy if exists "Public can view active featured media" on public.featured_media;
create policy "Public can view active featured media"
on public.featured_media for select to anon, authenticated
using (
  (
    is_active
    and (starts_at is null or starts_at <= now())
    and (ends_at is null or ends_at > now())
  )
  or (select public.is_admin())
);

drop policy if exists "Admins can add featured media" on public.featured_media;
create policy "Admins can add featured media"
on public.featured_media for insert to authenticated
with check ((select public.is_admin()) and created_by = (select auth.uid()));

drop policy if exists "Admins can update featured media" on public.featured_media;
create policy "Admins can update featured media"
on public.featured_media for update to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "Admins can delete featured media" on public.featured_media;
create policy "Admins can delete featured media"
on public.featured_media for delete to authenticated
using ((select public.is_admin()));

revoke all on public.featured_media from anon, authenticated;
grant select on public.featured_media to anon, authenticated;
grant insert, update, delete on public.featured_media to authenticated;

drop trigger if exists featured_media_set_updated_at on public.featured_media;
create trigger featured_media_set_updated_at
before update on public.featured_media
for each row execute function public.set_updated_at();

create index if not exists featured_media_public_placement_idx
on public.featured_media (placement, sort_order, created_at desc)
where is_active = true;

create index if not exists featured_media_created_by_idx
on public.featured_media (created_by);
