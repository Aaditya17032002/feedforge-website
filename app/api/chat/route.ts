import faqItems from '@/lib/content/faqs/faqs.json'
import { CONTACT_EMAIL, CONTACT_PAGE_HREF, CONTACT_SALES_PHONE } from '@/lib/content/contact'
import {
  OVERAGE_PER_1K_USD,
  PRICING_ADDONS,
  PRICING_TIERS,
  formatRowCount,
  formatUsd,
  isActive,
} from '@/lib/content/pricing'
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

type EscalationKind = 'none' | 'contact' | 'demo'

type ChatbotModelOutput = {
  answer: string
  escalation: EscalationKind
  schedulingIntent?: boolean
}

// ── Cal.com types ──────────────────────────────────────────────────────────────

export type Slot = {
  start: string   // ISO string
  end: string     // ISO string
}

export type Booking = {
  uid: string
  start: string   // ISO string
  meetingUrl?: string
}

type CalSlotsResponse = {
  status?: string
  data?: Record<string, Array<{ start: string; end: string }>>
  error?: { message?: string }
  message?: string
}

type CalBookingResponse = {
  status?: string
  data?: {
    uid?: string
    start?: string
    meetingUrl?: string
    location?: string
  }
  error?: { message?: string }
  message?: string
}

// ── Cal.com config ─────────────────────────────────────────────────────────────

const CAL_API_KEY       = process.env.CAL_API_KEY ?? ''
const CAL_USERNAME      = process.env.CAL_USERNAME ?? ''
const CAL_EVENT_TYPE_ID = process.env.CAL_EVENT_TYPE_ID ?? ''
const CAL_BASE_URL      = 'https://api.cal.com/v2'
const CAL_TIMEZONE      = (process.env.CAL_TIMEZONE ?? 'UTC').split('#')[0].trim()
const CAL_SLOTS_VERSION = '2024-09-04'
const CAL_BOOKINGS_VERSION = '2024-08-13'

function calAuthHeaders(apiVersion: string): HeadersInit {
  return {
    Authorization:  `Bearer ${CAL_API_KEY}`,
    'cal-api-version': apiVersion,
    'Content-Type': 'application/json',
  }
}

// ── Cal.com helpers ────────────────────────────────────────────────────────────

async function fetchAvailableSlots(): Promise<Slot[]> {
  const now   = new Date()
  const start = now.toISOString().slice(0, 10)
  const end   = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  const params = new URLSearchParams({
    eventTypeId: CAL_EVENT_TYPE_ID,
    start,
    end,
    timeZone: CAL_TIMEZONE,
    format:   'range',
  })

  const res  = await fetch(`${CAL_BASE_URL}/slots?${params.toString()}`, {
    headers: calAuthHeaders(CAL_SLOTS_VERSION),
  })
  const data = (await res.json()) as CalSlotsResponse

  if (!res.ok) {
    const msg = data.error?.message ?? data.message ?? res.statusText
    throw new Error(`Cal.com slots error: ${msg}`)
  }

  const slots: Slot[] = []
  const slotMap = data.data ?? {}

  for (const daySlots of Object.values(slotMap)) {
    for (const s of daySlots) {
      if (slots.length >= 6) break
      slots.push({
        start: new Date(s.start).toISOString(),
        end:   new Date(s.end).toISOString(),
      })
    }
    if (slots.length >= 6) break
  }

  return slots
}

async function createBooking(params: {
  start: string
  name:  string
  email: string
}): Promise<Booking> {
  const res = await fetch(`${CAL_BASE_URL}/bookings`, {
    method:  'POST',
    headers: calAuthHeaders(CAL_BOOKINGS_VERSION),
    body: JSON.stringify({
      eventTypeId: Number(CAL_EVENT_TYPE_ID),
      start:       params.start,
      attendee: {
        name:     params.name,
        email:    params.email,
        timeZone: CAL_TIMEZONE,
        language: 'en',
      },
    }),
  })

  const data = (await res.json()) as CalBookingResponse

  if (!res.ok) {
    const msg = data.error?.message ?? data.message ?? res.statusText
    throw new Error(`Cal.com booking error: ${msg}`)
  }

  const booking = data.data
  if (!booking?.uid) throw new Error('Cal.com returned no booking uid')

  const location =
    typeof booking.location === 'string' && booking.location.startsWith('http')
      ? booking.location
      : undefined

  return {
    uid:        booking.uid,
    start:      booking.start ?? params.start,
    meetingUrl: booking.meetingUrl ?? location,
  }
}

// Simple email validator
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// ── OpenRouter config ──────────────────────────────────────────────────────────

const OPENROUTER_API_KEY  = process.env.OPENROUTER_API_KEY
const OPENROUTER_MODEL    = process.env.OPENROUTER_MODEL
const OPENROUTER_BASE_URL =
  process.env.OPENROUTER_BASE_URL?.replace(/\/$/, '') ?? 'https://openrouter.ai/api/v1'

// ── Rate limiting ──────────────────────────────────────────────────────────────

const rateLimitBuckets = new Map<string, { windowStartMs: number; count: number }>()

