-- Realtors X featured media Phase 2 security hardening.
-- Reasserts the admin-only write boundary after the Phase 1 role expansion.

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
with check (
  (select public.is_admin())
  and created_by = (select auth.uid())
);

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
