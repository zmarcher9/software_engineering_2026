#!/usr/bin/env bash
# Create a Railway "staging" environment for the FlowFunds backend, separate
# from production, and push staging env vars into it.
#
# Prereqs:
#   - Railway CLI installed and logged in: `npm i -g @railway/cli && railway login`
#   - Run from the `server/` directory, already linked to the FlowFunds
#     Railway project: `railway link`
#   - A filled-in server/.env.staging (copy from .env.staging.example — do
#     NOT commit the filled-in file)
#
# Usage:
#   cd server
#   cp .env.staging.example .env.staging   # then fill in real values
#   ../scripts/setup-railway-staging.sh
set -euo pipefail

ENV_FILE="${1:-.env.staging}"
ENVIRONMENT_NAME="staging"

if ! command -v railway >/dev/null 2>&1; then
  echo "Railway CLI not found. Install it with: npm i -g @railway/cli" >&2
  exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing $ENV_FILE. Copy .env.staging.example to $ENV_FILE and fill in real values first." >&2
  exit 1
fi

echo "==> Checking Railway login/link status"
railway whoami
railway status

echo "==> Creating '$ENVIRONMENT_NAME' environment (safe to re-run if it already exists)"
railway environment new "$ENVIRONMENT_NAME" || echo "    (environment may already exist, continuing)"

echo "==> Switching to '$ENVIRONMENT_NAME'"
railway environment "$ENVIRONMENT_NAME"

echo "==> Pushing variables from $ENV_FILE into the '$ENVIRONMENT_NAME' environment"
set_args=()
while IFS='=' read -r key value; do
  # skip blanks and comments
  [ -z "$key" ] && continue
  case "$key" in \#*) continue ;; esac
  [ -z "$value" ] && continue
  set_args+=(--set "$key=$value")
done < <(grep -v '^\s*#' "$ENV_FILE" | grep '=')

if [ "${#set_args[@]}" -eq 0 ]; then
  echo "No variables found in $ENV_FILE." >&2
  exit 1
fi

railway variables "${set_args[@]}" --environment "$ENVIRONMENT_NAME"

echo "==> Done. Deploy staging with:"
echo "    railway up --environment $ENVIRONMENT_NAME"
echo "Verify with the returned staging URL + /health/db"
