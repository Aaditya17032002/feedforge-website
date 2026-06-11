export const GA_EVENTS = {
  // --- Key events (conversions): mark these in GA4 Admin > Events ---
  // generate_lead is a GA4 recommended event; fired on every lead form submit.
  GENERATE_LEAD: 'generate_lead',

  // --- Lead form submissions (granular; fired alongside generate_lead) ---
  DEMO_REQUEST_SUBMIT: 'demo_request_submit',
  CONTACT_FORM_SUBMIT: 'contact_form_submit',

  // --- CTA / engagement clicks ---
  TRY_DEMO_CLICK: 'try_demo_click',
  SIGN_UP_CLICK: 'sign_up_click',
  LOGIN_CLICK: 'login_click',

  // --- Chatbot ---
  CHATBOT_OPEN: 'chatbot_open',
} as const

export type GaEventName = (typeof GA_EVENTS)[keyof typeof GA_EVENTS]

export type GaEventParams = Record<string, string | number | boolean | undefined>

/** Identifies which lead form produced a generate_lead event. */
export type LeadFormType = 'demo_request' | 'contact'

declare global {
  interface Window {
    gtag?: (
      command: 'event' | 'config' | 'js' | 'set',
      targetId: string,
      params?: Record<string, unknown>
    ) => void
  }
}

export function trackEvent(name: GaEventName, params?: GaEventParams): void {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return

  const cleanParams = params
    ? Object.fromEntries(
        Object.entries(params).filter(([, value]) => value !== undefined)
      )
    : undefined

  window.gtag('event', name, cleanParams)
}

/**
 * Tracks a lead conversion. Fires the granular per-form event plus the GA4
 * recommended generate_lead event (mark generate_lead as a key event in GA4).
 */
export function trackLead(formType: LeadFormType, location: string): void {
  const submitEvent =
    formType === 'demo_request'
      ? GA_EVENTS.DEMO_REQUEST_SUBMIT
      : GA_EVENTS.CONTACT_FORM_SUBMIT

  trackEvent(submitEvent, { location })
  trackEvent(GA_EVENTS.GENERATE_LEAD, { form_type: formType, location })
}
