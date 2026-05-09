import sgMail from '@sendgrid/mail'
import { requireText } from '@/lib/shared/strings'
import { isValidEmail } from '@/lib/shared/validation'
import { ctaButton, escapeHtml, renderEmailTemplate } from '@/lib/email/template'

export type EmailFormType = 'demo-request' | 'contact'

type SendFormNotificationInput = {
  formType: EmailFormType
  fields: Record<string, string>
}

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL
const DEMO_TEAM_EMAIL = process.env.DEMO_TEAM_EMAIL
const CONTACT_TEAM_EMAIL = process.env.CONTACT_TEAM_EMAIL
const APP_URL = process.env.APP_URL
const DOCS_URL = process.env.DOCS_URL ?? `${APP_URL}/docs`

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

    getTeamSubject: (f) => `New demo request from ${f.name || f.fullName || 'Unknown'}`,

    // Specific and reassuring for the customer
    getCustomerSubject: () => 'Your FeedForge demo is confirmed ✓',

    getCustomerBody: (f) => {
      const firstName = (f.name || f.fullName || '').split(' ')[0]
      const greeting = firstName ? `Hi ${firstName},` : 'Hi there,'

      const text = `${greeting}

Excited to show you what FeedForge can do.

Our team will reach out within 1 business day to find a time that works for you. In the meantime, feel free to browse our docs or reply to this email with any questions.

– The FeedForge team`

      const html = `
        <p style="margin: 0 0 14px 0; font-size: 14px; line-height: 1.65;">${escapeHtml(greeting)}</p>
        <p style="margin: 0 0 14px 0; font-size: 14px; line-height: 1.65;">
          Excited to show you what <strong>FeedForge</strong> can do. Our team will reach out
          <strong>within 1 business day</strong> to find a time that works for you.
        </p>
        <p style="margin: 0 0 4px 0; font-size: 14px; line-height: 1.65;">
          In the meantime, feel free to browse our docs or reply to this email with any questions.
        </p>
        ${DOCS_URL ? ctaButton(DOCS_URL, 'Browse the docs') : ''}
        <p style="margin: 0; font-size: 14px; line-height: 1.65;">– The FeedForge team</p>
      `
      return { text, html }
    },
  },

  contact: {
    teamEmailEnvName: 'CONTACT_TEAM_EMAIL',
    getTeamEmail: () => CONTACT_TEAM_EMAIL,

    // Includes subject line when the form collects one
    getTeamSubject: (f) => {
      const name = f.fullName || f.name
      const subject = f.subject
      if (name && subject) return `Contact — ${name}: ${subject}`
      if (name) return `Contact message — ${name}`
      return 'New contact message'
    },

    getCustomerSubject: () => "Thanks for reaching out - we'll reply soon, feedforge.ai",

    getCustomerBody: (f) => {
      const firstName = (f.fullName || f.name || '').split(' ')[0]
      const greeting = firstName ? `Hi ${firstName},` : 'Hi there,'

      const text = `${greeting}

Thanks for reaching out. We've received your message and someone from our team will follow up shortly.

If it's urgent, just reply to this email and we'll prioritize it.

– The FeedForge team`

      const html = `
        <p style="margin: 0 0 14px 0; font-size: 14px; line-height: 1.65;">${escapeHtml(greeting)}</p>
        <p style="margin: 0 0 14px 0; font-size: 14px; line-height: 1.65;">
          Thanks for reaching out. We've received your message and someone from our team
          will follow up <strong>shortly</strong>.
        </p>
        <p style="margin: 0 0 14px 0; font-size: 14px; line-height: 1.65;">
          If it's urgent, just reply to this email and we'll prioritize it.
        </p>
        <p style="margin: 0; font-size: 14px; line-height: 1.65;">– The FeedForge team</p>
      `
      return { text, html }
    },
  },
}

function toTitleCase(value: string) {
  return value
    .replaceAll(/[-_]+/g, ' ')
    .replaceAll(/\s+/g, ' ')
    .trim()
    .replaceAll(/\b\w/g, (m) => m.toUpperCase())
}

