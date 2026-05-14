import { sanitizeText } from '@/lib/shared/strings'
import { generateTryProductComparison } from '@/lib/ai/openrouter'
import { jsonError, jsonOk, readJsonBody } from '@/lib/server/api'

export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request)
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return jsonError('Invalid JSON body.', 400)
    }
    const data = body as Record<string, unknown>

    const productTitle = sanitizeText(data.productTitle, { maxLen: 200 })
    const description = sanitizeText(data.description, { maxLen: 5000, preserveNewlines: true })

    if (!productTitle) {
      return jsonError('Product title is required.', 400)
    }

    const result = await generateTryProductComparison({ productTitle, description })

    return jsonOk({ message: 'AI feed generated successfully.', ...result })
  } catch (error) {
    console.error('POST /api/try-product failed', error)

    // FIX: differentiate error types so callers and alerts get meaningful status codes
    if (error instanceof Error) {
      if (error.message.includes('HTTP 429')) {
        return jsonError('AI service is busy. Please try again shortly.', 429)
      }
      if (error.message.includes('could not be parsed')) {
        return jsonError('AI returned an unexpected response. Please try again.', 502)
      }
      if (error.message.includes('Missing OPENROUTER_API_KEY')) {
        return jsonError('Service is misconfigured. Please contact support.', 503)
      }
    }

    return jsonError('Could not generate AI feed right now. Please try again.', 500)
  }
}
