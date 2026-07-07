-- FlowFunds initial database schema.
-- Run this in the Supabase SQL Editor or against the project's PostgreSQL database.

create extension if not exists pgcrypto;
create extension if not exists citext;

do $$
begin
    if not exists (select 1 from pg_type where typname = 'transaction_type') then
        create type transaction_type as enum ('expense', 'income');
    end if;

    if not exists (select 1 from pg_type where typname = 'budget_period') then
        create type budget_period as enum ('weekly', 'monthly', 'yearly', 'custom');
    end if;

    if not exists (select 1 from pg_type where typname = 'alert_type') then
        create type alert_type as enum ('budget_warning', 'budget_exceeded', 'general');
    end if;

    if not exists (select 1 from pg_type where typname = 'alert_status') then
        create type alert_status as enum ('unread', 'read', 'dismissed');
    end if;
end $$;

create or replace function set_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create table if not exists users (
    id uuid primary key default gen_random_uuid(),
    email citext not null unique,
    password_hash text,
    first_name text,
    last_name text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint users_email_not_blank check (length(trim(email::text)) > 0)
);

create table if not exists categories (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references users(id) on delete cascade,
    name text not null,
    description text,
    color text,
    icon text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint categories_name_not_blank check (length(trim(name)) > 0),
    constraint categories_id_user_id_unique unique (id, user_id),
    constraint categories_user_name_unique unique (user_id, name)
);

create table if not exists budgets (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references users(id) on delete cascade,
    category_id uuid not null,
    name text not null,
    period budget_period not null default 'monthly',
    start_date date not null,
    end_date date,
    limit_amount numeric(12, 2) not null,
    warning_threshold_percent integer not null default 80,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint budgets_name_not_blank check (length(trim(name)) > 0),
    constraint budgets_limit_amount_positive check (limit_amount > 0),
    constraint budgets_warning_threshold_range check (
        warning_threshold_percent between 1 and 100
    ),
    constraint budgets_date_range check (end_date is null or end_date >= start_date),
    constraint budgets_id_user_id_unique unique (id, user_id),
    constraint budgets_category_belongs_to_user foreign key (category_id, user_id)
        references categories(id, user_id)
        on delete cascade,
    constraint budgets_user_category_period_unique unique (
        user_id,
        category_id,
        period,
        start_date
    )
);

create table if not exists transactions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references users(id) on delete cascade,
    category_id uuid,
    amount numeric(12, 2) not null,
    transaction_type transaction_type not null default 'expense',
    transaction_date date not null default current_date,
    note text,
    merchant text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint transactions_amount_positive check (amount > 0),
    constraint transactions_category_belongs_to_user foreign key (category_id, user_id)
        references categories(id, user_id)
        on delete set null (category_id)
);

create table if not exists alerts (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references users(id) on delete cascade,
    budget_id uuid,
    category_id uuid,
    type alert_type not null default 'general',
    status alert_status not null default 'unread',
    title text not null,
    message text not null,
    threshold_percent integer,
    triggered_at timestamptz not null default now(),
    read_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint alerts_title_not_blank check (length(trim(title)) > 0),
    constraint alerts_message_not_blank check (length(trim(message)) > 0),
    constraint alerts_threshold_range check (
        threshold_percent is null or threshold_percent between 1 and 100
    ),
    constraint alerts_read_at_status check (
        (status = 'read' and read_at is not null)
        or (status <> 'read')
    ),
    constraint alerts_budget_belongs_to_user foreign key (budget_id, user_id)
        references budgets(id, user_id)
        on delete cascade,
    constraint alerts_category_belongs_to_user foreign key (category_id, user_id)
        references categories(id, user_id)
        on delete set null (category_id)
);

create index if not exists idx_categories_user_id on categories(user_id);
create index if not exists idx_budgets_user_id on budgets(user_id);
create index if not exists idx_budgets_category_id on budgets(category_id);
create index if not exists idx_transactions_user_date on transactions(user_id, transaction_date desc);
create index if not exists idx_transactions_category_id on transactions(category_id);
create index if not exists idx_alerts_user_status on alerts(user_id, status);
create index if not exists idx_alerts_budget_id on alerts(budget_id);

drop trigger if exists set_users_updated_at on users;
create trigger set_users_updated_at
before update on users
for each row execute function set_updated_at();

drop trigger if exists set_categories_updated_at on categories;
create trigger set_categories_updated_at
before update on categories
for each row execute function set_updated_at();

drop trigger if exists set_budgets_updated_at on budgets;
create trigger set_budgets_updated_at
before update on budgets
for each row execute function set_updated_at();

drop trigger if exists set_transactions_updated_at on transactions;
create trigger set_transactions_updated_at
before update on transactions
for each row execute function set_updated_at();

drop trigger if exists set_alerts_updated_at on alerts;
create trigger set_alerts_updated_at
before update on alerts
for each row execute function set_updated_at();