function getClientKey(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp       = request.headers.get('x-real-ip')
  const ip           = (forwardedFor?.split(',')[0] ?? realIp ?? 'unknown').trim()
  return ip || 'unknown'
}

function isRateLimited(key: string, nowMs: number): boolean {
  const WINDOW_MS    = 30_000
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

// ── FAQ / pricing helpers ──────────────────────────────────────────────────────

/** Stale FAQ pricing copy — superseded by pricing.ts catalog. */
const FAQ_PRICING_QUESTION = 'What pricing plans does FeedForge offer?'

function buildFaqContext(maxItems = 18): string {
  const items = Array.isArray(faqItems) ? faqItems : []
  return items
    .filter((item) => {
      const question = typeof item?.question === 'string' ? item.question.trim() : ''
      return question !== FAQ_PRICING_QUESTION
    })
    .slice(0, maxItems)
    .map((item, index) => {
      const question = typeof item?.question === 'string' ? item.question.trim() : ''
      const answer   = typeof item?.answer   === 'string' ? item.answer.trim()   : ''
      if (!question || !answer) return ''
      return `FAQ_${index + 1}\nQ: ${question}\nA: ${answer}`
    })
    .filter(Boolean)
    .join('\n\n')
}

function addonPriceLabel(addon: (typeof PRICING_ADDONS)[number]): string {
  if (addon.priceUnit === 'custom' || addon.monthly == null) return 'Custom'
  if (addon.priceUnit === 'per_1k_rows') return `${formatUsd(addon.monthly)} per 1,000 rows`
  return `${formatUsd(addon.monthly)}/month`
}

function buildPricingContext(): string {
  const tiers = PRICING_TIERS.filter(isActive)
    .map((tier) => {
      const monthly = formatUsd(tier.monthly)
      const activation =
        tier.activationFee == null ? 'Custom activation' : `${formatUsd(tier.activationFee)} activation (waived annually)`
      const rows = formatRowCount(tier.includedRows)
      return `- ${tier.name} (${tier.catalog}): ${monthly}/month, ${activation}, ${rows} included rows/month`
    })
    .join('\n')

  const addons = PRICING_ADDONS.filter(isActive)
    .map((addon) => `- ${addon.label}: ${addonPriceLabel(addon)}. ${addon.description}`)
    .join('\n')

  return `
Active plans:
${tiers || '(none)'}

Add-ons:
${addons || '(none)'}

Overage: ${formatUsd(OVERAGE_PER_1K_USD)} per 1,000 rows beyond plan allotment (same rate on every plan).
Full pricing page: /pricing
`.trim()
}

// ── Model output parsing ───────────────────────────────────────────────────────

function parseEscalation(value: unknown): EscalationKind {
  if (value === 'contact' || value === 'demo' || value === 'none') return value
  return 'none'
}

function parseModelJson(text: string): ChatbotModelOutput | null {
  const cleaned   = text.replace(/```json|```/g, '').trim()
  const firstBrace = cleaned.indexOf('{')
  const lastBrace  = cleaned.lastIndexOf('}')

  if (firstBrace < 0 || lastBrace < 0 || firstBrace >= lastBrace) return null

  const jsonSlice = cleaned.slice(firstBrace, lastBrace + 1)

  try {
    const parsed = JSON.parse(jsonSlice) as {
      answer?:           unknown
      escalation?:       unknown
      shouldEscalate?:   unknown
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

function stripInternalPathLines(text: string): string {
  return text
    .replace(/\s*-?\s*Or visit\s*:\s*\/?#?request-demo\b/gi, '')
    .replace(/\s*-?\s*Or visit\s*:\s*\/contact\b/gi, '')
    .replace(/\s*(?:please\s+)?visit\s+\/?#?request-demo\b/gi, '')
    .replace(/\s*(?:please\s+)?visit\s+\/contact\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function fallbackFromRawText(text: string): ChatbotModelOutput {
  const answer = sanitizeText(text, { maxLen: 2000, preserveNewlines: true })
  return {
    answer:           answer || 'Sorry — I could not format a reply. Please try again or contact us.',
    escalation:       'none',
    schedulingIntent: false,
  }
}

// ── Scheduling intent detection (fast server-side pre-check) ─────────────────
// Keep this list focused on EXPLICIT booking language so generic demo/info
// questions don't accidentally launch the slot picker.

const SCHEDULING_KEYWORDS =
  /\b(book(?:\s+a)?\s+(?:call|meeting|demo|time|slot)|schedule(?:\s+a)?\s+(?:call|meeting|demo)|pick\s+a\s+time|reserve\s+a\s+slot|arrange\s+a\s+(?:call|meeting)|set\s+up\s+a\s+time)\b/i

// ── OpenRouter chat helper ─────────────────────────────────────────────────────

async function chatCompletion(model: string, messages: ChatMessage[]): Promise<string> {
  const res = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method:  'POST',
    headers: {
      Authorization:  `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model, messages }),
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

// ── POST handler ───────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    if (!OPENROUTER_API_KEY) return jsonError('Chat is not configured yet.', 500)

    const now       = Date.now()
    const clientKey = getClientKey(request)
    if (isRateLimited(clientKey, now)) {
      return jsonError('Too many requests. Please wait a moment and try again.', 429)
    }

    const body = await readJsonBody(request)
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return jsonError('Invalid JSON body.', 400)
    }
    const data = body as Record<string, unknown>

    // ── Scheduling sub-actions ─────────────────────────────────────────────────

    // GET SLOTS — triggered when the widget has detected scheduling intent
    if (data.action === 'get_slots') {
      if (!CAL_API_KEY || !CAL_EVENT_TYPE_ID) {
        // Graceful fallback: return the direct booking link
        return jsonOk({
          schedulingAction: 'fallback_link',
          bookingUrl: `https://cal.com/${CAL_USERNAME}`,
        })
      }
      try {
        const slots = await fetchAvailableSlots()
        if (slots.length === 0) {
          return jsonOk({
            schedulingAction: 'no_slots',
            bookingUrl: `https://cal.com/${CAL_USERNAME}`,
          })
        }
        return jsonOk({ schedulingAction: 'show_slots', slots })
      } catch {
        return jsonOk({
          schedulingAction: 'fallback_link',
          bookingUrl: `https://cal.com/${CAL_USERNAME}`,
        })
      }
    }

    // CREATE BOOKING — triggered when the user confirms name + email + slot
    if (data.action === 'create_booking') {
      const slotStart = typeof data.start === 'string' ? data.start.trim() : ''
      const name      = sanitizeText(data.name,  { maxLen: 120 })
      const email     = sanitizeText(data.email, { maxLen: 254 })?.toLowerCase() ?? ''

      if (!slotStart) return jsonError('Missing slot start time.', 400)
      if (!name)      return jsonError('Name is required.',        400)
      if (!email || !isValidEmail(email)) return jsonError('A valid email is required.', 400)

      if (!CAL_API_KEY || !CAL_EVENT_TYPE_ID) {
        return jsonOk({
          schedulingAction: 'fallback_link',
          bookingUrl: `https://cal.com/${CAL_USERNAME}`,
        })
      }

      try {
        const booking = await createBooking({ start: slotStart, name, email })
        return jsonOk({ schedulingAction: 'booking_confirmed', booking })
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Booking failed'
        return jsonError(msg, 500)
      }
    }

    // ── Normal chat flow ───────────────────────────────────────────────────────

    const message = sanitizeText(data.message, { maxLen: 1200, preserveNewlines: true })
    if (!message) return jsonError('Message is required.', 400)

    const incomingHistory = Array.isArray(data.history) ? (data.history as unknown[]) : []
    const history: ChatMessage[] = incomingHistory.slice(-10).flatMap((entry) => {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return []
      const { role, content } = entry as Record<string, unknown>
      const safeRole: ChatRole = role === 'assistant' ? 'assistant' : 'user'
      const maxHist = safeRole === 'assistant' ? 2400 : 1200
      const safeContent = sanitizeText(content, { maxLen: maxHist, preserveNewlines: true })
      if (!safeContent) return []
      return [{ role: safeRole, content: safeContent }]
    })

    const faqContext = buildFaqContext()
    const pricingContext = buildPricingContext()

    const system = `
You are FeedForge's website assistant.

You help answer questions about FeedForge (pricing, integrations, onboarding, feeds, enrichment, exports).
Do NOT invent product facts. Use ONLY the ground-truth sections below.

Ground truth rules:
- Pricing / plans / tiers / add-ons / overage / activation fees → use ONLY PRICING CONTEXT.
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
     - Contact: ${CONTACT_EMAIL} / ${CONTACT_SALES_PHONE}
     - Or visit: ${CONTACT_PAGE_HREF}
   - schedulingIntent MUST be false.

Pricing questions answered from PRICING CONTEXT use escalation "none". You may mention /pricing.
If PRICING CONTEXT answers the user directly, use escalation "none".
If FAQ CONTEXT answers a non-pricing question directly, use escalation "none".

Tie-breakers:
- "book a demo", "schedule a demo" → schedulingIntent: true (booking wins over demo info).
- "tell me about your demo" → escalation: "demo".
- "Pricing & plans" / plan names / SKU bands / add-ons → PRICING CONTEXT, escalation "none".
- Unclear / off-topic / not in FAQ → escalation: "contact".

PRICING CONTEXT:
${pricingContext}

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
        const out    = parsed ?? fallbackFromRawText(responseText)
        if (!parsed) {
          console.warn(
            `[chat] Non-JSON model output for ${modelName}; using plain-text fallback (${responseText.length} chars)`
          )
        }

        // Belt-and-suspenders: only the explicit booking regex (not generic
        // "demo" mentions) forces schedulingIntent on top of the model output.
        const schedulingIntent =
          out.schedulingIntent === true || SCHEDULING_KEYWORDS.test(message)

        // Intents are mutually exclusive. Booking wins over a soft demo
        // escalation; both flows handle their CTAs inline so we strip stray
        // URLs/paths the model might have left in the answer.
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

        return jsonOk({
          answer,
          escalation,
          schedulingIntent,
        })
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
