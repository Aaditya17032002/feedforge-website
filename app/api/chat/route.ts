import faqItems from '@/lib/content/faqs/faqs.json'
import { CONTACT_EMAIL, CONTACT_PAGE_HREF, CONTACT_SALES_PHONE } from '@/lib/content/contact'
import { sanitizeText } from '@/lib/shared/strings'
import { jsonError, jsonOk, readJsonBody } from '@/lib/server/api'

type ChatRole = 'system' | 'user' | 'assistant'

type ChatMessage = {
  role: ChatRole
  content: string
}

type OpenRouterChatResponse = {
  choices?: Array<{ message?: { content?: string | null } }>
  error?: { message?: string }
}

type ChatbotModelOutput = {
  answer: string
  shouldEscalate: boolean
}

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL
const OPENROUTER_BASE_URL =
  process.env.OPENROUTER_BASE_URL?.replace(/\/$/, '') ?? 'https://openrouter.ai/api/v1'

// Best-effort, in-memory throttling (per runtime instance).
const rateLimitBuckets = new Map<string, { windowStartMs: number; count: number }>()

function getClientKey(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ip = (forwardedFor?.split(',')[0] ?? realIp ?? 'unknown').trim()
  return ip || 'unknown'
}

function isRateLimited(key: string, nowMs: number): boolean {
  const WINDOW_MS = 30_000
  const MAX_REQUESTS = 12

  const bucket = rateLimitBuckets.get(key)
  if (!bucket || nowMs - bucket.windowStartMs > WINDOW_MS) {
    rateLimitBuckets.set(key, { windowStartMs: nowMs, count: 1 })
    return false
  }

  bucket.count += 1
  rateLimitBuckets.set(key, bucket)
  return bucket.count > MAX_REQUESTS
}

function buildFaqContext(maxItems = 18): string {
  const items = Array.isArray(faqItems) ? faqItems.slice(0, maxItems) : []
  return items
    .map((item, index) => {
      const question = typeof item?.question === 'string' ? item.question.trim() : ''
      const answer = typeof item?.answer === 'string' ? item.answer.trim() : ''
      if (!question || !answer) return ''
      return `FAQ_${index + 1}\nQ: ${question}\nA: ${answer}`
    })
    .filter(Boolean)
    .join('\n\n')
}

function parseModelJson(text: string): ChatbotModelOutput | null {
  const cleaned = text.replace(/```json|```/g, '').trim()
  const firstBrace = cleaned.indexOf('{')
  const lastBrace = cleaned.lastIndexOf('}')

  if (firstBrace < 0 || lastBrace < 0 || firstBrace >= lastBrace) {
    return null
  }

  const jsonSlice = cleaned.slice(firstBrace, lastBrace + 1)

  try {
    const parsed = JSON.parse(jsonSlice) as {
      answer?: unknown
      shouldEscalate?: unknown
    }

    const answer = sanitizeText(parsed.answer, { maxLen: 2000, preserveNewlines: true })
    const shouldEscalate = typeof parsed.shouldEscalate === 'boolean' ? parsed.shouldEscalate : false

    if (!answer) return null

    return { answer, shouldEscalate }
  } catch {
    return null
  }
}

async function chatCompletion(model: string, messages: ChatMessage[]): Promise<string> {
  const res = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
    }),
  })

  const data = (await res.json()) as OpenRouterChatResponse

  if (!res.ok) {
    const msg = data.error?.message ?? res.statusText
    throw new Error(`OpenRouter HTTP ${res.status}: ${msg}`)
  }

  const text = data.choices?.[0]?.message?.content
  if (typeof text !== 'string' || !text.trim()) {
    throw new Error('OpenRouter returned an empty response')
  }

  return text
}

export async function POST(request: Request) {
  try {
    if (!OPENROUTER_API_KEY) {
      return jsonError('Chat is not configured yet.', 500)
    }

    const now = Date.now()
    const clientKey = getClientKey(request)
    if (isRateLimited(clientKey, now)) {
      return jsonError('Too many requests. Please wait a moment and try again.', 429)
    }

    const body = await readJsonBody(request)
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return jsonError('Invalid JSON body.', 400)
    }
    const data = body as Record<string, unknown>

    const message = sanitizeText(data.message, { maxLen: 1200, preserveNewlines: true })
    if (!message) {
      return jsonError('Message is required.', 400)
    }

    const incomingHistory = Array.isArray(data.history) ? (data.history as unknown[]) : []
    const history: ChatMessage[] = incomingHistory.slice(-10).flatMap((entry) => {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return []
      const { role, content } = entry as Record<string, unknown>
      const safeRole: ChatRole = role === 'assistant' ? 'assistant' : 'user'
      const safeContent = sanitizeText(content, { maxLen: 1200, preserveNewlines: true })
      if (!safeContent) return []
      return [{ role: safeRole, content: safeContent }]
    })

    const faqContext = buildFaqContext()

    const system = `
You are FeedForge's website assistant.

You help answer questions about FeedForge (pricing, integrations, onboarding, feeds, enrichment, exports).
Use ONLY the FAQ context below as ground truth. If the user's question is not answered by the FAQ context,
or you are not confident, set shouldEscalate=true and guide them to contact the team.

Output MUST be ONLY valid JSON with this exact shape:
{ "answer": "string", "shouldEscalate": true|false }

When shouldEscalate=true, include this CTA at the end of the answer:
- Contact: ${CONTACT_EMAIL} / ${CONTACT_SALES_PHONE}
- Or visit: ${CONTACT_PAGE_HREF}

FAQ CONTEXT:
${faqContext}
`.trim()

    const candidateModels = [OPENROUTER_MODEL, 'openai/gpt-oss-120b:free'].filter(
      (value, index, arr): value is string => Boolean(value) && arr.indexOf(value) === index
    )

    let lastError: unknown = null

    for (const modelName of candidateModels) {
      try {
        const responseText = await chatCompletion(modelName, [
          { role: 'system', content: system },
          ...history,
          { role: 'user', content: message },
        ])

        const parsed = parseModelJson(responseText)
        if (!parsed) {
          throw new Error(`Model output could not be parsed for model: ${modelName}`)
        }

        return jsonOk({ answer: parsed.answer, shouldEscalate: parsed.shouldEscalate })
      } catch (error) {
        lastError = error
      }
    }

    console.error('POST /api/chat failed', lastError)
    return jsonError('Chat is unavailable right now. Please try again shortly.', 500)
  } catch (error) {
    console.error('POST /api/chat failed', error)
    return jsonError('Chat is unavailable right now. Please try again shortly.', 500)
  }
}

