import { sanitizeText } from '@/lib/shared/strings'
import { isValidEmail } from '@/lib/shared/validation'
import { jsonError, jsonOk, readJsonBody } from '@/lib/server/api'
import { calBookingUrl, createBooking, fetchAvailableSlots, isCalConfigured } from '@/lib/server/cal'
import {
  candidateChatModels,
  chatCompletion,
  fallbackFromRawText,
  getClientKey,
  isOpenRouterConfigured,
  isRateLimited,
  parseChatHistory,
  parseModelJson,
  resolveChatReply,
  buildChatSystemPrompt,
} from '@/lib/ai/chat'

export async function POST(request: Request) {
  try {
    if (!isOpenRouterConfigured()) return jsonError('Chat is not configured yet.', 500)

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

    if (data.action === 'get_slots') {
      if (!isCalConfigured()) {
        return jsonOk({
          schedulingAction: 'fallback_link',
          bookingUrl: calBookingUrl(),
        })
      }
      try {
        const slots = await fetchAvailableSlots()
        if (slots.length === 0) {
          return jsonOk({
            schedulingAction: 'no_slots',
            bookingUrl: calBookingUrl(),
          })
        }
        return jsonOk({ schedulingAction: 'show_slots', slots })
      } catch {
        return jsonOk({
          schedulingAction: 'fallback_link',
          bookingUrl: calBookingUrl(),
        })
      }
    }

    if (data.action === 'create_booking') {
      const slotStart = typeof data.start === 'string' ? data.start.trim() : ''
      const name = sanitizeText(data.name, { maxLen: 120 })
      const email = sanitizeText(data.email, { maxLen: 254 })?.toLowerCase() ?? ''

      if (!slotStart) return jsonError('Missing slot start time.', 400)
      if (!name) return jsonError('Name is required.', 400)
      if (!email || !isValidEmail(email)) return jsonError('A valid email is required.', 400)

      if (!isCalConfigured()) {
        return jsonOk({
          schedulingAction: 'fallback_link',
          bookingUrl: calBookingUrl(),
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

    const message = sanitizeText(data.message, { maxLen: 1200, preserveNewlines: true })
    if (!message) return jsonError('Message is required.', 400)

    const incomingHistory = Array.isArray(data.history) ? (data.history as unknown[]) : []
    const history = parseChatHistory(incomingHistory)
    const system = buildChatSystemPrompt()
    const candidateModels = candidateChatModels()

    let lastError: unknown = null

    for (const modelName of candidateModels) {
      try {
        const responseText = await chatCompletion(modelName, [
          { role: 'system', content: system },
          ...history,
          { role: 'user', content: message },
        ])

        const parsed = parseModelJson(responseText)
        const out = parsed ?? fallbackFromRawText(responseText)
        if (!parsed) {
          console.warn(
            `[chat] Non-JSON model output for ${modelName}; using plain-text fallback (${responseText.length} chars)`
          )
        }

        return jsonOk(resolveChatReply(out, message))
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
