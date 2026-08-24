import faqItems from '@/lib/content/faqs/faqs.json'
import { CONTACT_EMAIL, CONTACT_PAGE_HREF } from '@/lib/content/contact'
import {
  OVERAGE_PER_1K_USD,
  PRICING_TIERS,
  PRICING_VALUE_ITEMS,
  formatRowCount,
  formatUsd,
  isActive,
} from '@/lib/content/pricing'
import { sanitizeText } from '@/lib/shared/strings'

export type ChatRole = 'system' | 'user' | 'assistant'

export type ChatMessage = {
  role: ChatRole
  content: string
}

type OpenRouterChatResponse = {
  choices?: Array<{ message?: { content?: string | null } }>
  error?: { message?: string }
}

export type EscalationKind = 'none' | 'contact' | 'demo'

export type ChatbotModelOutput = {
  answer: string
  escalation: EscalationKind
  schedulingIntent?: boolean
}

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL
const OPENROUTER_BASE_URL =
  process.env.OPENROUTER_BASE_URL?.replace(/\/$/, '') ?? 'https://openrouter.ai/api/v1'

const rateLimitBuckets = new Map<string, { windowStartMs: number; count: number }>()

/** Stale FAQ pricing copy — superseded by pricing.ts catalog. */
const FAQ_PRICING_QUESTION = 'What pricing plans does FeedForge offer?'

export const SCHEDULING_KEYWORDS =
  /\b(book(?:\s+a)?\s+(?:call|meeting|demo|time|slot)|schedule(?:\s+a)?\s+(?:call|meeting|demo)|pick\s+a\s+time|reserve\s+a\s+slot|arrange\s+a\s+(?:call|meeting)|set\s+up\s+a\s+time)\b/i

export function isOpenRouterConfigured(): boolean {
  return Boolean(OPENROUTER_API_KEY)
}

export function getClientKey(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ip = (forwardedFor?.split(',')[0] ?? realIp ?? 'unknown').trim()
  return ip || 'unknown'
}

export function isRateLimited(key: string, nowMs: number): boolean {
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

export function buildFaqContext(maxItems = 18): string {
  const items = Array.isArray(faqItems) ? faqItems : []
  return items
    .filter((item) => {
      const question = typeof item?.question === 'string' ? item.question.trim() : ''
      return question !== FAQ_PRICING_QUESTION
    })
    .slice(0, maxItems)
    .map((item, index) => {
      const question = typeof item?.question === 'string' ? item.question.trim() : ''
      const answer = typeof item?.answer === 'string' ? item.answer.trim() : ''
      if (!question || !answer) return ''
      return `FAQ_${index + 1}\nQ: ${question}\nA: ${answer}`
    })
    .filter(Boolean)
    .join('\n\n')
}

export function buildPricingContext(): string {
  const tiers = PRICING_TIERS.filter(isActive)
    .map((tier) => {
      const monthly = formatUsd(tier.monthly)
      const activation =
        tier.activationFee == null ? 'Custom activation' : `${formatUsd(tier.activationFee)} activation (waived annually)`
      const rows = formatRowCount(tier.includedRows)
      const features = tier.features.join('; ')
      return `- ${tier.name} (${tier.catalog}): ${monthly}/month, ${activation}, ${rows} included SKUs/month. Includes: ${features}`
    })
    .join('\n')

  const valueItems = PRICING_VALUE_ITEMS.map(
    (item) => `- ${item.label}: ${item.description}`,
  ).join('\n')

  return `
Active plans:
${tiers || '(none)'}

Catalog expansion value (customer outcomes — not separate priced add-ons on the marketing page):
${valueItems || '(none)'}

Founding Merchant Program: activation fee waived + first month free for the first 200 merchants (or through 31 December 2026, whichever comes first). 3-month minimum commitment. From month 2, standard monthly rates apply.

Annual billing: 12× monthly MSRP with activation fee waived (no percentage discount).

Overage: ${formatUsd(OVERAGE_PER_1K_USD)} per 1,000 SKUs beyond plan allotment (same rate on every plan).
Full pricing page: /pricing
`.trim()
}

export function buildChatSystemPrompt(): string {
  const faqContext = buildFaqContext()
  const pricingContext = buildPricingContext()

  return `
You are FeedForge's website assistant.

You help answer questions about FeedForge (pricing, integrations, onboarding, feeds, enrichment, exports).
Do NOT invent product facts. Use ONLY the ground-truth sections below.

Ground truth rules:
- Pricing / plans / tiers / included value / overage / activation fees → use ONLY PRICING CONTEXT.
- All other product questions → use ONLY FAQ CONTEXT.
- If FAQ CONTEXT does not cover the question (or you are unsure), set escalation to "contact".
  Do not guess. Short apology + point to human help; the UI shows a contact card.

Output MUST be ONLY valid JSON with this exact shape:
{ "answer": "string", "escalation": "none"|"contact"|"demo", "schedulingIntent": true|false }

Three mutually exclusive user intents drive the UI. Choose ONE primary intent per turn:

1) schedulingIntent (true) — user explicitly wants to BOOK / SCHEDULE / PICK A TIME.
   Examples: "book a call", "schedule a meeting", "pick a time", "set up a time tomorrow",
   "reserve a slot", "I can do Tuesday at 3pm".
   - answer: 1–2 sentence acknowledgement. Do NOT include URLs, paths, "visit" lines, or
     mentions of a separate demo form. The chat UI opens a slot picker automatically.
   - escalation MUST be "none".

2) escalation = "demo" — user wants to LEARN about / SEE / REQUEST a product demo,
   but has not asked to book a time yet.
   Examples: "I want to see how it works", "can I get a demo?", "show me the product",
   "what does a demo cover?".
   - answer: short pitch (2–4 sentences) describing what the demo covers (catalog
     walkthrough, integrations, pricing tailored to their use case). Do NOT include
     URLs, paths, or "visit" lines — the UI shows the demo card automatically.
   - schedulingIntent MUST be false.

3) escalation = "contact" — FAQ cannot answer, OR user needs human help (support,
   billing disputes, partnerships, bug reports, "talk to someone").
   - answer: brief note that you do not have that detail, then end with ONLY this contact block:
     - Contact: ${CONTACT_EMAIL}
     - Or visit: ${CONTACT_PAGE_HREF}
   - schedulingIntent MUST be false.

Pricing questions answered from PRICING CONTEXT use escalation "none". You may mention /pricing.
If PRICING CONTEXT answers the user directly, use escalation "none".
If FAQ CONTEXT answers a non-pricing question directly, use escalation "none".

Tie-breakers:
- "book a demo", "schedule a demo" → schedulingIntent: true (booking wins over demo info).
- "tell me about your demo" → escalation: "demo".
- "Pricing & plans" / plan names / SKU bands / included capabilities → PRICING CONTEXT, escalation "none".
- Unclear / off-topic / not in FAQ → escalation: "contact".

PRICING CONTEXT:
${pricingContext}

FAQ CONTEXT:
${faqContext}
`.trim()
}

export function parseChatHistory(incomingHistory: unknown[]): ChatMessage[] {
  return incomingHistory.slice(-10).flatMap((entry) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return []
    const { role, content } = entry as Record<string, unknown>
    const safeRole: ChatRole = role === 'assistant' ? 'assistant' : 'user'
    const maxHist = safeRole === 'assistant' ? 2400 : 1200
    const safeContent = sanitizeText(content, { maxLen: maxHist, preserveNewlines: true })
    if (!safeContent) return []
    return [{ role: safeRole, content: safeContent }]
  })
}

