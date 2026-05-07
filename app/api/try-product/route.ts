import { requireText } from '@/lib/shared/strings'
import { generateTryProductFeed } from '@/lib/ai/openrouter'
import { jsonError, jsonOk, readJsonBody } from '@/lib/server/api'

export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request)
    if (!body || typeof body !== 'object') {
      return jsonError('Invalid JSON body.', 400)
    }
    const productTitle = requireText(body?.productTitle)
    const description = requireText(body?.description)

    if (!productTitle) {
      return jsonError('Product title is required.', 400)
    }

    const result = await generateTryProductFeed({ productTitle, description })

    return jsonOk({ message: 'AI feed generated successfully.', ...result })
  } catch (error) {
    console.error('POST /api/try-product failed', error)
    return jsonError('Could not generate AI feed right now. Please try again.', 500)
  }
}
