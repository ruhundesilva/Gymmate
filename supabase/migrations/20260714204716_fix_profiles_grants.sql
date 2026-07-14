-- Fix: 20260708193048_profiles.sql enabled RLS on public.profiles but never
-- granted the underlying table privileges Postgres checks before RLS policies
-- are even evaluated, so every authenticated/anon query hit "permission
-- denied for table profiles" instead of the intended RLS allow/deny.
-- public_profiles is security_invoker, so anon needs this grant too — RLS
-- (no anon-facing policy on profiles) still limits anon to zero rows.

grant select, update on public.profiles to authenticated;
grant select on public.profiles to anon;

-- public_profiles was declared security_invoker = true, so it inherited the
-- profiles_select_own RLS policy (auth.uid() = id) instead of bypassing it —
-- meaning anon/other users got zero rows, defeating its purpose (username
-- availability pre-auth, later friend search). Run it as the view owner
-- instead so it exposes the allowlisted columns for every row.
alter view public.public_profiles set (security_invoker = false);
