'use client'

import Link from 'next/link'
import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { GA_EVENTS, trackEvent } from '@/lib/analytics/gtag'
import {
  CONTACT_EMAIL,
  CONTACT_PAGE_HREF,
  CONTACT_SUPPORT_HOURS,
  DEMO_FORM_HREF,
} from '@/lib/content/contact'
import {
  PRICING_TIERS,
  formatRowCount,
  formatUsd,
  isActive,
} from '@/lib/content/pricing'

// ── Types ──────────────────────────────────────────────────────────────────────

type ChatRole = 'user' | 'assistant'

type ChatMessage = {
  id: string
  role: ChatRole
  content: string
  escalation?: EscalationKind
  /** Marks a placeholder message that anchors the scheduling card to its position in the stream. */
  kind?: 'scheduling'
}

type EscalationKind = 'none' | 'contact' | 'demo' | 'pricing'

type Slot = { start: string; end: string }

type Booking = { uid: string; start: string; meetingUrl?: string }

type SchedulingStep = 'idle' | 'slots' | 'form' | 'confirmed'

type ChatApiResponse =
  | { success: true; answer: string; escalation: EscalationKind; schedulingIntent?: boolean }
  | { success: true; schedulingAction: 'show_slots';        slots: Slot[] }
  | { success: true; schedulingAction: 'no_slots';          bookingUrl: string }
  | { success: true; schedulingAction: 'fallback_link';     bookingUrl: string }
  | { success: true; schedulingAction: 'booking_confirmed'; booking: Booking }
  | { success: false; message: string }

// ── Constants ──────────────────────────────────────────────────────────────────

const quickPrompts = [
  'Pricing & plans',
  'Integrations',
  'Schedule a meeting',
  'Request a demo',
  'Contact us',
] as const

type QuickPrompt = (typeof quickPrompts)[number]

const PRICING_PAGE_HREF = '/pricing'

const QUICK_TYPING_MS = 3000

/** Deterministic replies for quick chips — no OpenRouter call. */
const cannedQuickReplies: Record<
  QuickPrompt,
  { answer: string; escalation: EscalationKind; schedulingIntent?: boolean }
