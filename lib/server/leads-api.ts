/**
 * Server-side client for Application lead intake API.
 * Never expose LANDING_PORTAL_API_KEY to the browser.
 */

import { resolveBackendBaseUrl } from '@/lib/server/backend-url'

export type LeadType = 'CONTACT' | 'DEMO_REQUEST'

export type CreateLeadInput = {
  leadType: LeadType
  fullName: string
  workEmail: string
  companyName?: string
  message?: string
}

const LEAD_REQUEST_TIMEOUT_MS = 15_000

export async function createLead(
  input: CreateLeadInput
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const apiKey = process.env.LANDING_PORTAL_API_KEY?.trim()
  if (!apiKey) {
    console.error('LANDING_PORTAL_API_KEY is not configured')
    return { ok: false, error: 'Lead intake is not configured' }
  }

  const url = `${resolveBackendBaseUrl()}/api/v1/leads`
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), LEAD_REQUEST_TIMEOUT_MS)

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Landing-Api-Key': apiKey,
      },
      body: JSON.stringify({
        lead_type: input.leadType,
        full_name: input.fullName,
        work_email: input.workEmail,
        company_name: input.companyName ?? null,
        message: input.message ?? null,
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
      console.error('Lead API error', res.status, detail)
      return { ok: false, error: 'Could not save your submission' }
    }

    const data = (await res.json()) as { id?: string }
    return { ok: true, id: data.id ?? '' }
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      console.error('Lead API request timed out')
    } else {
      console.error('Lead API request failed', err)
    }
    return { ok: false, error: 'Could not save your submission' }
  } finally {
    clearTimeout(timeout)
  }
}
