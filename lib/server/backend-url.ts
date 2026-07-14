/**
 * Resolve Platform backend base URL for server-side Portal API calls.
 *
 * Portal runs independently of Platform's Docker network. When the backend is
 * down (maintenance), the site still serves — pricing/leads degrade gracefully.
 */
export function resolveBackendBaseUrl(): string {
  const internal = process.env.BACKEND_INTERNAL_URL?.trim();
  const api = process.env.BACKEND_API_URL?.trim();
  const inDocker = process.env.RUNNING_IN_DOCKER === 'true';

  if (internal) {
    return internal.replace(/\/+$/, '');
  }
  if (api) {
    return api.replace(/\/+$/, '');
  }
  if (inDocker) {
    return 'http://host.docker.internal:8000';
  }
  return 'http://localhost:8000';
}
