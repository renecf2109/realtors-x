-- Assign the requested Realtors X account as admin without storing its email
-- address in source control. The salted fingerprint must match exactly one
-- authenticated account or the migration fails without changing any role.

do $$
declare
  target_user_id uuid;
  matching_users integer;
begin
  select count(*)
  into matching_users
  from auth.users
  where md5('863ab0ee50e24f42aa25a15eab2032b1:' || lower(email)) = '57f1631f2db66a2702224b85b5e81d0a';

  select id
  into target_user_id
  from auth.users
  where md5('863ab0ee50e24f42aa25a15eab2032b1:' || lower(email)) = '57f1631f2db66a2702224b85b5e81d0a'
  limit 1;

  if matching_users <> 1 or target_user_id is null then
    raise exception 'Admin assignment requires exactly one matching authenticated account';
  end if;

  insert into public.profiles (id, email)
  select id, email from auth.users where id = target_user_id
  on conflict (id) do nothing;

  update public.profiles
  set role = 'admin'
  where id = target_user_id;

  if not found then
    raise exception 'Admin profile could not be updated';
  end if;
end;
$$;
