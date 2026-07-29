alter table public.budgets enable row level security;

drop policy if exists budgets_manage_own on public.budgets;
create policy budgets_manage_own on public.budgets
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

grant select on table public.categories to authenticated;
grant select, insert, update, delete on table public.transactions to authenticated;
grant select, insert, update, delete on table public.budgets to authenticated;
