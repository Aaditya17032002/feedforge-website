import { enqueueEmail } from '@/lib/server/email-api'
import { requireText } from '@/lib/shared/strings'
import { isValidEmail } from '@/lib/shared/validation'

export type EmailFormType = 'demo-request' | 'contact'

type SendFormNotificationInput = {
  formType: EmailFormType
  fields: Record<string, string>
  /** Optional lead id for idempotency keys */
  leadId?: string
}

const APP_URL = process.env.APP_URL
const DOCS_URL = process.env.DOCS_URL ?? (APP_URL ? `${APP_URL.replace(/\/+$/, '')}/docs` : undefined)

type FormTemplatePair = {
  teamTemplate: string
  customerTemplate: string
}

const FORM_TEMPLATES: Record<EmailFormType, FormTemplatePair> = {
  'demo-request': {
    teamTemplate: 'demo_request_team',
    customerTemplate: 'demo_request_customer',
  },
  contact: {
    teamTemplate: 'contact_team',
    customerTemplate: 'contact_customer',
  },
}

/**
 * Queue team + customer emails via Platform (Celery / SendGrid).
 * Does not call SendGrid from Portal.
 */
export async function sendFormNotification({
  formType,
  fields,
  leadId,
}: SendFormNotificationInput) {
  const customerEmail = fields.email
  if (!customerEmail || !isValidEmail(customerEmail)) {
    throw new Error('Missing or invalid customer email in fields.email')
  }

  const templates = FORM_TEMPLATES[formType]
  const variables = {
    fields,
    app_url: APP_URL || undefined,
    docs_url: DOCS_URL || undefined,
    reply_email: customerEmail,
  }

  const idemBase = leadId
    ? `${formType}:${leadId}`
    : `${formType}:${customerEmail}:${Date.now()}`

  const [team, customer] = await Promise.all([
    enqueueEmail({
      template: templates.teamTemplate,
      replyTo: customerEmail,
      variables,
      idempotencyKey: `${idemBase}:team`,
    }),
    enqueueEmail({
      template: templates.customerTemplate,
      to: [customerEmail],
      variables,
      idempotencyKey: `${idemBase}:customer`,
    }),
  ])

  if (!team.ok || !customer.ok) {
    const errors = [team.ok ? null : team.error, customer.ok ? null : customer.error]
      .filter(Boolean)
      .join('; ')
    throw new Error(`Email enqueue failed: ${errors}`)
  }
}

export { isValidEmail, requireText }