> = {
  'Pricing & plans': {
    answer: 'Here are our active plans. Prices are monthly; activation fees are waived on annual billing.',
    escalation: 'pricing',
  },
  Integrations: {
    answer:
      'You can import product data into FeedForge using CSV upload, Shopify integration, WooCommerce integration, SFTP/FTP, and HTTPS pull endpoints. Shopify also supports OAuth connection for faster catalog onboarding.',
    escalation: 'none',
  },
  'Schedule a meeting': {
    answer: 'Great — pick a time below and we’ll get you booked.',
    escalation: 'none',
    schedulingIntent: true,
  },
  'Request a demo': {
    answer:
      'Our demo is a quick walkthrough of how FeedForge enriches your catalog, the integrations we support, and pricing tailored to your stack.',
    escalation: 'demo',
  },
  'Contact us': {
    answer: `Happy to connect you with the team.\n- Contact: ${CONTACT_EMAIL}\n- Or visit: ${CONTACT_PAGE_HREF}`,
    escalation: 'contact',
  },
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const CHATBOT_WIDGET_STYLES = `
  .ff-widget {
    --accent: #0800A0;
    --accent-hover: #06007a;
    --accent-light: #eeeeff;
    font-family: 'Inter', system-ui, sans-serif;
  }
  .ff-panel { animation: ff-slide-up 0.28s cubic-bezier(0.22,1,0.36,1) both; }
  @keyframes ff-slide-up {
    from { opacity:0; transform:translateY(16px) scale(0.97); }
    to   { opacity:1; transform:translateY(0) scale(1); }
  }
  .ff-fab { animation: ff-pop-in 0.3s cubic-bezier(0.34,1.56,0.64,1) both; }
  @keyframes ff-pop-in {
    from { opacity:0; transform:scale(0.7); }
    to   { opacity:1; transform:scale(1); }
  }
  .typing-dot {
    display:block; width:7px; height:7px; border-radius:50%; background:#9ca3af;
    animation: ff-bounce 1.1s var(--delay,0ms) infinite ease-in-out;
  }
  @keyframes ff-bounce {
    0%,60%,100% { transform:translateY(0); opacity:0.5; }
    30%          { transform:translateY(-5px); opacity:1; }
  }
  .bot-avatar { background:linear-gradient(135deg,#0800A0 0%,#5b21b6 100%); letter-spacing:-0.02em; }
  .ff-chip { transition:background .15s,color .15s,border-color .15s,transform .12s; }
  .ff-chip:hover:not(:disabled) { background:var(--accent-light); border-color:var(--accent); color:var(--accent); transform:translateY(-1px); }
  .ff-chip:active:not(:disabled) { transform:translateY(0); }
  .ff-btn-sending { animation:ff-pulse 1.4s infinite; }
  @keyframes ff-pulse { 0%,100%{opacity:1;} 50%{opacity:0.65;} }
  .ff-textarea:focus { outline:none; }
  .ff-scroll::-webkit-scrollbar { width:5px; }
  .ff-scroll::-webkit-scrollbar-track { background:transparent; }
  .ff-scroll::-webkit-scrollbar-thumb { background:#d1d5db; border-radius:99px; }
  .ff-bubble { animation:ff-bubble-in 0.22s cubic-bezier(0.22,1,0.36,1) both; }
  @keyframes ff-bubble-in {
    from { opacity:0; transform:translateY(6px); }
    to   { opacity:1; transform:translateY(0); }
  }
  .ff-slot-btn { transition:background .15s,border-color .15s,color .15s,transform .1s; }
  .ff-slot-btn:hover:not(:disabled):not(.selected) { background:#eeeeff; border-color:var(--accent); color:var(--accent); }
  .ff-slot-btn:active:not(:disabled) { transform:scale(0.97); }
  .ff-slot-btn.selected { background:var(--accent); border-color:var(--accent); color:#fff; }
  .ff-input { transition:border-color .15s,box-shadow .15s; border:1px solid #e5e7eb; border-radius:12px; width:100%; padding:8px 12px; font-size:14px; background:#f9fafb; }
  .ff-input:focus { outline:none; border-color:var(--accent); box-shadow:0 0 0 3px rgba(8,0,160,0.1); }
`

// ── Helpers ────────────────────────────────────────────────────────────────────

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function clampText(value: string, maxLen: number) {
  const text = value.trim()
  return text.length > maxLen ? `${text.slice(0, maxLen).trim()}…` : text
}

function toEscalation(data: ChatApiResponse): EscalationKind {
  if (!data || data.success === false) return 'none'
  if ('escalation' in data) {
    const e = data.escalation
    if (e === 'contact' || e === 'demo' || e === 'pricing' || e === 'none') return e
  }
  return 'none'
}

function formatSlot(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true,
    })
  } catch {
    return iso
  }
}

function googleCalendarLink(booking: Booking): string {
  const start = new Date(booking.start)
  const end   = new Date(start.getTime() + 30 * 60 * 1000)
  const fmt   = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text:   'FeedForge Demo Call',
    dates:  `${fmt(start)}/${fmt(end)}`,
    ...(booking.meetingUrl ? { location: booking.meetingUrl } : {}),
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-gray-100 px-4 py-3">
        <span className="typing-dot" style={{ '--delay': '0ms' } as React.CSSProperties} />
        <span className="typing-dot" style={{ '--delay': '160ms' } as React.CSSProperties} />
        <span className="typing-dot" style={{ '--delay': '320ms' } as React.CSSProperties} />
      </div>
    </div>
  )
}

