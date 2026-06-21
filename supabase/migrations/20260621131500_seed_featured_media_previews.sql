-- Temporary, editable featured-media previews requested for every placement.
-- These use the existing Realtors X logo URL and can be edited or deleted from
-- /admin/featured-media after real campaign assets are ready.

do $$
declare
  admin_id uuid;
  preview_count integer;
begin
  select id into admin_id
  from public.profiles
  where role = 'admin'
  order by created_at asc, id asc
  limit 1;

  if admin_id is null then
    raise exception 'Cannot seed featured-media previews: no admin profile exists';
  end if;

  insert into public.featured_media
    (title, description, media_type, media_url, thumbnail_url, placement, link_url, sort_order, is_active, created_by)
  select seed.title, seed.description, 'image', 'https://realtors-x.vercel.app/logo.png', null,
    seed.placement, seed.link_url, 0, true, admin_id
  from (values
    ('Realtors X preview: homepage hero', 'Featured project advertising appears here in the homepage hero.', 'homepage_hero', '/projects'),
    ('Realtors X preview: homepage strip', 'Featured projects and campaigns appear in this homepage advertising band.', 'homepage_strip', '/projects'),
    ('Realtors X preview: dashboard', 'Featured project promotions appear here for signed-in agents.', 'dashboard', '/projects'),
    ('Realtors X preview: gallery', 'Campaign images and videos can appear inside project and property galleries.', 'gallery', '/projects'),
    ('Realtors X preview: listing featured', 'A featured campaign can appear across listings or target one property.', 'listing_featured', null)
  ) as seed(title, description, placement, link_url)
  where not exists (
    select 1 from public.featured_media existing
    where existing.title = seed.title and existing.placement = seed.placement
  );

  select count(*) into preview_count
  from public.featured_media
  where title like 'Realtors X preview:%';

  if preview_count < 5 then
    raise exception 'Featured-media preview seed is incomplete';
  end if;
end;
$$;
