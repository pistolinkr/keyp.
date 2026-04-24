#!/usr/bin/env bash
# AI API + Ollama without docker-compose (plain docker only).
# Usage: ./scripts/docker-ai-stack.sh up | down | pull-model | logs
#
# Env for the API container (pick one or combine):
#   1) File: .env.docker or docker.env in repo root (first match wins), or KEYP_DOCKER_ENV_FILE=...
#   2) Shell: export AI_CORS_ORIGIN=... OLLAMA_MODEL=... before running.
# Do not put VITE_* in that file — those are for Vite/Vercel only; the API container ignores them.
#
# Vercel does not push env into Docker — you set values on the machine that runs `docker`.
# Later -e lines override duplicate keys from --env-file (OLLAMA_BASE_URL is always the in-stack Ollama).

set -euo pipefail

NETWORK="${KEYP_DOCKER_NETWORK:-keyp_ai}"
OLLAMA_NAME="${KEYP_OLLAMA_NAME:-keyp-ollama}"
API_NAME="${KEYP_API_NAME:-keyp-api}"
VOLUME="${KEYP_OLLAMA_VOLUME:-keyp_ollama_data}"
HOST_PORT="${HOST_PORT:-3000}"
API_IMAGE="${KEYP_API_IMAGE:-keyp-api:local}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

cd "$ROOT"

resolve_docker_env_file() {
  if [[ -n "${KEYP_DOCKER_ENV_FILE:-}" && -f "${KEYP_DOCKER_ENV_FILE}" ]]; then
    echo "${KEYP_DOCKER_ENV_FILE}"
    return 0
  fi
  if [[ -f "${ROOT}/.env.docker" ]]; then
    echo "${ROOT}/.env.docker"
    return 0
  fi
  if [[ -f "${ROOT}/docker.env" ]]; then
    echo "${ROOT}/docker.env"
    return 0
  fi
  return 1
}

load_env_docker() {
  local f=""
  f="$(resolve_docker_env_file)" || return 0
  set -a
  # shellcheck disable=SC1090
  source "$f"
  set +a
}

load_env_docker
MODEL="${OLLAMA_MODEL:-llama3.1:8b}"

ensure_network() {
  if ! docker network inspect "$NETWORK" >/dev/null 2>&1; then
    docker network create "$NETWORK"
  fi
}

ensure_volume() {
  if ! docker volume inspect "$VOLUME" >/dev/null 2>&1; then
    docker volume create "$VOLUME"
  fi
}

ollama_up() {
  ensure_network
  ensure_volume
  if docker ps --format '{{.Names}}' | grep -qx "$OLLAMA_NAME"; then
    return 0
  fi
  if docker ps -a --format '{{.Names}}' | grep -qx "$OLLAMA_NAME"; then
    docker start "$OLLAMA_NAME"
    return 0
  fi
  docker run -d \
    --name "$OLLAMA_NAME" \
    --network "$NETWORK" \
    -v "${VOLUME}:/root/.ollama" \
    ollama/ollama:latest
}

api_up() {
  ollama_up
  docker build -t "$API_IMAGE" "$ROOT"
  docker rm -f "$API_NAME" 2>/dev/null || true

  local envf=()
  local f=""
  if f="$(resolve_docker_env_file)"; then
    envf=(--env-file "$f")
  fi

  local cors=()
  if [[ -n "${AI_CORS_ORIGIN:-}" ]]; then
    cors=(-e "AI_CORS_ORIGIN=${AI_CORS_ORIGIN}")
  fi

  docker run -d \
    --name "$API_NAME" \
    --network "$NETWORK" \
    -p "${HOST_PORT}:3000" \
    "${envf[@]}" \
    -e NODE_ENV=production \
    -e PORT=3000 \
    -e "OLLAMA_BASE_URL=http://${OLLAMA_NAME}:11434" \
    -e "OLLAMA_MODEL=${MODEL}" \
    "${cors[@]}" \
    "$API_IMAGE"
}

cmd_up() {
  api_up
  echo "API: http://127.0.0.1:${HOST_PORT}/"
  echo "Pull a model once: ./scripts/docker-ai-stack.sh pull-model"
}

cmd_down() {
  docker rm -f "$API_NAME" 2>/dev/null || true
  docker rm -f "$OLLAMA_NAME" 2>/dev/null || true
  echo "Stopped and removed ${API_NAME} and ${OLLAMA_NAME} (volume ${VOLUME} kept)."
}

cmd_pull_model() {
  ollama_up
  echo "Waiting for Ollama inside ${OLLAMA_NAME}..."
  local i
  for i in {1..30}; do
    if docker exec "$OLLAMA_NAME" ollama list >/dev/null 2>&1; then
      break
    fi
    sleep 1
  done
  docker exec "$OLLAMA_NAME" ollama pull "$MODEL"
}

cmd_logs() {
  docker logs -f "$API_NAME"
}

case "${1:-up}" in
up) cmd_up ;;
down) cmd_down ;;
pull-model) cmd_pull_model ;;
logs) cmd_logs ;;
*)
  echo "Usage: $0 up | down | pull-model | logs" >&2
  exit 1
  ;;
esac
