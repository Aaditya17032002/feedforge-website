# FeedForge Website — GitHub Actions CI/CD

**Audience:** Eng + Miguel  
**Status:** GitHub Actions on `feedforge-llc/FeedForge-Website` is the pipeline. Same flow as application; only image name, server path, and `NEXT_PUBLIC_*` build-args differ. Playbook: [CI_CD_SETUP.md](./CI_CD_SETUP.md).

## Flow

```
Developer push
  → GitHub org (feedforge-llc / FeedForge-Website)
  → GitHub Actions
       ├─ path filter (website tree)
       ├─ build + push Docker Hub (company namespace when set)
       └─ SSH → server: scripts/server/deploy-from-hub.sh  (pull only, never --build)
```

## Branches → Hub tags → server

| Git branch | Hub tags | Server |
|------------|----------|--------|
| `dev` | `feedforge-website:dev` + `dev-<sha>` | DEV (`DEPLOY_HOST`) |
| `prod` | `feedforge-website:prod` + `prod-<sha>` | PROD (`DEPLOY_HOST_PROD`) when secrets exist |
| Feature branches | no image push / no deploy | — |
| `main` | no deploy (keep in sync with current code) | — |

There are **not** separate Hub repos per environment. Dev vs prod is the tag.

## Images

| Hub repository | Tags |
|----------------|------|
| `{namespace}/feedforge-website` | `dev`, `dev-<sha>`, `prod`, `prod-<sha>`, `buildcache` |

`namespace` comes from the GitHub Actions **variable** `DOCKERHUB_NAMESPACE`. If unset, CI falls back to `sonishivam1402` (current Hub account for this image) until the company Hub org is wired.

Server compose: `docker-compose.cicd.yml` (`IMAGE_TAG=dev` or `prod`). Live path: `/opt/feedforge/website`.

Build-time args (from GitHub **variables**): `NEXT_PUBLIC_CHATBOT_ENABLED`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_GA_MEASUREMENT_ID`. Dockerfile `target: production`.

## GitHub configuration

Repo → **Settings → Secrets and variables → Actions**.

### Variable

| Variable | Purpose |
|----------|---------|
| `DOCKERHUB_NAMESPACE` | Hub org/user, e.g. `feedforge-llc`. Optional until org Hub exists. |
| `NEXT_PUBLIC_CHATBOT_ENABLED` | Client bundle |
| `NEXT_PUBLIC_APP_URL` | e.g. `https://app.feedforge.ai` |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | GA4 |

### Secrets (Hub write — Actions only, never on the VPS)

| Secret | Purpose |
|--------|---------|
| `DOCKERHUB_USERNAME` | Hub user in the company org |
| `DOCKERHUB_TOKEN` | Hub **write** token |

### Secrets (DEV deploy)

| Secret | Purpose |
|--------|---------|
| `DEPLOY_HOST` | DEV VPS |
| `DEPLOY_USER` | SSH user |
| `DEPLOY_SSH_KEY` | Private key whose public half is on the DEV host |

### Secrets (PROD deploy — add when the prod server is ready)

| Secret | Purpose |
|--------|---------|
| `DEPLOY_HOST_PROD` | PROD VPS |
| `DEPLOY_USER_PROD` | SSH user |
| `DEPLOY_SSH_KEY_PROD` | Private key for the PROD host |

If `DEPLOY_HOST_PROD` is empty, a `prod` push still **builds and tags** `:prod` images, then **skips SSH**.

**Server Docker login:** each VPS uses a **read-only** Hub token (`docker login`). CI must not copy the write token onto the server.

## Trigger

- Push `dev` or `prod`
- Manual: Actions → **Build, push, deploy** → Run workflow (optional `image_tag` = `dev` or `prod`)

### Workflow expression note

Job `if:` conditions must **not** use bare `inputs.*` on `push` runs. Use `github.event.inputs.*` and/or `github.event_name == 'workflow_dispatch'`.

## Server rules

```bash
export DOCKERHUB_NAMESPACE=…   # company Hub org
export IMAGE_TAG=dev           # or prod
bash /opt/feedforge/website/scripts/server/deploy-from-hub.sh

# never on the VPS
docker compose up -d --build
```

## Speed

Path filters, registry cache (`buildcache`), Next `production` target. One image (no backend/frontend split).
