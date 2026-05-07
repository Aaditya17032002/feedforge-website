import sgMail from '@sendgrid/mail'

/**
 * SendGrid dual send per submission:
 * - Demo form (`demo-request`): notify `DEMO_TEAM_EMAIL` (set to e.g. support@yourdomain.com) with all fields; auto-reply to the submitter's `email`.
 * - Contact form (`contact`): notify `CONTACT_TEAM_EMAIL` (e.g. contact@yourdomain.com) with all fields; auto-reply to the submitter's `email`.
 */
export type EmailFormType = 'demo-request' | 'contact'

type SendFormNotificationInput = {
  formType: EmailFormType
  fields: Record<string, string>
}

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL
const DEMO_TEAM_EMAIL = process.env.DEMO_TEAM_EMAIL
const CONTACT_TEAM_EMAIL = process.env.CONTACT_TEAM_EMAIL

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY)
}

type FormConfig = {
  teamEmailEnvName: 'DEMO_TEAM_EMAIL' | 'CONTACT_TEAM_EMAIL'
  getTeamEmail: () => string | undefined
  getTeamSubject: (fields: Record<string, string>) => string
  getCustomerSubject: (fields: Record<string, string>) => string
  getCustomerBody: (fields: Record<string, string>) => { text: string; html: string }
}

const FORM_CONFIG: Record<EmailFormType, FormConfig> = {
  'demo-request': {
    teamEmailEnvName: 'DEMO_TEAM_EMAIL',
    getTeamEmail: () => DEMO_TEAM_EMAIL,
    getTeamSubject: (f) => `New demo request - ${f.name || 'Unknown'}`,
    getCustomerSubject: () => 'We received your demo request - FeedForge',
    getCustomerBody: (f) => {
      const greeting = f.name ? `Hi ${f.name},` : 'Hi there,'
      const text = `${greeting}

Thanks for requesting a demo of FeedForge. Our team will get back to you within 1 business day to schedule a walkthrough.

In the meantime, if you have any questions, just reply to this email.

- The FeedForge team`
      const html = `
        <p>${greeting}</p>
        <p>Thanks for requesting a demo of FeedForge. Our team will get back to you within 1 business day to schedule a walkthrough.</p>
        <p>In the meantime, if you have any questions, just reply to this email.</p>
        <p>- The FeedForge team</p>
      `
      return { text, html }
    },
  },
  contact: {
    teamEmailEnvName: 'CONTACT_TEAM_EMAIL',
    getTeamEmail: () => CONTACT_TEAM_EMAIL,
    getTeamSubject: (f) => `New contact message - ${f.fullName || 'Unknown'}`,
    getCustomerSubject: () => 'Thanks for contacting FeedForge',
    getCustomerBody: (f) => {
      const greeting = f.fullName ? `Hi ${f.fullName},` : 'Hi there,'
      const text = `${greeting}

Thanks for reaching out to FeedForge. We've received your message and a team member will reply shortly.

- The FeedForge team`
      const html = `
        <p>${greeting}</p>
        <p>Thanks for reaching out to FeedForge. We've received your message and a team member will reply shortly.</p>
        <p>- The FeedForge team</p>
      `
      return { text, html }
    },
  },
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function requireText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function buildTeamBody(formType: EmailFormType, fields: Record<string, string>) {
  const headerSubject = FORM_CONFIG[formType].getTeamSubject(fields)

  const text = `Form: ${formType}\n\n${Object.entries(fields)
    .map(([key, value]) => `${key}: ${value || '-'}`)
    .join('\n')}`

  const html = `
    <h2>${headerSubject}</h2>
    <p><strong>Form:</strong> ${formType}</p>
    <ul>
      ${Object.entries(fields)
        .map(([key, value]) => `<li><strong>${key}:</strong> ${value || '-'}</li>`)
        .join('')}
    </ul>
  `

  return { text, html }
}

export async function sendFormNotification({ formType, fields }: SendFormNotificationInput) {
  if (!SENDGRID_API_KEY) {
    throw new Error('Missing SENDGRID_API_KEY')
  }

  if (!SENDGRID_FROM_EMAIL) {
    throw new Error('Missing SENDGRID_FROM_EMAIL')
  }

  const config = FORM_CONFIG[formType]
  const teamEmail = config.getTeamEmail()

  if (!teamEmail) {
    throw new Error(`Missing ${config.teamEmailEnvName}`)
  }

  const customerEmail = fields.email
  if (!customerEmail || !isValidEmail(customerEmail)) {
    throw new Error('Missing or invalid customer email in fields.email')
  }

  const teamBody = buildTeamBody(formType, fields)
  const customerBody = config.getCustomerBody(fields)

  try {
    await Promise.all([
      sgMail.send({
        from: SENDGRID_FROM_EMAIL,
        to: teamEmail,
        replyTo: customerEmail,
        subject: config.getTeamSubject(fields),
        text: teamBody.text,
        html: teamBody.html,
      }),
      sgMail.send({
        from: SENDGRID_FROM_EMAIL,
        to: customerEmail,
        replyTo: teamEmail,
        subject: config.getCustomerSubject(fields),
        text: customerBody.text,
        html: customerBody.html,
      }),
    ])
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown SendGrid error'
    throw new Error(`SendGrid send failed: ${message}`)
  }
}
