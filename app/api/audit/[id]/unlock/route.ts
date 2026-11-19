import { jsonError, jsonOk, readJsonBody } from '@/lib/server/api'
import { clientIpFrom, isAuditId, unlockAudit } from '@/lib/server/audit-api'
import { sanitizeText } from '@/lib/shared/strings'
import { isValidEmail } from '@/lib/shared/validation'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Save the lead, run the live store check, and return the full report with an access token. */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  if (!isAuditId(params.id)) {
    return jsonError('This audit wasn’t found. Run a new one.', 404)
  }
  const body = await readJsonBody(request)
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return jsonError('Invalid request.', 400)
  }
  const data = body as Record<string, unknown>
  const email = sanitizeText(data.email, { maxLen: 255 }).toLowerCase()
  const storeUrl = sanitizeText(data.storeUrl, { maxLen: 500 })
  const fullName = sanitizeText(data.fullName, { maxLen: 150 })
  const companyName = sanitizeText(data.companyName, { maxLen: 200 })

  if (!email || !isValidEmail(email)) {
    return jsonError('Enter a valid email address.', 400)
  }
  if (!storeUrl || !/^(https?:\/\/)?[a-z0-9.-]+\.[a-z]{2,}(\/.*)?$/i.test(storeUrl)) {
    return jsonError('Enter your store URL, for example yourstore.com.', 400)
  }

  const result = await unlockAudit(params.id, { email, storeUrl, fullName, companyName }, clientIpFrom(request))
  if (!result.ok) {
    return jsonError(result.message, result.status)
  }
  return jsonOk({ token: result.data.access_token, report: result.data.report, emailed: Boolean(result.data.emailed) })
}
