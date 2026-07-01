# Database Migrations

Person 2 owns the database schema work in this folder.

## Apply the Initial Schema

Open the Supabase dashboard, go to SQL Editor, paste the contents of `001_initial_schema.sql`, and run it.

## Tables Created

- `users`
- `categories`
- `budgets`
- `transactions`
- `alerts`

The migration includes primary keys, foreign keys, uniqueness constraints, check constraints, useful indexes, and `updated_at` triggers. Authentication endpoints and API routes are intentionally left for the assigned teammates.
