-- Connect Supabase Auth identities to FlowFunds profiles and enforce ownership.

create or replace function public.handle_new_auth_user()
returns trigger
security definer
set search_path = public
language plpgsql
as $$
begin
    insert into public.users (id, email)
    values (new.id, new.email)
    on conflict (id) do update set email = excluded.email;

    insert into public.categories (user_id, name, description, color, icon)
    values
        (new.id, 'Food', 'Groceries and dining', '#22C55E', 'utensils'),
        (new.id, 'Transport', 'Public transit, fuel, and rides', '#0EA5E9', 'car'),
        (new.id, 'Shopping', 'Personal and household purchases', '#F97316', 'shopping-bag'),
        (new.id, 'Utilities', 'Recurring household services', '#8B5CF6', 'zap'),
        (new.id, 'Salary', 'Employment income', '#14B8A6', 'wallet')
    on conflict (user_id, name) do nothing;

    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

-- Backfill profiles for Auth users that existed before this migration.
insert into public.users (id, email)
select auth_user.id, auth_user.email
from auth.users as auth_user
where auth_user.email is not null
  and not exists (
      select 1 from public.users as app_user
      where app_user.id = auth_user.id or app_user.email = auth_user.email
  )
on conflict do nothing;

insert into public.categories (user_id, name, description, color, icon)
select app_user.id, defaults.name, defaults.description, defaults.color, defaults.icon
from public.users as app_user
join auth.users as auth_user on auth_user.id = app_user.id
cross join (
    values
        ('Food', 'Groceries and dining', '#22C55E', 'utensils'),
        ('Transport', 'Public transit, fuel, and rides', '#0EA5E9', 'car'),
        ('Shopping', 'Personal and household purchases', '#F97316', 'shopping-bag'),
        ('Utilities', 'Recurring household services', '#8B5CF6', 'zap'),
        ('Salary', 'Employment income', '#14B8A6', 'wallet')
) as defaults(name, description, color, icon)
on conflict (user_id, name) do nothing;

alter table public.users enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;

drop policy if exists users_select_own on public.users;
create policy users_select_own on public.users
for select using (auth.uid() = id);

drop policy if exists users_update_own on public.users;
create policy users_update_own on public.users
for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists categories_manage_own on public.categories;
create policy categories_manage_own on public.categories
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists transactions_manage_own on public.transactions;
create policy transactions_manage_own on public.transactions
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
