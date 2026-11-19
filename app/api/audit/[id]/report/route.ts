import { jsonError, jsonOk } from '@/lib/server/api'
import { fetchAuditReport, isAuditId } from '@/lib/server/audit-api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Re-open an unlocked report (for example after a page refresh). Requires the token from unlock. */
export async function GET(request: Request, { params }: { params: { id: string } }) {
  if (!isAuditId(params.id)) {
    return jsonError('This audit wasn’t found.', 404)
  }
  const token = request.headers.get('x-audit-token')?.trim()
  if (!token || token.length > 200) {
    return jsonError('Unlock the report with your email first.', 403)
  }
  const result = await fetchAuditReport(params.id, token)
  if (!result.ok) {
    return jsonError(result.message, result.status)
  }
  return jsonOk({ report: result.data.report })
}
