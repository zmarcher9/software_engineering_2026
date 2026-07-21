#!/usr/bin/env bash
# Point PR preview deployments of the client at the staging backend, and
# make sure the Vercel project only builds out of client/.
#
# One-time manual step (Vercel doesn't expose this via CLI/vercel.json for
# already-created projects): in the Vercel dashboard →
# Project Settings → General → Root Directory → set to "client".
# That's what makes GitHub PRs into this monorepo produce a preview
# deployment at all; without it Vercel tries to build from the repo root.
#
# Prereqs: Vercel CLI installed and logged in, run once from client/:
#   npm i -g vercel
#   vercel login
#   cd client && vercel link
#
# Usage:
#   ./scripts/setup-vercel-preview-env.sh https://flowfunds-staging.up.railway.app
set -euo pipefail

STAGING_API_URL="${1:?Usage: $0 <staging-railway-url>}"

if ! command -v vercel >/dev/null 2>&1; then
  echo "Vercel CLI not found. Install it with: npm i -g vercel" >&2
  exit 1
fi

cd "$(dirname "$0")/../client"

echo "==> Setting VITE_API_URL for Preview deployments (used by every PR)"
printf '%s' "$STAGING_API_URL" | vercel env add VITE_API_URL preview --force

echo "==> Done. Every PR preview build will now call $STAGING_API_URL"
echo "Also add the deployed preview URL(s) to the backend's CORS_ORIGINS /"
echo "CORS_ORIGIN_REGEX in the staging Railway environment — see"
echo "server/.env.staging.example."
