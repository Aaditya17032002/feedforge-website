#!/usr/bin/env bash
# Server-side deploy: pull Hub image and restart portal — never builds on the VPS.
# Expects the server to already be logged into Docker Hub with a READ-ONLY token.
# Do NOT pass the CI write token here (avoids leaving push credentials on the VPS).
set -euo pipefail

cd /opt/feedforge/website

# Hub org namespace (override when Miguel's Docker Hub org is ready).
export DOCKERHUB_NAMESPACE="${DOCKERHUB_NAMESPACE:-sonishivam1402}"
# Branch channel: `dev` or `prod` (same image name, different tags).
export IMAGE_TAG="${IMAGE_TAG:-dev}"
# Must match the live VPS project so the existing feedforge_portal container is reused.
PROJECT="${COMPOSE_PROJECT_NAME:-feedforge-portal}"
COMPOSE=(docker compose -p "$PROJECT" --env-file .env.prod -f docker-compose.cicd.yml)

# Optional: refresh pull-only login if DOCKERHUB_PULL_TOKEN is provided (never use write PAT).
if [[ -n "${DOCKERHUB_USERNAME:-}" && -n "${DOCKERHUB_PULL_TOKEN:-}" ]]; then
  echo "$DOCKERHUB_PULL_TOKEN" | docker login -u "$DOCKERHUB_USERNAME" --password-stdin
fi

echo "Deploying ${DOCKERHUB_NAMESPACE}/feedforge-website:${IMAGE_TAG} (project=${PROJECT})"

"${COMPOSE[@]}" pull portal
"${COMPOSE[@]}" up -d --no-build --no-deps portal

# Ensure edge proxy can reach the portal container
docker network connect edge_net feedforge_portal 2>/dev/null || true

docker image prune -f >/dev/null || true

sleep 3
curl -fsS -o /dev/null -w "web:%{http_code}\n" --max-time 20 https://devwebsite.feedforge.ai/ || true

echo "Deploy done."
