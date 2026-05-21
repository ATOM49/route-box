#!/usr/bin/env bash

set -euo pipefail

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "${SCRIPT_DIR}/lib/setup.sh"

cd "${REPO_ROOT}"

require_tooling

log_step "Preparing environment"
ensure_env_file
load_env
assert_required_env
ensure_storage_root

log_step "Installing workspace dependencies"
pnpm_cmd install --frozen-lockfile

start_local_services
wait_for_postgres
wait_for_redis

log_step "Preparing database client and schema"
pnpm_cmd db:generate
pnpm_cmd db:push

log_step "Bootstrap complete"
log_info "Run 'pnpm validate:setup' to verify the workspace."
