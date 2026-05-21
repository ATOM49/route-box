#!/usr/bin/env bash

set -euo pipefail

readonly SETUP_LIB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly REPO_ROOT="$(cd "${SETUP_LIB_DIR}/../.." && pwd)"
readonly REQUIRED_NODE_MAJOR=22
readonly REQUIRED_PNPM_MAJOR=10

log_step() {
  printf '\n==> %s\n' "$1"
}

log_info() {
  printf '  • %s\n' "$1"
}

fail() {
  printf 'ERROR: %s\n' "$1" >&2
  exit 1
}

require_command() {
  local command_name="$1"

  if ! command -v "${command_name}" >/dev/null 2>&1; then
    fail "Missing required command '${command_name}'."
  fi
}

version_major() {
  local raw_version="${1#v}"
  printf '%s' "${raw_version%%.*}"
}

assert_node_version() {
  local current_major
  current_major="$(version_major "$(node -v)")"

  if (( current_major < REQUIRED_NODE_MAJOR )); then
    fail "Node.js ${REQUIRED_NODE_MAJOR}+ is required (found $(node -v))."
  fi
}

assert_pnpm_version() {
  local current_major
  current_major="$(version_major "$(pnpm -v)")"

  if (( current_major < REQUIRED_PNPM_MAJOR )); then
    fail "pnpm ${REQUIRED_PNPM_MAJOR}+ is required (found $(pnpm -v)). Run 'corepack use pnpm@10.11.0'."
  fi
}

require_tooling() {
  log_step "Checking local tooling"
  require_command node
  require_command pnpm
  require_command docker
  assert_node_version
  assert_pnpm_version

  if ! docker compose version >/dev/null 2>&1; then
    fail "Docker Compose is required."
  fi

  log_info "Node $(node -v)"
  log_info "pnpm $(pnpm -v)"
}

ensure_env_file() {
  if [[ -f "${REPO_ROOT}/.env" ]]; then
    log_info "Using existing .env"
    return
  fi

  if [[ ! -f "${REPO_ROOT}/.env.example" ]]; then
    fail "Missing .env.example; cannot create .env."
  fi

  cp "${REPO_ROOT}/.env.example" "${REPO_ROOT}/.env"
  log_info "Created .env from .env.example"
}

load_env() {
  if [[ ! -f "${REPO_ROOT}/.env" ]]; then
    fail "Missing .env. Run the bootstrap script first."
  fi

  set -a
  # shellcheck disable=SC1091
  source "${REPO_ROOT}/.env"
  set +a
}

assert_required_env() {
  local missing=()
  local required_keys=(
    DATABASE_URL
    REDIS_URL
    STORAGE_DRIVER
    FS_STORAGE_ROOT
    PORT
    NEXT_PUBLIC_API_BASE_URL
  )

  local key
  for key in "${required_keys[@]}"; do
    if [[ -z "${!key:-}" ]]; then
      missing+=("${key}")
    fi
  done

  if (( ${#missing[@]} > 0 )); then
    fail "Missing required environment variables: ${missing[*]}"
  fi
}

resolve_repo_path() {
  local target_path="$1"

  if [[ "${target_path}" = /* ]]; then
    printf '%s\n' "${target_path}"
    return
  fi

  printf '%s/%s\n' "${REPO_ROOT}" "${target_path}"
}

ensure_storage_root() {
  local storage_root
  storage_root="$(resolve_repo_path "${FS_STORAGE_ROOT}")"
  mkdir -p "${storage_root}"
  log_info "Storage root ready at ${storage_root}"
}

start_local_services() {
  log_step "Starting local services"
  (
    cd "${REPO_ROOT}"
    docker compose up -d
  )
}

wait_for_postgres() {
  local attempt

  for attempt in {1..30}; do
    if (
      cd "${REPO_ROOT}" &&
      docker compose exec -T postgres pg_isready -U postgres -d path_pipeline >/dev/null 2>&1
    ); then
      log_info "Postgres is ready"
      return
    fi

    sleep 2
  done

  fail "Postgres did not become ready."
}

wait_for_redis() {
  local attempt

  for attempt in {1..30}; do
    if (
      cd "${REPO_ROOT}" &&
      docker compose exec -T redis redis-cli ping >/dev/null 2>&1
    ); then
      log_info "Redis is ready"
      return
    fi

    sleep 2
  done

  fail "Redis did not become ready."
}

assert_node_modules_present() {
  if [[ ! -d "${REPO_ROOT}/node_modules" ]]; then
    fail "Dependencies are not installed. Run 'pnpm bootstrap' first."
  fi
}
