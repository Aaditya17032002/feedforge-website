# FeedForge Website CI/CD setup

Same deploy contract as the application repo. Secret **names** are identical so org-level credentials can be pasted once into each repository.

**Do not build the website image on the VPS.** GitHub Actions builds and pushes to Docker Hub. The server only `docker compose pull` + `up -d --no-build`.

This file is the playbook. Website-specific GitHub Actions notes live in [GITHUB_CICD.md](./GITHUB_CICD.md).

## Architecture

```
Developer push to `dev` or `prod`
  → GitHub org repo (GitHub Actions)
  → Docker Hub (company namespace)
  → SSH to DEV or PROD server
  → pull image + restart container
```

| Git branch | Hub tags (same image repo) | GitHub SSH secrets | Server |
|------------|----------------------------|--------------------|--------|
| `dev` | `:dev` and `:dev-<7-char-sha>` | `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY` | DEV |
| `prod` | `:prod` and `:prod-<7-char-sha>` | `DEPLOY_HOST_PROD`, `DEPLOY_USER_PROD`, `DEPLOY_SSH_KEY_PROD` | PROD |
| Feature branches | no push, no deploy | — | — |

Dev vs prod is a **tag**, not a second Docker Hub repository.

## Docker Hub repositories

One Hub repo under the company namespace (`DOCKERHUB_NAMESPACE`):

| Hub repository | Used by |
|----------------|---------|
| `{namespace}/feedforge-website` | Marketing / landing site (this repo) |

The image also uses a `buildcache` tag for BuildKit registry cache.

`DOCKERHUB_NAMESPACE` is required (GitHub Actions variable, and exported on the VPS). CI fails if it is unset. Do not rename the website image away from `feedforge-website`.

## GitHub variable and secrets (same names on every repo)

Repo → **Settings → Secrets and variables → Actions**.

Use **exactly these names** so credentials can be copied from application without renaming.

### Variable

| Name | Purpose |
|------|---------|
| `DOCKERHUB_NAMESPACE` | Docker Hub org/user, e.g. `feedforge-llc` |

### Variables — Next.js public build args (website only)

`NEXT_PUBLIC_*` is baked into the client bundle at **image build** time. Set these as GitHub Actions **variables** (not secrets) so CI can pass them as Docker `build-args`.

| Name | Purpose |
|------|---------|
| `NEXT_PUBLIC_CHATBOT_ENABLED` | Show chatbot widget (`true` / `false`) |
| `NEXT_PUBLIC_APP_URL` | Header Log in / Sign up, e.g. `https://app.feedforge.ai` |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | GA4 measurement id (omit to disable) |

Runtime secrets (OpenRouter, Cal.com, `LANDING_PORTAL_API_KEY`) stay on the VPS in `.env.prod` — never in GitHub Actions.

### Secrets — Hub write (Actions only, never on the VPS)

| Name | Purpose |
|------|---------|
| `DOCKERHUB_USERNAME` | Hub user |
| `DOCKERHUB_TOKEN` | Hub **write** token |

### Secrets — DEV deploy

| Name | Current DEV value |
|------|-------------------|
| `DEPLOY_HOST` | `178.156.224.155` |
| `DEPLOY_USER` | `aadi` |
| `DEPLOY_SSH_KEY` | Private key whose public half is in that user’s `authorized_keys` on the DEV VPS |

### Secrets — PROD deploy (optional until prod server exists)

| Name | Purpose |
|------|---------|
| `DEPLOY_HOST_PROD` | PROD VPS hostname/IP |
| `DEPLOY_USER_PROD` | SSH user |
| `DEPLOY_SSH_KEY_PROD` | Private key for the PROD host |

If `DEPLOY_HOST_PROD` is empty, a push to `prod` still **builds and tags** `:prod` images, then **skips SSH**.

### Server (each VPS)

- `docker login` with a **read-only** Hub token for the same namespace.
- Never put `DOCKERHUB_TOKEN` (write) on the server.

## Git branches

Every deployable FeedForge repo should have:

- `dev` — default working branch; auto-deploys to DEV
- `prod` — production; auto-deploys to PROD when prod SSH secrets exist
- `main` — default GitHub branch; keep it in sync with current code (does **not** deploy)

Create `dev` and `prod` from the same commit if they do not exist yet:

```bash
git checkout -B dev
git checkout -B prod
git push -u origin dev prod
```

## Website repo

GitHub: `feedforge-llc/FeedForge-Website`

| File | Role |
|------|------|
| `.github/workflows/dev-deploy.yml` | Build, push, SSH deploy |
| `docker-compose.cicd.yml` | Pull-only stack; `image: ${DOCKERHUB_NAMESPACE}/feedforge-website:${IMAGE_TAG}` |
| `scripts/server/deploy-from-hub.sh` | On-server: pull + `up -d --no-build --no-deps` |

Workflow behaviour:

