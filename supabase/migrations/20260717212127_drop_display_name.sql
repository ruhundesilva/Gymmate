-- Drop display_name: username is the single identity field now.
-- public_profiles view depends on the column, so drop/recreate it around the change.

drop view public.public_profiles;

alter table public.profiles drop column display_name;

create view public.public_profiles
  with (security_invoker = true) as
  select id, username, avatar_url from public.profiles;

grant select on public.public_profiles to anon, authenticated;

-- Trigger no longer seeds display_name.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'user_' || left(new.id::text, 8))
  );
  return new;
end;
$$;
