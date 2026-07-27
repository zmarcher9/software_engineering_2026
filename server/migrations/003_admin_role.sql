-- Adds an admin role to FlowFunds.
-- Run this after 001_initial_schema.sql and 002_supabase_auth_and_rls.sql,
-- in the Supabase SQL Editor or against the project's PostgreSQL database.

alter table public.users
    add column if not exists is_admin boolean not null default false;

-- security definer so the RLS policies below can check a caller's own
-- is_admin flag without recursively re-evaluating RLS on public.users.
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select coalesce(
        (select is_admin from public.users where id = uid),
        false
    );
$$;

-- Admins can read every profile; everyone can still read their own.
drop policy if exists users_select_own on public.users;
create policy users_select_own on public.users
    for select
    using (auth.uid() = id or public.is_admin(auth.uid()));

-- Admins get read-only visibility into every user's categories...
drop policy if exists categories_admin_select_all on public.categories;
create policy categories_admin_select_all on public.categories
    for select
    using (public.is_admin(auth.uid()));

-- ...and every user's transactions. This is additive: the existing
-- categories_manage_own / transactions_manage_own policies still give each
-- user full read/write on their own rows only. Admins never gain write
-- access to another user's data through this migration.
drop policy if exists transactions_admin_select_all on public.transactions;
create policy transactions_admin_select_all on public.transactions
    for select
    using (public.is_admin(auth.uid()));

-- Promote a user to admin after they've signed up, e.g.:
--   update public.users set is_admin = true where email = 'admin@example.com';
