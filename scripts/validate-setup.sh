#!/usr/bin/env bash

set -euo pipefail

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "${SCRIPT_DIR}/lib/setup.sh"

cd "${REPO_ROOT}"

require_tooling

log_step "Checking environment"
load_env
assert_required_env
assert_node_modules_present
ensure_storage_root

log_step "Checking local services"
wait_for_postgres
wait_for_redis

log_step "Validating database schema"
pnpm --filter @repo/db prisma validate
pnpm db:generate

log_step "Running workspace validation"
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build

log_step "Setup validation complete"