1. Resolve channel: branch `prod` → tag `prod`, else `dev`. Namespace from `vars.DOCKERHUB_NAMESPACE`.
2. Path filters: skip image build if the website tree did not change (one app tree, not Backend + Frontend).
3. Buildx push with tags `{namespace}/feedforge-website:{tag}` and `{namespace}/feedforge-website:{tag}-{sha}` plus `buildcache`. Pass `NEXT_PUBLIC_*` as Docker build-args.
4. SSH to the matching host, `cd /opt/feedforge/website`, export `DOCKERHUB_NAMESPACE` and `IMAGE_TAG`, run `deploy-from-hub.sh`.
5. Do **not** use bare `inputs.*` in job `if:` on `push` (GitHub fails with `Unrecognized named-value: 'inputs'`). Use `github.event.inputs.*` gated by `github.event_name == 'workflow_dispatch'`.

### 1. Workflow

`.github/workflows/dev-deploy.yml`:

- `on.push.branches: [dev, prod]` plus `workflow_dispatch` with optional `image_tag` (`dev` or `prod`) and `force_all`.
- Job **channel**: copy the application resolver (namespace + tag + `is_prod`).
- Job **build**: Buildx + `docker/login-action` with `secrets.DOCKERHUB_USERNAME` / `secrets.DOCKERHUB_TOKEN`. Dockerfile `target: production`. Tags:

  ```text
  ${{ needs.channel.outputs.namespace }}/feedforge-website:${{ needs.channel.outputs.image_tag }}
  ${{ needs.channel.outputs.namespace }}/feedforge-website:${{ needs.channel.outputs.image_tag }}-${{ steps.meta.outputs.short }}
  ```

  Cache: `{namespace}/feedforge-website:buildcache`.

- Job **deploy**: same SSH secret mapping as application. Skip SSH when `is_prod` and `DEPLOY_HOST_PROD` is empty. On the server:

  ```bash
  set -euo pipefail
  cd /opt/feedforge/website
  export DOCKERHUB_NAMESPACE=...
  export IMAGE_TAG=...
  # pull-only compose; never docker compose --build
  ```

- Strip Windows CRLF on deploy scripts (`sed -i 's/\r$//'`) before `bash`.

`docker-publish.yml` (push `main` → `sonishivam1402/feedforge-website:latest`) is removed. Do not add a second publish workflow.

### 2. Server compose

Images must be:

```yaml
image: ${DOCKERHUB_NAMESPACE}/feedforge-website:${IMAGE_TAG:-dev}
```

Never `build:` for the app image on the VPS. Attach the portal service to external network `edge_net`. Runtime env stays in `.env.prod` on the server.

### 3. Deploy script

Mirror application `scripts/server/deploy-from-hub.sh`:

- `docker compose pull` the website service
- `up -d --no-build --no-deps`
- attach to `edge_net` if the edge proxy must reach the container
- do not export the Hub **write** token onto the host

### 4. What must stay identical (with application)

- Branch names: `dev`, `prod`
- Tags: `dev`, `prod`, `dev-<sha>`, `prod-<sha>`, `buildcache`
- GitHub variable: `DOCKERHUB_NAMESPACE`
- GitHub secrets: `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`, `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`, `DEPLOY_HOST_PROD`, `DEPLOY_USER_PROD`, `DEPLOY_SSH_KEY_PROD`

### 5. What is allowed to differ

- Dockerfile / build context (repo root, `target: production`)
- Hub **image** name (`feedforge-website` vs `feedforge-backend`)
- Server directory (`/opt/feedforge/website` vs `/opt/feedforge/application`)
- Compose service names (`portal`)
- Path filters (website has one app tree)
- Extra GitHub **variables** for `NEXT_PUBLIC_*` build-args

The three files above are in this repo. `main` does not deploy — create and push `dev` / `prod` if they do not exist yet (see Git branches).

## Manual test after credentials are set

1. Confirm Hub repo `{namespace}/feedforge-website` exists and GitHub variable/secrets are pasted on this repo (same names as application).
2. Confirm the VPS `docker login` can pull `{namespace}/feedforge-website:dev`.
3. Confirm `/opt/feedforge/website` has compose + deploy script + `.env.prod`.
4. Push a tiny commit to `dev`.
5. Actions should: build → push `:dev` and `:dev-<sha>` → SSH → pull → container restart.
6. Do not push `prod` to a live prod host until `DEPLOY_*_PROD` and the prod server are ready.

## Rules

```bash
# good (on the VPS)
export DOCKERHUB_NAMESPACE=…   # company Hub org
export IMAGE_TAG=dev           # or prod
bash scripts/server/deploy-from-hub.sh

# bad — OOMs the 4GB VPS
docker compose up -d --build
```

- Edge proxy (`/opt/feedforge/proxy`) is separate. CI does not rebuild Caddy.
- Contact/demo forms need Application on `edge_net` (`BACKEND_INTERNAL_URL=http://feedforge_backend:8000`). Website CI does not deploy Application.
