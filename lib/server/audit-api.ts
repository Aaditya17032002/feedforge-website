/**
 * Server-side client for the Application's public audit API.
 *
 * The backend only accepts these calls with LANDING_PORTAL_API_KEY, which never
 * reaches the browser. The analyze call returns the preview only; the full
 * report is returned by unlock (after the lead is saved) or by report with the
 * access token that unlock issued.
 */
import { resolveBackendBaseUrl } from '@/lib/server/backend-url'

type BackendResult<T> = { ok: true; data: T } | { ok: false; status: number; message: string }

const ANALYZE_TIMEOUT_MS = 60_000
const UNLOCK_TIMEOUT_MS = 50_000
const REPORT_TIMEOUT_MS = 15_000

function apiKey(): string | null {
  return process.env.LANDING_PORTAL_API_KEY?.trim() || null
}

async function call<T>(path: string, init: RequestInit, timeoutMs: number, clientIp?: string | null): Promise<BackendResult<T>> {
  const key = apiKey()
  if (!key) {
    console.error('LANDING_PORTAL_API_KEY is not configured')
    return { ok: false, status: 503, message: 'The audit is temporarily unavailable.' }
  }
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  const headers = new Headers(init.headers)
  headers.set('X-Landing-Api-Key', key)
  if (clientIp) headers.set('X-Audit-Client-Ip', clientIp)

  try {
    const res = await fetch(`${resolveBackendBaseUrl()}/api/v1/public-audit${path}`, {
      ...init,
      headers,
      cache: 'no-store',
      signal: controller.signal,
    })
    const text = await res.text()
    let body: unknown = null
    try {
      body = text ? JSON.parse(text) : null
    } catch {
      body = null
    }
    if (!res.ok) {
      const detail = body && typeof body === 'object' && 'detail' in body ? (body as { detail: unknown }).detail : null
      const message =
        typeof detail === 'string'
          ? detail
          : res.status === 422
            ? 'Please check the details and try again.'
            : 'Something went wrong. Please try again.'
      if (res.status >= 500) console.error('Audit API error', res.status, text.slice(0, 300))
      return { ok: false, status: res.status, message }
    }
    return { ok: true, data: body as T }
  } catch (err) {
    const aborted = err instanceof Error && err.name === 'AbortError'
    console.error(aborted ? 'Audit API request timed out' : 'Audit API request failed', path)
    return {
      ok: false,
      status: aborted ? 504 : 502,
      message: aborted ? 'The audit took too long. Try a smaller file.' : 'The audit service is unavailable. Please try again shortly.',
    }
  } finally {
    clearTimeout(timeout)
  }
}

export function analyzeFeed(file: Blob, filename: string, clientIp: string | null, originalSize: number | null) {
  const form = new FormData()
  form.append('file', file, filename)
  if (originalSize) form.append('original_size', String(originalSize))
  return call<unknown>('/analyze', { method: 'POST', body: form }, ANALYZE_TIMEOUT_MS, clientIp)
}

export function unlockAudit(
  auditId: string,
  input: { email: string; storeUrl: string; fullName?: string; companyName?: string },
  clientIp: string | null
) {
  return call<{ access_token: string; report: unknown; emailed?: boolean }>(
    `/${auditId}/unlock`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: input.email,
        store_url: input.storeUrl,
        full_name: input.fullName || null,
        company_name: input.companyName || null,
      }),
    },
    UNLOCK_TIMEOUT_MS,
    clientIp
  )
}

export function fetchAuditReport(auditId: string, token: string) {
  return call<{ report: unknown }>(
    `/${auditId}/report`,
    { method: 'GET', headers: { 'X-Audit-Access-Token': token } },
    REPORT_TIMEOUT_MS
  )
}

export function clientIpFrom(request: Request): string | null {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]?.trim() || null
  return request.headers.get('x-real-ip')?.trim() || null
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isAuditId(value: string | undefined | null): value is string {
  return Boolean(value && UUID_RE.test(value))
}
