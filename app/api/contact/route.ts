import { sendFormNotification } from '@/lib/email/email'
import { sanitizeText } from '@/lib/shared/strings'
import { isValidEmail } from '@/lib/shared/validation'
import { jsonError, jsonOk, readJsonBody } from '@/lib/server/api'

export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request)
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return jsonError('Invalid JSON body.', 400)
    }
    const data = body as Record<string, unknown>

    const fullName = sanitizeText(data.fullName, { maxLen: 120 })
    const email = sanitizeText(data.email, { maxLen: 254, toLowerCase: true })
    const company = sanitizeText(data.company, { maxLen: 120 })
    const message = sanitizeText(data.message, { maxLen: 4000, preserveNewlines: true })

    if (!fullName || !email || !message) {
      return jsonError('Full name, email, and message are required.', 400)
    }

    if (!isValidEmail(email)) {
      return jsonError('Please enter a valid email.', 400)
    }

    await sendFormNotification({
      formType: 'contact',
      fields: {
        fullName,
        email,
        company,
        message,
      },
    })

    return jsonOk({ message: 'Message sent successfully.' })
  } catch (error) {
    console.error('POST /api/contact failed', error)
    return jsonError('Something went wrong while sending your message.', 500)
  }
}
