-- Allow imported project inventory to keep an explicit under-construction status.

alter table public.listings drop constraint if exists listings_availability_check;
alter table public.listings drop constraint if exists properties_availability_check;

alter table public.listings
  add constraint listings_availability_check
  check (availability in (
    'available',
    'booked',
    'reserved',
    'sold',
    'rented',
    'draft',
    'inactive',
    'pending',
    'under_construction'
  ));
