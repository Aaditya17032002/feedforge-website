export const GA_EVENTS = {
  // --- Key events (conversions): mark these in GA4 Admin > Events ---
  // generate_lead is a GA4 recommended event; fired on every lead form submit.
  GENERATE_LEAD: 'generate_lead',

  // --- Lead form submissions (granular; fired alongside generate_lead) ---
  DEMO_REQUEST_SUBMIT: 'demo_request_submit',
  CONTACT_FORM_SUBMIT: 'contact_form_submit',
  AUDIT_UNLOCK_SUBMIT: 'audit_unlock_submit',

  // --- CTA / engagement clicks ---
  TRY_DEMO_CLICK: 'try_demo_click',
  SIGN_UP_CLICK: 'sign_up_click',
  LOGIN_CLICK: 'login_click',
  PRICING_PLAN_CLICK: 'pricing_plan_click',
  BILLING_INTERVAL_TOGGLE: 'billing_interval_toggle',
  FOUNDING_BANNER_TOGGLE: 'founding_banner_toggle',
  NAV_CLICK: 'nav_click',
  LOGO_CLICK: 'logo_click',

  // --- Try your product (Generate AI feed) ---
  GENERATE_AI_FEED_CLICK: 'generate_ai_feed_click',
  GENERATE_AI_FEED_SUCCESS: 'generate_ai_feed_success',
  GENERATE_AI_FEED_ERROR: 'generate_ai_feed_error',

  // --- AI Channel Readiness Audit ---
  AUDIT_UPLOAD: 'audit_upload',
  AUDIT_PREVIEW_SHOWN: 'audit_preview_shown',
  AUDIT_ERROR: 'audit_error',
  AUDIT_REPORT_PRINT: 'audit_report_print',
  AUDIT_CTA_CLICK: 'audit_cta_click',
  AUDIT_NUDGE_SHOWN: 'audit_nudge_shown',
  AUDIT_NUDGE_ENGAGE: 'audit_nudge_engage',
  AUDIT_NUDGE_DISMISS: 'audit_nudge_dismiss',

  // --- Chatbot ---
  CHATBOT_OPEN: 'chatbot_open',
  SCHEDULE_START: 'schedule_start',
  SCHEDULE_BOOKING_CONFIRMED: 'schedule_booking_confirmed',
  SCHEDULE_FALLBACK_CLICK: 'schedule_fallback_click',
} as const

export type GaEventName = (typeof GA_EVENTS)[keyof typeof GA_EVENTS]

export type GaEventParams = Record<string, string | number | boolean | undefined>

/** Identifies which lead form produced a generate_lead event. */
export type LeadFormType = 'demo_request' | 'contact' | 'audit'

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
      : formType === 'audit'
        ? GA_EVENTS.AUDIT_UNLOCK_SUBMIT
        : GA_EVENTS.CONTACT_FORM_SUBMIT

  trackEvent(submitEvent, { location })
  trackEvent(GA_EVENTS.GENERATE_LEAD, { form_type: formType, location })
}
