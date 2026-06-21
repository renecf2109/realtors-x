-- One clearly labeled, removable property makes gallery, project, and
-- listing-featured preview placements visible before real inventory arrives.

do $$
declare
  admin_id uuid;
begin
  select id into admin_id
  from public.profiles
  where role = 'admin'
  order by created_at asc, id asc
  limit 1;

  if admin_id is null then
    raise exception 'Cannot seed preview property: no admin profile exists';
  end if;

  insert into public.properties (
    agent_id, title, price, location, bedrooms, bathrooms, size, type,
    description, features, images, project_name, investment_opportunity,
    developer_name, show_developer_to_public, availability
  )
  select
    admin_id,
    'Realtors X Preview Property',
    250000,
    'Beirut - Preview Only',
    2,
    2,
    1400,
    'apartment',
    'Demonstration listing for featured-media placement previews. Replace or delete this listing when real inventory is ready.',
    array['featured media preview', 'logo gallery', 'demo project'],
    array['https://realtors-x.vercel.app/logo.png'],
    'Realtors X Preview Project',
    false,
    'Realtors X',
    true,
    'available'
  where not exists (
    select 1 from public.properties where title = 'Realtors X Preview Property'
  );

  -- A linkless gallery preview is global and therefore appears in this project
  -- and property gallery. It remains editable in the admin media manager.
  update public.featured_media
  set link_url = null
  where title = 'Realtors X preview: gallery';
end;
$$;
