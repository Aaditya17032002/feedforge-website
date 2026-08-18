#!/usr/bin/env bash
# FeedForge PROD website server-side deploy.
set -euo pipefail

cd /opt/feedforge/website

: "${DOCKERHUB_NAMESPACE:?DOCKERHUB_NAMESPACE is required}"
if [[ "$DOCKERHUB_NAMESPACE" != "feedforgellc" ]]; then
  echo "DOCKERHUB_NAMESPACE must be 'feedforgellc'; got '$DOCKERHUB_NAMESPACE'." >&2
  exit 1
fi

: "${IMAGE_TAG:?IMAGE_TAG is required}"
case "$IMAGE_TAG" in
  prod|prod-*) ;;
  *)
    echo "PROD deploy requires IMAGE_TAG=prod or prod-<sha>; got '$IMAGE_TAG'." >&2
    exit 1
    ;;
esac

PROJECT="${COMPOSE_PROJECT_NAME:-feedforge-portal-prod}"
COMPOSE=(docker compose -p "$PROJECT" --env-file .env.prod -f docker-compose.prod.cicd.yml)

if [[ -n "${DOCKERHUB_USERNAME:-}" && -n "${DOCKERHUB_PULL_TOKEN:-}" ]]; then
  echo "$DOCKERHUB_PULL_TOKEN" | docker login -u "$DOCKERHUB_USERNAME" --password-stdin
fi

echo "Deploying ${DOCKERHUB_NAMESPACE}/feedforge-website:${IMAGE_TAG} (project=${PROJECT})"
"${COMPOSE[@]}" pull portal
"${COMPOSE[@]}" up -d --no-build --no-deps portal

docker compose -p "$PROJECT" --env-file .env.prod -f docker-compose.prod.cicd.yml ps
echo "PROD website deploy done."
