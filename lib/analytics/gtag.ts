export const GA_EVENTS = {
  DEMO_REQUEST_SUBMIT: 'demo_request_submit',
  GENERATE_LEAD: 'generate_lead',
  CONTACT_SUBMIT: 'contact_submit',
  SIGNUP_CLICK: 'signup_click',
  LOGIN_CLICK: 'login_click',
  FEED_DEMO_CLICK: 'feed_demo_click',
  CHATBOT_OPEN: 'chatbot_open',
} as const

export type GaEventName = (typeof GA_EVENTS)[keyof typeof GA_EVENTS]

export type GaEventParams = Record<string, string | number | boolean | undefined>

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
