-- Realtors X AI Workbench Phase 1.
-- Promotes the existing property inventory to canonical listings while keeping
-- an updatable compatibility view so the live website remains available.

do $$
begin
  if to_regclass('public.listings') is null and to_regclass('public.properties') is not null then
    alter table public.properties rename to listings;
  end if;
end;
$$;

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('admin', 'agent', 'lead'));

alter table public.leads add column if not exists lead_user_id uuid references auth.users(id) on delete set null;
drop policy if exists "Anyone can submit a lead" on public.leads;
create policy "Public submits own or anonymous leads" on public.leads for insert to anon, authenticated
  with check (lead_user_id is null or lead_user_id = (select auth.uid()));
drop policy if exists "Agents can view leads" on public.leads;
drop policy if exists "Relevant users view legacy leads" on public.leads;
create policy "Relevant users view legacy leads" on public.leads for select to authenticated
  using ((select public.is_admin()) or assigned_agent_id = (select auth.uid()) or lead_user_id = (select auth.uid()));

alter table public.listings alter column price drop not null;
alter table public.listings add column if not exists price_status text;
alter table public.listings add column if not exists source_import_id uuid;
alter table public.listings add column if not exists source_row_number integer;
alter table public.listings drop constraint if exists listings_price_or_status_check;
alter table public.listings add constraint listings_price_or_status_check
  check (price is not null or nullif(trim(price_status), '') is not null);
alter table public.listings drop constraint if exists properties_availability_check;
alter table public.listings drop constraint if exists listings_availability_check;
alter table public.listings add constraint listings_availability_check
  check (availability in ('available','booked','reserved','sold','rented','draft','inactive','pending'));

