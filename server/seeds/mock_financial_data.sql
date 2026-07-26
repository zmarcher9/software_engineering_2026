-- Development-only data for frontend work.
-- First register demo@flowfunds.local through the app, then run this file.
-- Change demo_email below if you want to seed a different authenticated user.

do $$
declare
    demo_email constant text := 'demo@flowfunds.local';
    demo_user_id uuid;
    food_id uuid;
    transport_id uuid;
    shopping_id uuid;
    utilities_id uuid;
    salary_id uuid;
begin
    select id into demo_user_id from auth.users where email = demo_email;
    if demo_user_id is null then
        raise exception 'Create the Supabase Auth user % before running this seed', demo_email;
    end if;

    insert into public.users (id, email, first_name, last_name)
    values (demo_user_id, demo_email, 'Demo', 'User')
    on conflict (id) do update set
        email = excluded.email,
        first_name = excluded.first_name,
        last_name = excluded.last_name;

    insert into public.categories (user_id, name, description, color, icon)
    values
        (demo_user_id, 'Food', 'Groceries and dining', '#22C55E', 'utensils'),
        (demo_user_id, 'Transport', 'Public transit, fuel, and rides', '#0EA5E9', 'car'),
        (demo_user_id, 'Shopping', 'Personal and household purchases', '#F97316', 'shopping-bag'),
        (demo_user_id, 'Utilities', 'Recurring household services', '#8B5CF6', 'zap'),
        (demo_user_id, 'Salary', 'Employment income', '#14B8A6', 'wallet')
    on conflict (user_id, name) do update set
        description = excluded.description,
        color = excluded.color,
        icon = excluded.icon;

    select id into food_id from public.categories where user_id = demo_user_id and name = 'Food';
    select id into transport_id from public.categories where user_id = demo_user_id and name = 'Transport';
    select id into shopping_id from public.categories where user_id = demo_user_id and name = 'Shopping';
    select id into utilities_id from public.categories where user_id = demo_user_id and name = 'Utilities';
    select id into salary_id from public.categories where user_id = demo_user_id and name = 'Salary';

    insert into public.transactions (
        id, user_id, category_id, amount, transaction_type, transaction_date, merchant, note
    )
    values
        ('30000000-0000-0000-0000-000000000001', demo_user_id, salary_id, 4200.00, 'income', current_date - 14, 'FlowFunds Demo Co.', 'Monthly salary'),
        ('30000000-0000-0000-0000-000000000002', demo_user_id, utilities_id, 1450.00, 'expense', current_date - 12, 'Maple Apartments', 'Monthly rent'),
        ('30000000-0000-0000-0000-000000000003', demo_user_id, food_id, 86.42, 'expense', current_date - 7, 'Fresh Market', 'Weekly groceries'),
        ('30000000-0000-0000-0000-000000000004', demo_user_id, transport_id, 24.80, 'expense', current_date - 3, 'City Transit', 'Transit pass'),
        ('30000000-0000-0000-0000-000000000005', demo_user_id, shopping_id, 62.17, 'expense', current_date - 1, 'Corner Store', 'Household supplies')
    on conflict (id) do update set
        user_id = excluded.user_id,
        category_id = excluded.category_id,
        amount = excluded.amount,
        transaction_type = excluded.transaction_type,
        transaction_date = excluded.transaction_date,
        merchant = excluded.merchant,
        note = excluded.note;
end $$;
