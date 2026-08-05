/**
 * Server-side client for Platform email enqueue API.
 * Never expose LANDING_PORTAL_API_KEY to the browser.
 */

import { resolveBackendBaseUrl } from '@/lib/server/backend-url'

export type EnqueueEmailInput = {
  template: string
  to?: string[]
  cc?: string[]
  replyTo?: string
  variables?: Record<string, unknown>
  subject?: string
  idempotencyKey?: string
}

export type EnqueueEmailResult =
  | { ok: true; outboxId: string; status: string }
  | { ok: false; error: string }

const EMAIL_REQUEST_TIMEOUT_MS = 15_000

export async function enqueueEmail(
  input: EnqueueEmailInput
): Promise<EnqueueEmailResult> {
  const apiKey = process.env.LANDING_PORTAL_API_KEY?.trim()
  if (!apiKey) {
    console.error('LANDING_PORTAL_API_KEY is not configured')
    return { ok: false, error: 'Email enqueue is not configured' }
  }

  const url = `${resolveBackendBaseUrl()}/api/v1/email/enqueue`
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), EMAIL_REQUEST_TIMEOUT_MS)

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Landing-Api-Key': apiKey,
      },
      body: JSON.stringify({
        template: input.template,
        to: input.to ?? null,
        cc: input.cc ?? null,
        reply_to: input.replyTo ?? null,
        variables: input.variables ?? {},
        subject: input.subject ?? null,
        idempotency_key: input.idempotencyKey ?? null,
      }),
      cache: 'no-store',
      signal: controller.signal,
    })

    if (!res.ok) {
      let detail = ''
      try {
        const errBody = (await res.json()) as { detail?: string | unknown }
        if (typeof errBody.detail === 'string') detail = errBody.detail
      } catch {
        detail = await res.text().catch(() => '')
      }
      console.error('Email enqueue API error', res.status, detail)
      return { ok: false, error: detail || 'Could not queue email' }
    }

    const body = (await res.json()) as {
      outbox_id?: string
      status?: string
    }
    if (!body.outbox_id) {
      return { ok: false, error: 'Invalid enqueue response' }
    }
    return {
      ok: true,
      outboxId: body.outbox_id,
      status: body.status ?? 'pending',
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('Email enqueue timed out')
      return { ok: false, error: 'Email enqueue timed out' }
    }
    console.error('Email enqueue failed', error)
    return { ok: false, error: 'Could not queue email' }
  } finally {
    clearTimeout(timeout)
  }
}
