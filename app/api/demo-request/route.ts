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

    const name = sanitizeText(data.name, { maxLen: 120 })
    const email = sanitizeText(data.email, { maxLen: 254, toLowerCase: true })
    const company = sanitizeText(data.company, { maxLen: 120 })
    const message = sanitizeText(data.message, { maxLen: 4000, preserveNewlines: true })

    if (!name || !email) {
      return jsonError('Name and email are required.', 400)
    }

    if (!isValidEmail(email)) {
      return jsonError('Please enter a valid email.', 400)
    }

    const lead = await createLead({
      leadType: 'DEMO_REQUEST',
      fullName: name,
      workEmail: email,
      companyName: company || undefined,
      message: message || undefined,
    })
    if (!lead.ok) {
      return jsonError('Could not save your request. Please try again.', 500)
    }

    try {
      await sendFormNotification({
        formType: 'demo-request',
        fields: {
          name,
          email,
          company,
          message,
        },
      })
    } catch (emailErr) {
      console.error('Demo email notification failed (lead saved)', emailErr)
    }

    return jsonOk({ message: 'Demo request sent successfully.' })
  } catch (error) {
    console.error('POST /api/demo-request failed', error)
    return jsonError('Something went wrong while sending your request.', 500)
  }
}
