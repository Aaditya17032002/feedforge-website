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
    const name = requireText(body?.name)
    const email = requireText(body?.email)
    const company = requireText(body?.company)
    const message = requireText(body?.message)

    if (!name || !email) {
      return jsonError('Name and email are required.', 400)
    }

    if (!isValidEmail(email)) {
      return jsonError('Please enter a valid email.', 400)
    }

    await sendFormNotification({
      formType: 'demo-request',
      fields: {
        name,
        email,
        company,
        message,
      },
    })

    return jsonOk({ message: 'Demo request sent successfully.' })
  } catch (error) {
    console.error('POST /api/demo-request failed', error)
    return jsonError('Something went wrong while sending your request.', 500)
  }
}
