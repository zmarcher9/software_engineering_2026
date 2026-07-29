alter table public.budgets enable row level security;

drop policy if exists budgets_manage_own on public.budgets;
create policy budgets_manage_own on public.budgets
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
