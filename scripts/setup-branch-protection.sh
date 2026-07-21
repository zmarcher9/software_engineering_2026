#!/usr/bin/env bash
# Require the CI checks to pass before merging into main.
#
# A green/red workflow run alone does NOT block a merge — GitHub only
# enforces that via a branch protection rule with required status checks.
# This script wires that up for main using the job names from
# .github/workflows/ci.yml ("Backend (FastAPI)", "Frontend (React + Vite)").
#
# Prereqs: GitHub CLI installed and authenticated with admin rights on the
# repo: `gh auth login`
#
# Usage:
#   ./scripts/setup-branch-protection.sh [owner/repo]
# Defaults to the current repo if run inside a checkout with `gh` configured.
set -euo pipefail

if ! command -v gh >/dev/null 2>&1; then
  echo "GitHub CLI not found. Install it: https://cli.github.com" >&2
  exit 1
fi

REPO="${1:-$(gh repo view --json nameWithOwner -q .nameWithOwner)}"
BRANCH="main"

echo "==> Requiring CI checks to pass before merging to $BRANCH on $REPO"

gh api -X PUT "repos/${REPO}/branches/${BRANCH}/protection" \
  -H "Accept: application/vnd.github+json" \
  -f "required_status_checks[strict]=true" \
  -f "required_status_checks[contexts][]=Backend (FastAPI)" \
  -f "required_status_checks[contexts][]=Frontend (React + Vite)" \
  -F "enforce_admins=false" \
  -F "required_pull_request_reviews=null" \
  -F "restrictions=null" \
  -F "allow_force_pushes=false" \
  -F "allow_deletions=false"

echo "==> Done. Verify at: https://github.com/${REPO}/settings/branches"
echo "    (PRs into $BRANCH now require both CI jobs — including the Pytest"
echo "    step in 'Backend (FastAPI)' — to pass before the merge button unlocks.)"
