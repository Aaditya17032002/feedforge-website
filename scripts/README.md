# Scripts

## Server

| Script | Purpose |
|--------|---------|
| [`server/deploy-from-hub.sh`](server/deploy-from-hub.sh) | Pull the Docker Hub website image and recreate the portal container |

```bash
export DOCKERHUB_NAMESPACE=…   # company Hub org
export IMAGE_TAG=dev           # or prod
bash scripts/server/deploy-from-hub.sh
```

See [docs/cicd/CI_CD_SETUP.md](../docs/cicd/CI_CD_SETUP.md).
