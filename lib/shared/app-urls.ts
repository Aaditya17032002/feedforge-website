export const APP_BASE_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://devapplication.feedforge.ai').replace(
  /\/$/,
  '',
)
export const LOGIN_URL = APP_BASE_URL
export const SIGNUP_URL = `${APP_BASE_URL}/onboarding`
