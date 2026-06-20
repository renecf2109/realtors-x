-- Run once in Supabase SQL Editor to enable property galleries.
alter table public.properties add column if not exists images text[] not null default '{}';
alter table public.properties add column if not exists project_name text;
alter table public.properties add column if not exists investment_opportunity boolean not null default false;
alter table public.properties add column if not exists expected_roi numeric(5,2);
alter table public.properties add column if not exists completion_date text;

create index if not exists properties_project_name_idx on public.properties(project_name);
create index if not exists properties_investment_idx on public.properties(investment_opportunity) where investment_opportunity = true;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('property-images', 'property-images', true, 10485760, array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do update set public = true;

do $$ begin
  create policy "Public can view property images" on storage.objects for select using (bucket_id = 'property-images');
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Agents can upload property images" on storage.objects for insert to authenticated
  with check (bucket_id = 'property-images' and (storage.foldername(name))[1] = auth.uid()::text);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Agents can update property images" on storage.objects for update to authenticated
  using (bucket_id = 'property-images' and (storage.foldername(name))[1] = auth.uid()::text);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Agents can delete property images" on storage.objects for delete to authenticated
  using (bucket_id = 'property-images' and (storage.foldername(name))[1] = auth.uid()::text);
exception when duplicate_object then null; end $$;
