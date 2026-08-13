export type Slot = {
  start: string
  end: string
}

export type Booking = {
  uid: string
  start: string
  meetingUrl?: string
}

type CalSlotsResponse = {
  status?: string
  data?: Record<string, Array<{ start: string; end: string }>>
  error?: { message?: string }
  message?: string
}

type CalBookingResponse = {
  status?: string
  data?: {
    uid?: string
    start?: string
    meetingUrl?: string
    location?: string
  }
  error?: { message?: string }
  message?: string
}

const CAL_API_KEY = process.env.CAL_API_KEY ?? ''
const CAL_USERNAME = process.env.CAL_USERNAME ?? ''
const CAL_EVENT_TYPE_ID = process.env.CAL_EVENT_TYPE_ID ?? ''
const CAL_BASE_URL = 'https://api.cal.com/v2'
const CAL_TIMEZONE = (process.env.CAL_TIMEZONE ?? 'UTC').split('#')[0].trim()
const CAL_SLOTS_VERSION = '2024-09-04'
const CAL_BOOKINGS_VERSION = '2024-08-13'

export function isCalConfigured(): boolean {
  return Boolean(CAL_API_KEY && CAL_EVENT_TYPE_ID)
}

export function calBookingUrl(): string {
  return `https://cal.com/${CAL_USERNAME}`
}

function calAuthHeaders(apiVersion: string): HeadersInit {
  return {
    Authorization: `Bearer ${CAL_API_KEY}`,
    'cal-api-version': apiVersion,
    'Content-Type': 'application/json',
  }
}

export async function fetchAvailableSlots(): Promise<Slot[]> {
  const now = new Date()
  const start = now.toISOString().slice(0, 10)
  const end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  const params = new URLSearchParams({
    eventTypeId: CAL_EVENT_TYPE_ID,
    start,
    end,
    timeZone: CAL_TIMEZONE,
    format: 'range',
  })

  const res = await fetch(`${CAL_BASE_URL}/slots?${params.toString()}`, {
    headers: calAuthHeaders(CAL_SLOTS_VERSION),
  })
  const data = (await res.json()) as CalSlotsResponse

  if (!res.ok) {
    const msg = data.error?.message ?? data.message ?? res.statusText
    throw new Error(`Cal.com slots error: ${msg}`)
  }

  const slots: Slot[] = []
  const slotMap = data.data ?? {}

  for (const daySlots of Object.values(slotMap)) {
    for (const s of daySlots) {
      if (slots.length >= 6) break
      slots.push({
        start: new Date(s.start).toISOString(),
        end: new Date(s.end).toISOString(),
      })
    }
    if (slots.length >= 6) break
  }

  return slots
}

export async function createBooking(params: {
  start: string
  name: string
  email: string
}): Promise<Booking> {
  const res = await fetch(`${CAL_BASE_URL}/bookings`, {
    method: 'POST',
    headers: calAuthHeaders(CAL_BOOKINGS_VERSION),
    body: JSON.stringify({
      eventTypeId: Number(CAL_EVENT_TYPE_ID),
      start: params.start,
      attendee: {
        name: params.name,
        email: params.email,
        timeZone: CAL_TIMEZONE,
        language: 'en',
      },
    }),
  })

  const data = (await res.json()) as CalBookingResponse

  if (!res.ok) {
    const msg = data.error?.message ?? data.message ?? res.statusText
    throw new Error(`Cal.com booking error: ${msg}`)
  }

  const booking = data.data
  if (!booking?.uid) throw new Error('Cal.com returned no booking uid')

  const location =
    typeof booking.location === 'string' && booking.location.startsWith('http')
      ? booking.location
      : undefined

  return {
    uid: booking.uid,
    start: booking.start ?? params.start,
    meetingUrl: booking.meetingUrl ?? location,
  }
}
