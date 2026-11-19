import { jsonError, jsonOk } from '@/lib/server/api'
import { analyzeFeed, clientIpFrom } from '@/lib/server/audit-api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_BYTES = 25 * 1024 * 1024
const ALLOWED = /\.(csv|tsv|txt|xml)$/i

/** Upload a feed. Returns the audit preview only; the full report stays on the server. */
export async function POST(request: Request) {
  const length = Number(request.headers.get('content-length') || 0)
  if (length > MAX_BYTES + 64 * 1024) {
    return jsonError('The upload is too large. Please try again.', 413)
  }

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return jsonError('Upload a CSV, TSV or XML file.', 400)
  }

  const file = form.get('file')
  if (!file || typeof file === 'string') {
    return jsonError('Choose a file to audit.', 400)
  }
  const name = (file as File).name || 'feed.csv'
  if (!ALLOWED.test(name)) {
    return jsonError('Upload a CSV, TSV or XML file.', 400)
  }
  if (file.size === 0) {
    return jsonError('The file is empty.', 400)
  }
  if (file.size > MAX_BYTES) {
    return jsonError('The upload is too large. Please try again.', 413)
  }

  const originalSize = Number(form.get('original_size') || 0)
  const result = await analyzeFeed(
    file,
    name,
    clientIpFrom(request),
    Number.isFinite(originalSize) && originalSize > file.size ? Math.floor(originalSize) : null
  )
  if (!result.ok) {
    return jsonError(result.message, result.status)
  }
  return jsonOk({ preview: result.data })
}
