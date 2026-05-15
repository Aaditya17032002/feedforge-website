import { sendFormNotification } from '@/lib/email/email'
import { createLead } from '@/lib/server/leads-api'
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

    const lead = await createLead({
      leadType: 'CONTACT',
      fullName,
      workEmail: email,
      companyName: company || undefined,
      message,
    })
    if (!lead.ok) {
      return jsonError('Could not save your message. Please try again.', 500)
    }

    try {
      await sendFormNotification({
        formType: 'contact',
        fields: {
          fullName,
          email,
          company,
          message,
        },
      })
    } catch (emailErr) {
      console.error('Contact email notification failed (lead saved)', emailErr)
    }

    return jsonOk({ message: 'Message sent successfully.' })
  } catch (error) {
    console.error('POST /api/contact failed', error)
    return jsonError('Something went wrong while sending your message.', 500)
  }
}
