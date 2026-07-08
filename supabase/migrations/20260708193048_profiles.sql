-- Sprint 1: profiles table + handle_new_user trigger (docs/03-data-model-solo.md sec 5.1)

create extension if not exists citext;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username citext not null unique check (username ~ '^[a-z0-9_]{3,20}$'),
  display_name text not null check (char_length(display_name) <= 50),
  avatar_url text,
  default_workout_public boolean not null default false,
  preferred_unit text not null default 'kg' check (preferred_unit in ('kg', 'lbs')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.profiles force row level security;

create policy profiles_select_own
  on public.profiles for select
  using (auth.uid() = id);

create policy profiles_update_own
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Public, low-sensitivity view: username availability checks (pre-auth, sign-up
-- screen) and, later, friend search. docs/09-security.md sec "RLS".
create view public.public_profiles
  with (security_invoker = true) as
  select id, username, display_name, avatar_url from public.profiles;

grant select on public.public_profiles to anon, authenticated;

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'user_' || left(new.id::text, 8)),
    coalesce(new.raw_user_meta_data->>'display_name', 'New User')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Avatar uploads: one public-read bucket, writes scoped to the user's own folder.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy avatars_public_read
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy avatars_own_write
  on storage.objects for insert
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy avatars_own_update
  on storage.objects for update
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy avatars_own_delete
  on storage.objects for delete
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
