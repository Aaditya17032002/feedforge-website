'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ChannelIcon, CheckIcon } from '@/components/audit/ui'
import { validateFile } from '@/components/audit/UploadPanel'
import { GA_EVENTS, trackEvent } from '@/lib/analytics/gtag'
import { AUDIT_DONE_KEY, setPendingAuditFile } from '@/lib/audit/handoff'
import type { ChannelKey } from '@/lib/audit/types'

/** Seconds on a page before the nudge slides in (scrolling far or heading for the tab bar shows it sooner). */
const DELAY_MS = 18_000
const SCROLL_TRIGGER = 0.5
const SNOOZE_DAYS = 3
const DISMISS_KEY = 'ff_audit_nudge_dismissed_at'
const SHOWN_KEY = 'ff_audit_nudge_shown'

type Platform = 'shopify' | 'woocommerce' | 'magento' | 'other'

const CHANNELS: { key: ChannelKey; label: string; fact: string }[] = [
  {
    key: 'chatgpt',
    label: 'ChatGPT',
    fact: 'ChatGPT needs fields Google never asks for, such as seller name, target countries and one row per variant.',
  },
  {
    key: 'google',
    label: 'Google',
    fact: 'Google rejects products with missing identifiers, mismatched prices or broken landing pages, and AI Mode reads the same feed.',
  },
  {
    key: 'bing',
    label: 'Copilot',
    fact: 'Microsoft Merchant Center takes Google-format feeds, so a Google error usually keeps the product out of Copilot too.',
  },
  {
    key: 'meta',
    label: 'Meta',
    fact: 'Meta catalogs need a brand, an image and a valid price on every item before it can show in shops and ads.',
  },
]

const PLATFORMS: { key: Platform; label: string; export: string }[] = [
  { key: 'shopify', label: 'Shopify', export: 'Products → Export → All products → CSV' },
  { key: 'woocommerce', label: 'WooCommerce', export: 'Products → All Products → Export → CSV' },
  { key: 'magento', label: 'Magento', export: 'System → Data Transfer → Export → Products → CSV' },
  { key: 'other', label: 'Other', export: 'Your Google Merchant Center feed, or any product CSV or XML' },
]

function storage(kind: 'local' | 'session'): Storage | null {
  try {
    return kind === 'local' ? window.localStorage : window.sessionStorage
  } catch {
    return null
  }
}

function suppressed(): boolean {
  const local = storage('local')
  const session = storage('session')
  if (local?.getItem(AUDIT_DONE_KEY)) return true
  if (session?.getItem(SHOWN_KEY)) return true
  const dismissed = Number(local?.getItem(DISMISS_KEY) || 0)
  return dismissed > 0 && Date.now() - dismissed < SNOOZE_DAYS * 86_400_000
}