function parseEscalation(value: unknown): EscalationKind {
  if (value === 'contact' || value === 'demo' || value === 'none') return value
  return 'none'
}

export function parseModelJson(text: string): ChatbotModelOutput | null {
  const cleaned = text.replace(/```json|```/g, '').trim()
  const firstBrace = cleaned.indexOf('{')
  const lastBrace = cleaned.lastIndexOf('}')

  if (firstBrace < 0 || lastBrace < 0 || firstBrace >= lastBrace) return null

  const jsonSlice = cleaned.slice(firstBrace, lastBrace + 1)

  try {
    const parsed = JSON.parse(jsonSlice) as {
      answer?: unknown
      escalation?: unknown
      shouldEscalate?: unknown
      schedulingIntent?: unknown
    }

    const answer = sanitizeText(parsed.answer, { maxLen: 2000, preserveNewlines: true })
    if (!answer) return null

    let escalation = parseEscalation(parsed.escalation)
    if (escalation === 'none' && parsed.shouldEscalate === true) escalation = 'contact'

    const schedulingIntent = parsed.schedulingIntent === true

    return { answer, escalation, schedulingIntent }
  } catch {
    return null
  }
}

export function stripInternalPathLines(text: string): string {
  return text
    .replace(/\s*-?\s*Or visit\s*:\s*\/?#?request-demo\b/gi, '')
    .replace(/\s*-?\s*Or visit\s*:\s*\/contact\b/gi, '')
    .replace(/\s*(?:please\s+)?visit\s+\/?#?request-demo\b/gi, '')
    .replace(/\s*(?:please\s+)?visit\s+\/contact\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

export function fallbackFromRawText(text: string): ChatbotModelOutput {
  const answer = sanitizeText(text, { maxLen: 2000, preserveNewlines: true })
  return {
    answer: answer || 'Sorry — I could not format a reply. Please try again or contact us.',
    escalation: 'none',
    schedulingIntent: false,
  }
}

export function candidateChatModels(): string[] {
  return [OPENROUTER_MODEL, 'google/gemini-2.5-flash-lite'].filter(
    (value, index, arr): value is string => Boolean(value) && arr.indexOf(value) === index
  )
}

export async function chatCompletion(model: string, messages: ChatMessage[]): Promise<string> {
  const res = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 800,
      response_format: { type: 'json_object' },
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

export function resolveChatReply(
  out: ChatbotModelOutput,
  message: string
): { answer: string; escalation: EscalationKind; schedulingIntent: boolean } {
  const schedulingIntent = out.schedulingIntent === true || SCHEDULING_KEYWORDS.test(message)

  let answer = stripInternalPathLines(out.answer)
  let escalation: EscalationKind = out.escalation
  if (schedulingIntent) {
    escalation = 'none'
    if (!answer) {
      answer = 'Great — pick a time below and we’ll get you booked.'
    }
  } else if (escalation === 'demo' && !answer) {
    answer =
      'Our demo is a quick walkthrough of how FeedForge enriches your catalog, the integrations we support, and pricing tailored to your stack.'
  } else if (!answer) {
    answer = 'Sorry — I could not format a reply. Please try again or contact us.'
  }

  return { answer, escalation, schedulingIntent }
}