create table if not exists public.listing_media (
  id uuid primary key default uuid_generate_v4(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  media_type text not null check (media_type in ('image','video')),
  media_url text not null check (media_url ~* '^https://'),
  thumbnail_url text check (thumbnail_url is null or thumbnail_url = '' or thumbnail_url ~* '^https://'),
  alt_text text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.listing_imports (
  id uuid primary key default uuid_generate_v4(),
  created_by uuid not null references auth.users(id) on delete cascade,
  file_name text not null,
  file_type text not null check (file_type in ('csv','xlsx','xls')),
  total_rows integer not null default 0 check (total_rows >= 0),
  imported_rows integer not null default 0 check (imported_rows >= 0),
  optional_skipped_rows integer not null default 0 check (optional_skipped_rows >= 0),
  review_rows integer not null default 0 check (review_rows >= 0),
  failed_rows integer not null default 0 check (failed_rows >= 0),
  duplicate_rows integer not null default 0 check (duplicate_rows >= 0),
  status text not null default 'processing' check (status in ('processing','completed','completed_with_review','failed')),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.listing_import_rows (
  id uuid primary key default uuid_generate_v4(),
  import_id uuid not null references public.listing_imports(id) on delete cascade,
  row_number integer not null check (row_number > 0),
  raw_data jsonb not null default '{}'::jsonb,
  mapped_data jsonb not null default '{}'::jsonb,
  row_status text not null check (row_status in ('imported','optional_skipped','needs_review','required_missing','duplicate_skipped')),
  messages text[] not null default '{}',
  listing_id uuid references public.listings(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(import_id, row_number)
);

alter table public.listings drop constraint if exists listings_source_import_id_fkey;
alter table public.listings add constraint listings_source_import_id_fkey
  foreign key (source_import_id) references public.listing_imports(id) on delete set null;

create table if not exists public.ai_conversations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'New conversation',
  category text check (category is null or category in ('property_search_lead','contact_request','showing_request','listing_submission','bulk_listing_import','listing_update','featured_media_request','media_upload','admin_task','agent_support','general_question','unknown_needs_followup')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
  sender text not null check (sender in ('user','assistant','system')),
  content text not null,
  structured_data jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_inquiries (
  id uuid primary key default uuid_generate_v4(),
  lead_user_id uuid references auth.users(id) on delete set null,
  assigned_agent_id uuid references auth.users(id) on delete set null,
  conversation_id uuid references public.ai_conversations(id) on delete set null,
  category text not null check (category in ('property_search_lead','contact_request','showing_request','listing_submission','bulk_listing_import','listing_update','featured_media_request','media_upload','admin_task','agent_support','general_question','unknown_needs_followup')),
  subject text not null,
  details text not null,
  contact_name text,
  contact_email text,
  contact_phone text,
  listing_ids uuid[] not null default '{}',
  status text not null default 'new' check (status in ('new','assigned','in_progress','resolved','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_uploads (
  id uuid primary key default uuid_generate_v4(),
  created_by uuid not null references auth.users(id) on delete cascade,
  import_id uuid references public.listing_imports(id) on delete set null,
  file_name text not null,
  file_type text not null,
  file_size bigint check (file_size is null or file_size >= 0),
  purpose text not null default 'bulk_listing_import',
  status text not null default 'received' check (status in ('received','processing','completed','failed')),
  created_at timestamptz not null default now()
);

create or replace function public.current_user_role()
returns text language sql stable security definer set search_path = '' as $$
  select role from public.profiles where id = (select auth.uid());
$$;
revoke all on function public.current_user_role() from public;
grant execute on function public.current_user_role() to authenticated;

create or replace function public.can_view_listing_media(target_listing_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.listings l
    where l.id = target_listing_id
      and (
        l.availability = 'available'
        or l.agent_id = (select auth.uid())
        or (select public.is_admin())
      )
  );
$$;
revoke all on function public.can_view_listing_media(uuid) from public;
grant execute on function public.can_view_listing_media(uuid) to anon, authenticated;

alter table public.listings enable row level security;
alter table public.listing_media enable row level security;
alter table public.listing_imports enable row level security;
alter table public.listing_import_rows enable row level security;
alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;
alter table public.ai_inquiries enable row level security;
alter table public.ai_uploads enable row level security;

drop policy if exists "Public can view available properties" on public.listings;
drop policy if exists "Agents can add their own properties" on public.listings;
drop policy if exists "Agents can update their own properties" on public.listings;
drop policy if exists "Agents can delete their own properties" on public.listings;
create policy "Owners view listings" on public.listings for select to authenticated
  using (agent_id = (select auth.uid()) or (select public.is_admin()));
create policy "Agents add own listings" on public.listings for insert to authenticated
  with check ((agent_id = (select auth.uid()) and (select public.current_user_role()) in ('agent','admin')) or (select public.is_admin()));
create policy "Agents update own listings" on public.listings for update to authenticated
  using (agent_id = (select auth.uid()) or (select public.is_admin()))
  with check (agent_id = (select auth.uid()) or (select public.is_admin()));
create policy "Agents delete own listings" on public.listings for delete to authenticated
  using (agent_id = (select auth.uid()) or (select public.is_admin()));

create policy "Public or owners view listing media" on public.listing_media for select to anon, authenticated
  using ((select public.can_view_listing_media(listing_id)));
create policy "Owners manage listing media" on public.listing_media for all to authenticated
  using (exists (select 1 from public.listings l where l.id = listing_id and (l.agent_id = (select auth.uid()) or (select public.is_admin()))))
  with check (exists (select 1 from public.listings l where l.id = listing_id and (l.agent_id = (select auth.uid()) or (select public.is_admin()))));

create policy "Owners view imports" on public.listing_imports for select to authenticated
  using (created_by = (select auth.uid()) or (select public.is_admin()));
create policy "Agents create imports" on public.listing_imports for insert to authenticated
  with check (created_by = (select auth.uid()) and (select public.current_user_role()) in ('agent','admin'));
create policy "Owners update imports" on public.listing_imports for update to authenticated
  using (created_by = (select auth.uid()) or (select public.is_admin()))
  with check (created_by = (select auth.uid()) or (select public.is_admin()));
create policy "Owners delete imports" on public.listing_imports for delete to authenticated
  using (created_by = (select auth.uid()) or (select public.is_admin()));

create policy "Owners view import rows" on public.listing_import_rows for select to authenticated
  using (exists (select 1 from public.listing_imports i where i.id = import_id and (i.created_by = (select auth.uid()) or (select public.is_admin()))));
create policy "Owners create import rows" on public.listing_import_rows for insert to authenticated
  with check (exists (select 1 from public.listing_imports i where i.id = import_id and (i.created_by = (select auth.uid()) or (select public.is_admin()))));
create policy "Owners update import rows" on public.listing_import_rows for update to authenticated
  using (exists (select 1 from public.listing_imports i where i.id = import_id and (i.created_by = (select auth.uid()) or (select public.is_admin()))));

create policy "Users own conversations" on public.ai_conversations for all to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()))
  with check (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "Users own messages" on public.ai_messages for all to authenticated
  using (exists (select 1 from public.ai_conversations c where c.id = conversation_id and (c.user_id = (select auth.uid()) or (select public.is_admin()))))
  with check (exists (select 1 from public.ai_conversations c where c.id = conversation_id and (c.user_id = (select auth.uid()) or (select public.is_admin()))));

create policy "Public creates inquiries" on public.ai_inquiries for insert to anon, authenticated
  with check (
    (lead_user_id is null or lead_user_id = (select auth.uid()))
    and assigned_agent_id is null
    and status = 'new'
    and (
      conversation_id is null
      or exists (
        select 1 from public.ai_conversations c
        where c.id = conversation_id and c.user_id = (select auth.uid())
      )
    )
  );
create policy "Relevant users view inquiries" on public.ai_inquiries for select to authenticated
  using ((select public.is_admin()) or lead_user_id = (select auth.uid()) or assigned_agent_id = (select auth.uid()));
create policy "Assigned agents update inquiries" on public.ai_inquiries for update to authenticated
  using ((select public.is_admin()) or assigned_agent_id = (select auth.uid()))
  with check ((select public.is_admin()) or assigned_agent_id = (select auth.uid()));
create policy "Admins delete inquiries" on public.ai_inquiries for delete to authenticated
  using ((select public.is_admin()));

create policy "Owners manage uploads" on public.ai_uploads for all to authenticated
  using (created_by = (select auth.uid()) or (select public.is_admin()))
  with check (created_by = (select auth.uid()) or (select public.is_admin()));

revoke all on public.listing_media, public.listing_imports, public.listing_import_rows,
  public.ai_conversations, public.ai_messages, public.ai_inquiries, public.ai_uploads from anon, authenticated;
grant select on public.listing_media to anon, authenticated;
grant select, insert, update, delete on public.listing_media, public.listing_imports,
  public.listing_import_rows, public.ai_conversations, public.ai_messages, public.ai_uploads to authenticated;
grant insert on public.ai_inquiries to anon, authenticated;
grant select, update, delete on public.ai_inquiries to authenticated;
revoke all on public.listings from anon, authenticated;
grant select, insert, update, delete on public.listings to authenticated;

drop view if exists public.properties;
create view public.properties with (security_invoker = true) as select * from public.listings;
revoke all on public.properties from anon, authenticated;
grant select, insert, update, delete on public.properties to authenticated;

drop view if exists public.public_properties;
create view public.public_properties with (security_barrier = true) as
select id, title, price, price_status, location, bedrooms, bathrooms, size, type, description,
features, images, project_name, investment_opportunity, expected_roi, completion_date,
case when show_developer_to_public then developer_name else null end as developer_name,
show_developer_to_public, availability, created_at, updated_at
from public.listings where availability = 'available';
grant select on public.public_properties to anon, authenticated;

drop trigger if exists listings_set_updated_at on public.listings;
drop trigger if exists properties_set_updated_at on public.listings;
create trigger listings_set_updated_at before update on public.listings for each row execute function public.set_updated_at();
drop trigger if exists ai_conversations_set_updated_at on public.ai_conversations;
create trigger ai_conversations_set_updated_at before update on public.ai_conversations for each row execute function public.set_updated_at();
drop trigger if exists ai_inquiries_set_updated_at on public.ai_inquiries;
create trigger ai_inquiries_set_updated_at before update on public.ai_inquiries for each row execute function public.set_updated_at();

create index if not exists listings_agent_idx on public.listings(agent_id);
create index if not exists listings_public_active_idx on public.listings(availability, created_at desc) where availability = 'available';
create index if not exists listing_media_listing_idx on public.listing_media(listing_id, sort_order);
create index if not exists listing_imports_owner_idx on public.listing_imports(created_by, created_at desc);
create index if not exists listing_import_rows_import_idx on public.listing_import_rows(import_id, row_number);
create index if not exists ai_conversations_user_idx on public.ai_conversations(user_id, updated_at desc);
create index if not exists ai_messages_conversation_idx on public.ai_messages(conversation_id, created_at);
create index if not exists ai_inquiries_lead_idx on public.ai_inquiries(lead_user_id, created_at desc);
create index if not exists ai_inquiries_agent_idx on public.ai_inquiries(assigned_agent_id, status, created_at desc);
create index if not exists ai_uploads_owner_idx on public.ai_uploads(created_by, created_at desc);
