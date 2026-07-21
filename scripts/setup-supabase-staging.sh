#!/usr/bin/env bash
# Create an isolated Supabase environment for FlowFunds staging, separate
# from the production project.
#
# Two supported paths — pick ONE:
#
#   A) Separate Supabase project (default, works on the free tier).
#      Simplest option for a course project; fully isolated database.
#
#   B) Persistent branch off the production project (requires Supabase Pro
#      plan + compute add-on, since branching bills per-branch compute).
#      Pass --branch to use this path instead.
#
# Prereqs: Supabase CLI installed and logged in.
#   npm i -g supabase
#   supabase login
#
# Usage:
#   ./scripts/setup-supabase-staging.sh            # Option A: new project
#   ./scripts/setup-supabase-staging.sh --branch    # Option B: persistent branch
set -euo pipefail

if ! command -v supabase >/dev/null 2>&1; then
  echo "Supabase CLI not found. Install it with: npm i -g supabase" >&2
  exit 1
fi

MODE="project"
if [ "${1:-}" = "--branch" ]; then
  MODE="branch"
fi

if [ "$MODE" = "branch" ]; then
  echo "==> Option B: creating a persistent 'staging' branch off the linked production project"
  echo "    (requires this repo to already be linked: supabase link --project-ref <prod-ref>)"
  echo "    (requires Supabase Pro plan with branching compute enabled)"
  supabase branches create staging --persistent
  echo "==> Branch created. Fetch its API URL/anon key with:"
  echo "    supabase branches get staging"
  echo "Copy those values into server/.env.staging (SUPABASE_URL / SUPABASE_ANON_KEY)."
  echo "Migrations under server/supabase/migrations are applied automatically to new branches"
  echo "by Supabase's GitHub integration; if you're not using it, push manually with:"
  echo "    supabase link --project-ref <staging-branch-ref> && supabase db push"
  exit 0
fi

echo "==> Option A: creating a standalone Supabase project for staging"
read -rp "Organization ID (supabase orgs list): " ORG_ID
read -rp "Region [us-east-1]: " REGION
REGION="${REGION:-us-east-1}"
read -rsp "New database password (won't echo): " DB_PASSWORD
echo

supabase projects create flowfunds-staging \
  --org-id "$ORG_ID" \
  --region "$REGION" \
  --db-password "$DB_PASSWORD"

echo "==> Project created. Link this repo to it in a separate step so your main"
echo "    'supabase link' for production isn't overwritten, e.g. from a scratch dir:"
echo "    supabase link --project-ref <new-staging-ref>"
echo "    supabase db push   # applies server/migrations + server/supabase/migrations"
echo "Then grab the URL/anon key from the dashboard (Project Settings → API) and"
echo "copy them into server/.env.staging (SUPABASE_URL / SUPABASE_ANON_KEY)."
