# Database Migrations

Person 2 owns the database schema work in this folder.

## Apply the Schema

Run the migrations in numeric order. `001_initial_schema.sql` creates the
application tables. `002_supabase_auth_and_rls.sql` connects Supabase Auth
users to application profiles, creates default categories, and enables RLS.

## Tables Created

- `users`
- `categories`
- `budgets`
- `transactions`
- `alerts`

The migrations include primary keys, foreign keys, uniqueness constraints,
check constraints, useful indexes, `updated_at` triggers, Auth profile
synchronization, and user-ownership policies.
