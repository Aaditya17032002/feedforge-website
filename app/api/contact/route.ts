import { sendFormNotification } from '@/lib/email/email'
import { requireText } from '@/lib/shared/strings'
import { isValidEmail } from '@/lib/shared/validation'
import { jsonError, jsonOk, readJsonBody } from '@/lib/server/api'

export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request)
    if (!body || typeof body !== 'object') {
      return jsonError('Invalid JSON body.', 400)
    }
    const fullName = requireText(body?.fullName)
    const email = requireText(body?.email)
    const company = requireText(body?.company)
    const message = requireText(body?.message)

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