function buildTeamBody(formType: EmailFormType, fields: Record<string, string>) {
  const config = FORM_CONFIG[formType]
  const subject = config.getTeamSubject(fields)
  const formLabel = formType === 'demo-request' ? 'demo request' : 'contact message'
  const replyEmail = fields.email ?? '-'

  const text = `Form: ${formType}\n\n${Object.entries(fields)
    .map(([key, value]) => `${key}: ${value || '-'}`)
    .join('\n')}`

  const rowsHtml = Object.entries(fields)
    .map(([key, value]) => {
      const label = escapeHtml(toTitleCase(key))
      const safeValue = escapeHtml((value || '-').trim() || '-')
      return `
        <tr>
          <td style="padding: 10px 14px; border-top: 1px solid #e5e7eb; vertical-align: top;
                     width: 32%; font-size: 13px; line-height: 1.5; font-weight: 600; color: #374151;">
            ${label}
          </td>
          <td style="padding: 10px 14px; border-top: 1px solid #e5e7eb; vertical-align: top;
                     font-size: 13px; line-height: 1.5; color: #111827;">
            ${safeValue}
          </td>
        </tr>
      `
    })
    .join('')

  const contentHtml = `
    <p style="margin: 0 0 14px 0; font-size: 14px; line-height: 1.65;">
      A new <strong>${escapeHtml(formLabel)}</strong> just came in. Details below.
    </p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
           style="border-collapse: separate; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
      <tbody>${rowsHtml}</tbody>
    </table>
    <p style="margin: 14px 0 0 0; font-size: 13px; line-height: 1.6; color: #6b7280;">
      Reply to this email to reach <strong style="color: #111827;">${escapeHtml(replyEmail)}</strong> directly.
    </p>
  `

  const footerHtml = `
    <div class="muted">
      Submitted via the ${escapeHtml(formLabel)} form
      ${APP_URL ? `&middot; <a href="${escapeHtml(APP_URL)}" style="color: inherit;">${escapeHtml(APP_URL.replace(/^https?:\/\//, ''))}</a>` : ''}
    </div>
  `

  return {
    text,
    html: renderEmailTemplate({
      title: subject,
      preheader: `New ${formLabel} submission`,
      contentHtml,
      footerHtml,
      logoHref: APP_URL,
    }),
  }
}

export async function sendFormNotification({ formType, fields }: SendFormNotificationInput) {
  if (!SENDGRID_API_KEY) throw new Error('Missing SENDGRID_API_KEY')
  if (!SENDGRID_FROM_EMAIL) throw new Error('Missing SENDGRID_FROM_EMAIL')

  const config = FORM_CONFIG[formType]
  const teamEmail = config.getTeamEmail()
  if (!teamEmail) throw new Error(`Missing ${config.teamEmailEnvName}`)

  const customerEmail = fields.email
  if (!customerEmail || !isValidEmail(customerEmail)) {
    throw new Error('Missing or invalid customer email in fields.email')
  }

  const teamBody = buildTeamBody(formType, fields)
  const customerBodyRaw = config.getCustomerBody(fields)

  const customerPreheader =
    formType === 'demo-request'
      ? "We'll be in touch within 1 business day to schedule your walkthrough"
      : "Someone from our team will follow up with you shortly"

  const customerFooterHtml =
    formType === 'demo-request'
      ? `<div class="muted">We'll reply within 1 business day. You can respond directly to this email.</div>`
      : `<div class="muted">We'll reply soon. You can respond directly to this email.</div>`

  const customerHtml = renderEmailTemplate({
    title: config.getCustomerSubject(fields),
    preheader: customerPreheader,
    contentHtml: customerBodyRaw.html,
    logoHref: APP_URL,
    footerHtml: customerFooterHtml,
  })

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
        text: customerBodyRaw.text,
        html: customerHtml,
      }),
    ])
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown SendGrid error'
    throw new Error(`SendGrid send failed: ${message}`)
  }
}

export { isValidEmail, requireText }