function PricingPlansCard() {
  const plans = PRICING_TIERS.filter(isActive)

  return (
    <div
      className="ff-bubble rounded-2xl border px-4 py-3.5"
      style={{ borderColor: 'rgba(8,0,160,0.2)', background: 'rgba(8,0,160,0.04)' }}
    >
      <p className="text-sm font-semibold text-gray-900">Pricing &amp; plans</p>
      <p className="mt-0.5 text-xs text-gray-500">Monthly rates · activation waived on annual</p>

      <ul className="mt-3 space-y-2">
        {plans.map((tier) => (
          <li
            key={tier.key}
            className="rounded-xl border border-gray-200/80 bg-white px-3 py-2.5"
          >
            <div className="flex items-baseline justify-between gap-2">
              <div className="flex min-w-0 items-center gap-1.5">
                <span className="truncate text-sm font-semibold text-gray-900">{tier.name}</span>
                {tier.popular ? (
                  <span
                    className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white"
                    style={{ background: 'var(--accent)' }}
                  >
                    Popular
                  </span>
                ) : null}
              </div>
              <span className="shrink-0 text-sm font-semibold" style={{ color: 'var(--accent)' }}>
                {formatUsd(tier.monthly)}
                <span className="text-xs font-medium text-gray-500">/mo</span>
              </span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-gray-600">
              {tier.catalog} · {formatRowCount(tier.includedRows)} rows/mo
              {tier.activationFee != null ? ` · ${formatUsd(tier.activationFee)} activation` : ''}
            </p>
          </li>
        ))}
      </ul>

      <div className="mt-3">
        <Link
          href={PRICING_PAGE_HREF}
          className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold text-white transition-colors"
          style={{ background: 'var(--accent)' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--accent)')}
        >
          View full pricing details
          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  )
}

function BotAvatar({ size = 28 }: { size?: number }) {
  return (
    <div
      className="bot-avatar shrink-0 flex items-center justify-center rounded-full text-white font-semibold"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      FF
    </div>
  )
}

/** Matches internal paths, with optional "Or visit:" / "please visit" prefixes. */
const internalLinkPattern =
  /(?:Or visit\s*:\s*|(?:please\s+)?visit\s+)?(\/?#?request-demo|\/contact)\b/gi

function pathToCta(path: string): { href: string; label: string } {
  const lower = path.toLowerCase()
  if (lower.includes('request-demo')) {
    return { href: DEMO_FORM_HREF, label: 'Request a demo' }
  }
  return { href: CONTACT_PAGE_HREF, label: 'Contact us' }
}

function AssistantMessageBody({ content }: { content: string }) {
  type Segment = { type: 'text'; value: string } | { type: 'cta'; href: string; label: string }
  const segments: Segment[] = []
  let last = 0
  let match: RegExpExecArray | null
  internalLinkPattern.lastIndex = 0
  while ((match = internalLinkPattern.exec(content)) !== null) {
    if (match.index > last) segments.push({ type: 'text', value: content.slice(last, match.index) })
    const path = match[1] ?? ''
    const full = match[0]
    const prefixLen = full.length - path.length
    if (prefixLen > 0) {
      segments.push({ type: 'text', value: full.slice(0, prefixLen) })
    }
    const { href, label } = pathToCta(path)
    segments.push({ type: 'cta', href, label })
    last = match.index + full.length
  }
  if (last < content.length) segments.push({ type: 'text', value: content.slice(last) })
  if (segments.length === 0) segments.push({ type: 'text', value: content })

  return (
    <>
      {segments.map((seg, i) =>
        seg.type === 'text' ? (
          <Fragment key={i}>{seg.value}</Fragment>
        ) : (
          <Link
            key={i}
            href={seg.href}
            className="font-semibold text-[#0800A0] underline decoration-[#0800A0]/35 underline-offset-2 hover:text-[#06007a]"
          >
            {seg.label}
          </Link>
        )
      )}
    </>
  )
}

// ── Scheduling cards ───────────────────────────────────────────────────────────

function SlotPickerCard({
  slots, selected, onSelect, onConfirm, onCancel, disabled,
}: {
  slots: Slot[]; selected: string | null
  onSelect: (iso: string) => void; onConfirm: () => void; onCancel: () => void; disabled: boolean
}) {
  return (
    <div className="ff-bubble rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <svg className="h-4 w-4 shrink-0" style={{ color: 'var(--accent)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
          <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth={1.75} />
          <path d="M16 2v4M8 2v4M3 10h18" strokeWidth={1.75} strokeLinecap="round" />
        </svg>
        <p className="text-sm font-semibold text-gray-900">Pick a time</p>
        <button
          type="button" onClick={onCancel} disabled={disabled} aria-label="Cancel scheduling"
          className="ml-auto inline-flex h-6 w-6 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40">
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {slots.map((slot) => (
          <button
            key={slot.start}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(slot.start)}
            className={`ff-slot-btn w-full rounded-xl border px-3 py-2.5 text-left text-sm font-medium${selected === slot.start ? ' selected' : ' border-gray-200 text-gray-700'}`}
          >
            {formatSlot(slot.start)}
          </button>
        ))}
      </div>
      <button
        type="button"
        disabled={!selected || disabled}
        onClick={onConfirm}
        className="mt-3 w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-40"
        style={{ background: 'var(--accent)' }}
      >
        Continue →
      </button>
    </div>
  )
}

function BookingFormCard({
  slot, name, email, nameError, emailError, isSending,
  onName, onEmail, onBack, onCancel, onConfirm,
}: {
  slot: string; name: string; email: string
  nameError: string; emailError: string; isSending: boolean
  onName: (v: string) => void; onEmail: (v: string) => void
  onBack: () => void; onCancel: () => void; onConfirm: () => void
}) {
  return (
    <div className="ff-bubble rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <button type="button" onClick={onBack} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800">
          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 18l-6-6 6-6" />
          </svg>
          Back
        </button>
        <button
          type="button" onClick={onCancel} disabled={isSending} aria-label="Cancel scheduling"
          className="inline-flex h-6 w-6 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40">
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <p className="mb-1 text-sm font-semibold text-gray-900">Your details</p>
      <p className="mb-3 text-xs text-gray-500">{formatSlot(slot)}</p>
      <div className="mb-3">
        <label className="mb-1 block text-xs font-medium text-gray-600" htmlFor="sched-name">Full name</label>
        <input id="sched-name" type="text" value={name} onChange={(e) => onName(e.target.value)}
          placeholder="Jane Smith" className="ff-input" />
        {nameError && <p className="mt-1 text-xs text-red-600">{nameError}</p>}
      </div>
      <div className="mb-4">
        <label className="mb-1 block text-xs font-medium text-gray-600" htmlFor="sched-email">Work email</label>
        <input id="sched-email" type="email" value={email} onChange={(e) => onEmail(e.target.value)}
          placeholder="jane@company.com" className="ff-input" />
        {emailError && <p className="mt-1 text-xs text-red-600">{emailError}</p>}
      </div>
      <button
        type="button" disabled={isSending} onClick={onConfirm}
        className="w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
        style={{ background: 'var(--accent)' }}
      >
        {isSending ? 'Booking…' : 'Confirm booking'}
      </button>
    </div>
  )
}

function BookingConfirmedCard({ booking, onDone }: { booking: Booking; onDone: () => void }) {
  return (
    <div className="ff-bubble rounded-2xl border p-4 shadow-sm" style={{ borderColor: 'rgba(8,0,160,0.15)', background: 'rgba(8,0,160,0.04)' }}>
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
        <svg className="h-5 w-5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <p className="text-sm font-semibold text-gray-900">Meeting confirmed!</p>
      <p className="mt-1 text-sm text-gray-600">{formatSlot(booking.start)}</p>
      {booking.meetingUrl && (
        <a href={booking.meetingUrl} target="_blank" rel="noopener noreferrer"
          className="mt-2 flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--accent)' }}>
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
          </svg>
          Join meeting link
        </a>
      )}
      <a href={googleCalendarLink(booking)} target="_blank" rel="noopener noreferrer"
        className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-900">
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
          <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth={1.75} />
          <path d="M16 2v4M8 2v4M3 10h18" strokeWidth={1.75} strokeLinecap="round" />
        </svg>
        Add to Google Calendar
      </a>
      <button type="button" onClick={onDone}
        className="mt-4 w-full rounded-xl border border-gray-200 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50">
        Done
      </button>
    </div>
  )
}

function FallbackLinkCard({ url, onCancel }: { url: string; onCancel: () => void }) {
  return (
    <div className="ff-bubble rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-900">Book a meeting</p>
        <button
          type="button" onClick={onCancel} aria-label="Dismiss"
          className="inline-flex h-6 w-6 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700">
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <p className="mt-1 text-sm text-gray-600">Use our booking page to pick a time that works for you.</p>
      <a href={url} target="_blank" rel="noopener noreferrer"
        className="mt-3 inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold text-white"
        style={{ background: 'var(--accent)' }}>
        Open booking page
        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </a>
    </div>
  )
}

// ── Main widget ────────────────────────────────────────────────────────────────

export default function ChatbotWidget() {
  const [isOpen,     setIsOpen]     = useState(false)
  const [isSending,  setIsSending]  = useState(false)
  const [error,      setError]      = useState<string>('')
  const [escalation, setEscalation] = useState<EscalationKind>('none')
  const [input,      setInput]      = useState('')
  const [messages,   setMessages]   = useState<ChatMessage[]>([
    {
      id: makeId(), role: 'assistant',
      content: 'Hi! I can help with pricing, integrations, onboarding, and how FeedForge improves product feeds. What are you trying to achieve?',
    },
  ])

  // Scheduling state
  const [schedulingStep,   setSchedulingStep]   = useState<SchedulingStep>('idle')
  const [availableSlots,   setAvailableSlots]   = useState<Slot[]>([])
  const [selectedSlot,     setSelectedSlot]     = useState<string | null>(null)
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null)
  const [fallbackUrl,      setFallbackUrl]      = useState<string>('')
  const [guestName,        setGuestName]        = useState('')
  const [guestEmail,       setGuestEmail]       = useState('')
  const [nameError,        setNameError]        = useState('')
  const [emailError,       setEmailError]       = useState('')

  const listRef     = useRef<HTMLDivElement | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const widgetRef   = useRef<HTMLDivElement | null>(null)
  const quickPromptAbortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!isOpen) return
    function handleOutside(event: MouseEvent | TouchEvent) {
      const root = widgetRef.current
      const target = event.target
      if (!root || !(target instanceof Node)) return
      if (!root.contains(target)) setIsOpen(false)
    }
    document.addEventListener('mousedown', handleOutside, true)
    document.addEventListener('touchstart', handleOutside, true)
    return () => {
      document.removeEventListener('mousedown', handleOutside, true)
      document.removeEventListener('touchstart', handleOutside, true)
    }
  }, [isOpen])

  useEffect(() => {
    return () => {
      quickPromptAbortRef.current?.abort()
    }
  }, [])

  const apiHistory = useMemo(() => {
    const all = messages.filter((m) => m.kind !== 'scheduling' && (m.role === 'user' || m.role === 'assistant'))
    const withoutWelcome = all.length > 0 && all[0].role === 'assistant' ? all.slice(1) : all
    return withoutWelcome.slice(-10).flatMap((m): { role: ChatRole; content: string }[] => {
      if (m.role === 'assistant') {
        return [{ role: 'assistant', content: JSON.stringify({ answer: clampText(m.content, 1000), escalation: m.escalation ?? 'none' }) }]
      }
      return [{ role: 'user', content: clampText(m.content, 1200) }]
    })
  }, [messages])

  useEffect(() => {
    if (!isOpen) return
    const node = listRef.current
    if (!node) return
    node.scrollTop = node.scrollHeight
  }, [isOpen, messages.length, isSending, schedulingStep, escalation, error])

  function handleTextareaChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 112)}px`
  }

  function resetScheduling() {
    setSchedulingStep('idle')
    setAvailableSlots([])
    setSelectedSlot(null)
    setConfirmedBooking(null)
    setFallbackUrl('')
    setGuestName('')
    setGuestEmail('')
    setNameError('')
    setEmailError('')
    setMessages((prev) => prev.filter((m) => m.kind !== 'scheduling'))
  }

  async function triggerSchedulingFlow() {
    setIsSending(true)
    setError('')
    setEscalation('none')
    resetScheduling()
    try {
      const res  = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_slots' }),
      })
      const data = (await res.json()) as ChatApiResponse
      if (!data.success) throw new Error('message' in data ? data.message : 'Failed to load slots.')
      if ('schedulingAction' in data) {
        setMessages((prev) => [...prev, { id: makeId(), role: 'assistant', content: '', kind: 'scheduling' }])
        if (data.schedulingAction === 'show_slots') {
          setAvailableSlots(data.slots)
          setSchedulingStep('slots')
        } else {
          setFallbackUrl('bookingUrl' in data ? data.bookingUrl : '')
          setSchedulingStep('confirmed')
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load available times.')
    } finally {
      setIsSending(false)
    }
  }

  async function submitBooking() {
    setNameError('')
    setEmailError('')
    let valid = true
    if (!guestName.trim()) { setNameError('Please enter your name.'); valid = false }
    if (!isValidEmail(guestEmail)) { setEmailError('Please enter a valid email.'); valid = false }
    if (!valid || !selectedSlot) return

    setIsSending(true)
    setError('')
    try {
      const res  = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_booking', start: selectedSlot, name: guestName.trim(), email: guestEmail.trim() }),
      })
      const data = (await res.json()) as ChatApiResponse
      if (!data.success) throw new Error('message' in data ? data.message : 'Booking failed.')
      if ('schedulingAction' in data) {
        if (data.schedulingAction === 'booking_confirmed') {
          setConfirmedBooking(data.booking)
          setSchedulingStep('confirmed')
        } else if (data.schedulingAction === 'fallback_link') {
          setFallbackUrl('bookingUrl' in data ? data.bookingUrl : '')
          setSchedulingStep('confirmed')
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Booking failed. Please try again.')
    } finally {
      setIsSending(false)
    }
  }

  async function sendQuickPrompt(prompt: QuickPrompt) {
    const reply = cannedQuickReplies[prompt]

    setError('')
    setEscalation('none')
    setIsSending(true)

    const userMessage: ChatMessage = { id: makeId(), role: 'user', content: prompt }
    setMessages((prev) => [...prev, userMessage])

    quickPromptAbortRef.current?.abort()
    const abort = new AbortController()
    quickPromptAbortRef.current = abort

    try {
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => resolve(), QUICK_TYPING_MS)
        abort.signal.addEventListener('abort', () => {
          clearTimeout(timer)
          reject(new DOMException('Aborted', 'AbortError'))
        })
      })

      if (abort.signal.aborted) return

      setEscalation(reply.escalation)
      setMessages((prev) => [
        ...prev,
        { id: makeId(), role: 'assistant', content: reply.answer, escalation: reply.escalation },
      ])

      if (reply.schedulingIntent) {
        setIsSending(false)
        void triggerSchedulingFlow()
        return
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return
      setError(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      if (!abort.signal.aborted) setIsSending(false)
    }
  }

  async function sendMessage(text: string) {
    const content = clampText(text, 1200)
    if (!content) return

    setError('')
    setEscalation('none')
    setIsSending(true)

    const userMessage: ChatMessage = { id: makeId(), role: 'user', content }
    setMessages((prev) => [...prev, userMessage])
    if (textareaRef.current) textareaRef.current.style.height = 'auto'

    try {
      const res  = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content, history: apiHistory }),
      })
      const data = (await res.json()) as ChatApiResponse
      if (!res.ok || !data || data.success === false) {
        throw new Error(data && 'message' in data ? data.message : 'Chat request failed.')
      }
      if ('answer' in data) {
        setEscalation(toEscalation(data))
        setMessages((prev) => [
          ...prev,
          { id: makeId(), role: 'assistant', content: data.answer, escalation: toEscalation(data) },
        ])
        if ('schedulingIntent' in data && data.schedulingIntent) {
          setIsSending(false)
          void triggerSchedulingFlow()
          return
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Chat request failed.')
    } finally {
      setIsSending(false)
    }
  }

  function renderSchedulingCard() {
    let card: React.ReactNode = null
    if (schedulingStep === 'slots' && availableSlots.length > 0) {
      card = (
        <SlotPickerCard slots={availableSlots} selected={selectedSlot}
          onSelect={setSelectedSlot} onConfirm={() => setSchedulingStep('form')}
          onCancel={resetScheduling} disabled={isSending} />
      )
    } else if (schedulingStep === 'form' && selectedSlot) {
      card = (
        <BookingFormCard slot={selectedSlot} name={guestName} email={guestEmail}
          nameError={nameError} emailError={emailError} isSending={isSending}
          onName={setGuestName} onEmail={setGuestEmail}
          onBack={() => setSchedulingStep('slots')} onCancel={resetScheduling} onConfirm={submitBooking} />
      )
    } else if (schedulingStep === 'confirmed' && confirmedBooking) {
      card = <BookingConfirmedCard booking={confirmedBooking} onDone={resetScheduling} />
    } else if (schedulingStep === 'confirmed' && !confirmedBooking && fallbackUrl) {
      card = <FallbackLinkCard url={fallbackUrl} onCancel={resetScheduling} />
    }
    if (!card) return null
    return (
      <div className="flex items-end gap-2">
        <BotAvatar size={24} />
        <div className="max-w-[90%] flex-1">{card}</div>
      </div>
    )
  }

  const unreadCount = messages.filter((m) => m.kind !== 'scheduling' && m.role === 'assistant').length - 1

  const toggleChat = () => {
    setIsOpen((open) => {
      if (!open) trackEvent(GA_EVENTS.CHATBOT_OPEN, { location: 'fab' })
      return !open
    })
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CHATBOT_WIDGET_STYLES }} />

      <div ref={widgetRef} className="ff-widget fixed bottom-4 right-4 z-[100] flex flex-col items-end sm:bottom-6 sm:right-6">

        {isOpen && (
          <div className="ff-panel mb-3 flex w-[min(92vw,400px)] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            style={{ border: '1px solid #e5e7eb', maxHeight: '80vh' }}>

            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3" style={{ background: 'linear-gradient(135deg, #0800A0 0%, #4c1d95 100%)' }}>
              <BotAvatar size={36} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">FeedForge Assistant</p>
                <div className="flex items-center gap-1.5">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 0 2px rgba(52,211,153,0.3)' }} />
                  <p className="text-xs text-indigo-200">Online · usually replies instantly</p>
                </div>
              </div>
              <button type="button" onClick={() => setIsOpen(false)} aria-label="Close chat"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-indigo-200 transition-colors hover:bg-white/10 hover:text-white">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Quick prompts */}
            <div className="flex flex-wrap gap-1.5 border-b border-gray-100 bg-gray-50/70 px-4 py-2.5">
              {quickPrompts.map((prompt) => (
                <button key={prompt} type="button"
                  className="ff-chip rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-600 disabled:opacity-40"
                  onClick={() => void sendQuickPrompt(prompt)} disabled={isSending}>
                  {prompt}
                </button>
              ))}
            </div>

            {/* Messages */}
            <div ref={listRef} className="ff-scroll flex-1 overflow-y-auto px-4 py-4" style={{ minHeight: 0 }}>
              <div className="space-y-3">
                {messages.map((m) => {
                  if (m.kind === 'scheduling') {
                    return <Fragment key={m.id}>{renderSchedulingCard()}</Fragment>
                  }
                  const isUser = m.role === 'user'
                  return (
                    <div key={m.id} className={`ff-bubble flex items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
                      {!isUser && <BotAvatar size={24} />}
                      <div
                        className={`max-w-[82%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${isUser ? 'rounded-br-sm text-white' : 'rounded-bl-sm bg-gray-100 text-gray-900'}`}
                        style={isUser ? { background: 'linear-gradient(135deg, #0800A0, #4c1d95)' } : {}}>
                        {isUser ? m.content : <AssistantMessageBody content={m.content} />}
                      </div>
                    </div>
                  )
                })}

                {/* Typing indicator */}
                {isSending && (
                  <div className="ff-bubble flex items-end gap-2">
                    <BotAvatar size={24} />
                    <TypingIndicator />
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div className="ff-bubble rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                    <span className="mr-1.5">⚠</span>{error}
                  </div>
                )}

                {/* Pricing plans card */}
                {escalation === 'pricing' && schedulingStep === 'idle' && (
                  <PricingPlansCard />
                )}

                {/* Contact escalation */}
                {escalation === 'contact' && schedulingStep === 'idle' && (
                  <div className="ff-bubble rounded-2xl border px-4 py-3.5" style={{ borderColor: 'rgba(8,0,160,0.2)', background: 'rgba(8,0,160,0.04)' }}>
                    <p className="text-sm font-semibold text-gray-900">Need more help?</p>
                    <p className="mt-1 text-sm text-gray-600">
                      Reach us at <span className="font-medium text-gray-800">{CONTACT_EMAIL}</span>.
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500">{CONTACT_SUPPORT_HOURS}</p>
                    <div className="mt-3">
                      <Link href={CONTACT_PAGE_HREF}
                        className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold text-white transition-colors"
                        style={{ background: 'var(--accent)' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent-hover)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--accent)')}>
                        Go to Contact page
                        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                )}

                {/* Demo escalation */}
                {escalation === 'demo' && schedulingStep === 'idle' && (
                  <div className="ff-bubble rounded-2xl border px-4 py-3.5" style={{ borderColor: 'rgba(8,0,160,0.2)', background: 'rgba(8,0,160,0.04)' }}>
                    <p className="text-sm font-semibold text-gray-900">Request a demo</p>
                    <p className="mt-1 text-sm text-gray-600">
                      Tell us about your catalog and we&apos;ll set up a personalized walkthrough.
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500">{CONTACT_SUPPORT_HOURS}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Link href={DEMO_FORM_HREF}
                        className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold text-white transition-colors"
                        style={{ background: 'var(--accent)' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent-hover)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--accent)')}>
                        Open demo form
                        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      </Link>
                      <button type="button"
                        onClick={() => void triggerSchedulingFlow()}
                        disabled={isSending}
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-2 text-xs font-semibold transition-colors disabled:opacity-50"
                        style={{ color: 'var(--accent)' }}>
                        Or pick a time directly
                        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* Input */}
            <div className="border-t border-gray-100 bg-white px-3 py-3">
              <div className="flex items-end gap-2 rounded-xl border border-gray-200 bg-gray-50/60 px-3 py-2 transition-colors focus-within:border-[#0800A0] focus-within:bg-white">
                <textarea ref={textareaRef} id="chatbot-input" value={input}
                  onChange={handleTextareaChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      const text = input; setInput(''); void sendMessage(text)
                    }
                  }}
                  rows={1}
                  className="ff-textarea max-h-28 flex-1 resize-none bg-transparent text-sm text-gray-900 placeholder:text-gray-400"
                  style={{ border: 'none', outline: 'none', boxShadow: 'none', lineHeight: '1.5' }}
                  placeholder="Ask a question… (Enter to send)" aria-label="Message" />
                <button type="button" disabled={isSending || !input.trim()}
                  onClick={() => { const text = input; setInput(''); void sendMessage(text) }}
                  className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white transition-all disabled:opacity-40 ${isSending ? 'ff-btn-sending' : 'hover:opacity-90 active:scale-95'}`}
                  style={{ background: 'var(--accent)' }} aria-label="Send message">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19V5M5 12l7-7 7 7" />
                  </svg>
                </button>
              </div>
              <p className="mt-1.5 text-center text-[10px] text-gray-400">Powered by FeedForge AI · Shift+Enter for new line</p>
            </div>
          </div>
        )}

        {/* FAB */}
        <button type="button" onClick={toggleChat}
          aria-label={isOpen ? 'Close chat' : 'Open chat'}
          className="ff-fab relative inline-flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl active:scale-95"
          style={{ background: isOpen ? '#374151' : 'linear-gradient(135deg, #0800A0 0%, #4c1d95 100%)' }}>
          {isOpen ? (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18 18 6M6 6l12 12" />
            </svg>
          ) : (
            <>
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                  d="M21 11.5a8.38 8.38 0 0 1-9 8.5 8.38 8.38 0 0 1-4.5-1.3L3 20l1.2-3.6A8.4 8.4 0 0 1 3 11.5 8.5 8.5 0 0 1 12 3a8.5 8.5 0 0 1 9 8.5Z" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </>
          )}
        </button>
      </div>
    </>
  )
}
