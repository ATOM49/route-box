#!/usr/bin/env bash

set -euo pipefail

readonly SETUP_LIB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly REPO_ROOT="$(cd "${SETUP_LIB_DIR}/../.." && pwd)"
readonly REQUIRED_NODE_VERSION=22
readonly REQUIRED_NODE_MAJOR=22
readonly REQUIRED_PNPM_VERSION=10.11.0
readonly REQUIRED_PNPM_MAJOR=10
declare -a PNPM_COMMAND=()

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

load_nvm() {
  local nvm_dir="${NVM_DIR:-${HOME}/.nvm}"
  local nvm_script="${nvm_dir}/nvm.sh"

  if [[ ! -s "${nvm_script}" ]]; then
    return 1
  fi

  export NVM_DIR="${nvm_dir}"
  # shellcheck disable=SC1090
  source "${nvm_script}"
}

ensure_node_command() {
  if command -v node >/dev/null 2>&1; then
    local current_major
    current_major="$(version_major "$(node -v)")"

    if (( current_major >= REQUIRED_NODE_MAJOR )); then
      return
    fi
  fi

  if ! load_nvm; then
    if command -v node >/dev/null 2>&1; then
      fail "Node.js ${REQUIRED_NODE_MAJOR}+ is required (found $(node -v)). Install Node ${REQUIRED_NODE_VERSION} or configure nvm for this shell."
    fi

    fail "Missing required command 'node'. Install Node ${REQUIRED_NODE_VERSION} or configure nvm for this shell."
  fi

  if ! nvm use "${REQUIRED_NODE_VERSION}" >/dev/null; then
    fail "Unable to activate Node ${REQUIRED_NODE_VERSION} with nvm. Install it with 'nvm install ${REQUIRED_NODE_VERSION}'."
  fi
}

pnpm_cmd() {
  if (( ${#PNPM_COMMAND[@]} == 0 )); then
    fail "pnpm is not configured. Call require_tooling before running pnpm commands."
  fi

  "${PNPM_COMMAND[@]}" "$@"
}

assert_node_version() {
  local current_major
  current_major="$(version_major "$(node -v)")"

  if (( current_major < REQUIRED_NODE_MAJOR )); then
    fail "Node.js ${REQUIRED_NODE_MAJOR}+ is required (found $(node -v))."
  fi
}

ensure_pnpm_command() {
  if command -v pnpm >/dev/null 2>&1; then
    local installed_version
    local installed_major

    installed_version="$(pnpm -v)"
    installed_major="$(version_major "${installed_version}")"

    if (( installed_major >= REQUIRED_PNPM_MAJOR )); then
      PNPM_COMMAND=(pnpm)
      return
    fi

    log_info "Ignoring global pnpm ${installed_version}; using corepack-managed pnpm ${REQUIRED_PNPM_VERSION}"
  fi

  if ! command -v corepack >/dev/null 2>&1; then
    fail "pnpm ${REQUIRED_PNPM_MAJOR}+ is required. Install pnpm ${REQUIRED_PNPM_VERSION} or enable corepack."
  fi

  PNPM_COMMAND=(corepack pnpm)

  local current_major
  current_major="$(version_major "$(pnpm_cmd -v)")"

  if (( current_major < REQUIRED_PNPM_MAJOR )); then
    fail "pnpm ${REQUIRED_PNPM_MAJOR}+ is required (found $(pnpm_cmd -v))."
  fi
}

require_tooling() {
  log_step "Checking local tooling"
  ensure_node_command
  require_command docker
  assert_node_version
  ensure_pnpm_command

  if ! docker compose version >/dev/null 2>&1; then
    fail "Docker Compose is required."
  fi

  if ! docker info >/dev/null 2>&1; then
    fail "Docker is installed, but the Docker daemon is not running."
  fi

  log_info "Node $(node -v)"
  log_info "pnpm $(pnpm_cmd -v)"
}

ensure_env_file_from_example() {
  local target_file="$1"
  local example_file="$2"

  if [[ -f "${REPO_ROOT}/${target_file}" ]]; then
    log_info "Using existing ${target_file}"
    return
  fi

  if [[ ! -f "${REPO_ROOT}/${example_file}" ]]; then
    if [[ "${target_file}" == ".env" ]]; then
      fail "Missing ${example_file}; cannot create ${target_file}."
    fi

    return
  fi

  cp "${REPO_ROOT}/${example_file}" "${REPO_ROOT}/${target_file}"
  log_info "Created ${target_file} from ${example_file}"
}

ensure_env_file() {
  ensure_env_file_from_example ".env" ".env.example"
  ensure_env_file_from_example ".env.local" ".env.local.example"
}

load_env_file() {
  local env_file="$1"

  if [[ ! -f "${REPO_ROOT}/${env_file}" ]]; then
    return
  fi

  set -a
  # shellcheck disable=SC1091
  source "${REPO_ROOT}/${env_file}"
  set +a
}

load_env() {
  if [[ ! -f "${REPO_ROOT}/.env" ]]; then
    fail "Missing .env. Run the bootstrap script first."
  fi

  load_env_file ".env"
  load_env_file ".env.local"
}

assert_required_env() {
  local missing=()
  local required_keys=(
    DATABASE_URL
    REDIS_URL
    STORAGE_DRIVER
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

  case "${STORAGE_DRIVER}" in
    fs)
      if [[ -z "${FS_STORAGE_ROOT:-}" ]]; then
        fail "Missing required environment variable: FS_STORAGE_ROOT"
      fi
      ;;
    s3 | gcs)
      ;;
    *)
      fail "Unsupported STORAGE_DRIVER '${STORAGE_DRIVER}'."
      ;;
  esac

  case "${TILE_PROVIDER:-mock}" in
    mock)
      ;;
    google)
      if [[ -z "${GOOGLE_MAPS_API_KEY:-}" ]]; then
        fail "Missing required environment variable: GOOGLE_MAPS_API_KEY"
      fi
      ;;
    mapbox)
      if [[ -z "${MAPBOX_ACCESS_TOKEN:-}" ]]; then
        fail "Missing required environment variable: MAPBOX_ACCESS_TOKEN"
      fi
      ;;
    *)
      fail "Unsupported TILE_PROVIDER '${TILE_PROVIDER}'."
      ;;
  esac
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
  if [[ "${STORAGE_DRIVER}" != "fs" ]]; then
    log_info "Skipping local storage directory setup for STORAGE_DRIVER=${STORAGE_DRIVER}"
    return
  fi

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