export default function AuditNudge() {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [entered, setEntered] = useState(false)
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [channels, setChannels] = useState<ChannelKey[]>([])
  const [platform, setPlatform] = useState<Platform | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const onAuditPage = pathname?.startsWith('/audit-tool')

  const show = useCallback((trigger: string) => {
    if (suppressed()) return
    storage('session')?.setItem(SHOWN_KEY, '1')
    setOpen(true)
    requestAnimationFrame(() => requestAnimationFrame(() => setEntered(true)))
    trackEvent(GA_EVENTS.AUDIT_NUDGE_SHOWN, { trigger, page: window.location.pathname })
  }, [])

  // Arm the triggers once per page; the first one to fire wins.
  useEffect(() => {
    if (onAuditPage || open || suppressed()) return
    let fired = false
    const fire = (trigger: string) => {
      if (fired) return
      fired = true
      cleanup()
      show(trigger)
    }
    const armedAt = Date.now()
    const timer = window.setTimeout(() => fire('time'), DELAY_MS)
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      if (max > 400 && window.scrollY / max >= SCROLL_TRIGGER && Date.now() - armedAt > 6000) fire('scroll')
    }
    const onLeave = (e: MouseEvent) => {
      if (!e.relatedTarget && e.clientY <= 0 && Date.now() - armedAt > 5000) fire('exit_intent')
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    document.addEventListener('mouseout', onLeave)
    function cleanup() {
      window.clearTimeout(timer)
      window.removeEventListener('scroll', onScroll)
      document.removeEventListener('mouseout', onLeave)
    }
    return cleanup
  }, [onAuditPage, open, show])

  const close = useCallback(
    (reason: string) => {
      setEntered(false)
      window.setTimeout(() => setOpen(false), 250)
      if (reason !== 'go') storage('local')?.setItem(DISMISS_KEY, String(Date.now()))
      trackEvent(GA_EVENTS.AUDIT_NUDGE_DISMISS, { reason, step })
    },
    [step],
  )

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close('escape')
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, close])

  // Leaving for the audit page closes it without snoozing.
  useEffect(() => {
    if (onAuditPage && open) setOpen(false)
  }, [onAuditPage, open])

  if (!open || onAuditPage) return null

  const toggleChannel = (key: ChannelKey) =>
    setChannels((current) => (current.includes(key) ? current.filter((c) => c !== key) : [...current, key]))

  const go = (action: string, file?: File | null) => {
    if (file) {
      const problem = validateFile(file)
      setError(problem)
      if (problem) return
      setPendingAuditFile(file)
    }
    trackEvent(GA_EVENTS.AUDIT_NUDGE_ENGAGE, { action, platform: platform ?? 'unknown', channels: channels.join(',') })
    trackEvent(GA_EVENTS.AUDIT_CTA_CLICK, { location: 'nudge', action })
    close('go')
    router.push('/audit-tool')
  }

  const picked = CHANNELS.filter((c) => channels.includes(c.key))
  const facts = (picked.length ? picked : CHANNELS.slice(0, 2)).slice(0, 2)
  const platformInfo = PLATFORMS.find((p) => p.key === platform) ?? PLATFORMS[3]

  return (
    <div
      role="dialog"
      aria-labelledby="audit-nudge-title"
      className={`fixed inset-x-4 bottom-24 z-[90] mx-auto max-w-sm transition-all duration-300 ease-out motion-reduce:transition-none sm:inset-x-auto sm:bottom-28 sm:right-6 sm:mx-0 sm:w-[22rem] print:hidden ${
        entered ? 'translate-x-0 opacity-100' : 'translate-y-4 opacity-0 sm:translate-x-8 sm:translate-y-0'
      }`}
    >
      <div className="relative overflow-hidden border border-accent/20 bg-white shadow-2xl">
        <div className="h-1 w-full bg-gray-100" aria-hidden>
          <div className="h-full bg-accent transition-all duration-500" style={{ width: `${(step / 3) * 100}%` }} />
        </div>
        <button
          type="button"
          onClick={() => close('close_button')}
          className="absolute right-2 top-3 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
          aria-label="Close"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-5">
          <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-accent">Free AI readiness check · {step}/3</p>

          {step === 1 && (
            <>
              <h2 id="audit-nudge-title" className="mt-1.5 pr-6 text-base font-bold leading-snug text-gray-900">
                Where do you want shoppers to find your products?
              </h2>
              <p className="mt-1 text-xs text-gray-500">Pick all that apply.</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {CHANNELS.map((c) => {
                  const on = channels.includes(c.key)
                  return (
                    <button
                      key={c.key}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggleChannel(c.key)}
                      className={`flex items-center gap-2 border px-3 py-2 text-left text-sm font-medium transition-all ${
                        on ? 'border-accent bg-accent/[0.07] text-accent' : 'border-gray-200 text-gray-700 hover:border-accent/40'
                      }`}
                    >
                      <ChannelIcon channel={c.key} className="h-4 w-4 shrink-0" />
                      <span className="min-w-0 flex-1">{c.label}</span>
                      {on ? <CheckIcon className="h-3.5 w-3.5 shrink-0" /> : null}
                    </button>
                  )
                })}
              </div>
              <button
                type="button"
                disabled={!channels.length}
                onClick={() => {
                  trackEvent(GA_EVENTS.AUDIT_NUDGE_ENGAGE, { action: 'channels', channels: channels.join(',') })
                  setStep(2)
                }}
                className="mt-4 flex h-10 w-full items-center justify-center bg-accent text-sm font-semibold text-white transition-colors hover:bg-[#070066] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <h2 id="audit-nudge-title" className="mt-1.5 pr-6 text-base font-bold leading-snug text-gray-900">
                What does your store run on?
              </h2>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {PLATFORMS.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => {
                      setPlatform(p.key)
                      trackEvent(GA_EVENTS.AUDIT_NUDGE_ENGAGE, { action: 'platform', platform: p.key })
                      setStep(3)
                    }}
                    className="border border-gray-200 px-3 py-2.5 text-sm font-medium text-gray-700 transition-all hover:border-accent hover:bg-accent/[0.05] hover:text-accent"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <button type="button" onClick={() => setStep(1)} className="mt-3 text-xs font-medium text-gray-500 hover:text-accent">
                ← Back
              </button>
            </>
          )}

          {step === 3 && (
            <>
              <h2 id="audit-nudge-title" className="mt-1.5 pr-6 text-base font-bold leading-snug text-gray-900">
                Here&apos;s what usually trips up stores like yours
              </h2>
              <ul className="mt-3 space-y-2">
                {facts.map((c) => (
                  <li key={c.key} className="flex gap-2 text-xs leading-relaxed text-gray-700">
                    <ChannelIcon channel={c.key} className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    {c.fact}
                  </li>
                ))}
              </ul>

              <div
                role="button"
                tabIndex={0}
                aria-label="Drop your product feed to run the free audit"
                onClick={() => inputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    inputRef.current?.click()
                  }
                }}
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragging(true)
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setDragging(false)
                  go('drop', e.dataTransfer.files?.[0])
                }}
                className={`mt-4 cursor-pointer border-2 border-dashed px-3 py-3 text-center transition-colors ${
                  dragging ? 'border-accent bg-accent/[0.08]' : 'border-accent/30 hover:border-accent/60 hover:bg-accent/[0.03]'
                }`}
              >
                <p className="text-sm font-semibold text-gray-900">Drop your export to see your real score</p>
                <p className="mt-0.5 text-[0.6875rem] text-gray-500">{platformInfo.export}</p>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".csv,.tsv,.txt,.xml"
                  className="hidden"
                  onChange={(e) => go('browse', e.target.files?.[0])}
                />
              </div>
              {error ? <p className="mt-1.5 text-xs text-red-600" role="alert">{error}</p> : null}
              <Link
                href="/audit-tool"
                onClick={(e) => {
                  e.preventDefault()
                  go('cta')
                }}
                className="mt-3 flex h-10 w-full items-center justify-center bg-accent text-sm font-semibold text-white transition-colors hover:bg-[#070066]"
              >
                Run my free audit →
              </Link>
              <p className="mt-2 text-center text-[0.6875rem] text-gray-500">Free · 30 seconds · No account needed</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
