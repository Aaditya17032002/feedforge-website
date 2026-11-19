'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { Bar, ChannelIcon, CheckIcon, ScoreRing, scoreColor } from '@/components/audit/ui'
import { validateFile } from '@/components/audit/UploadPanel'
import { GA_EVENTS, trackEvent } from '@/lib/analytics/gtag'
import { setPendingAuditFile } from '@/lib/audit/handoff'
import type { ChannelKey } from '@/lib/audit/types'

const SAMPLE: { channel: ChannelKey; label: string; score: number }[] = [
  { channel: 'google', label: 'Google Shopping & AI Mode', score: 71 },
  { channel: 'chatgpt', label: 'ChatGPT', score: 48 },
  { channel: 'bing', label: 'Microsoft Copilot', score: 76 },
  { channel: 'meta', label: 'Meta', score: 82 },
]

const SAMPLE_ISSUES = [
  { tone: 'bg-red-500', text: '23 products missing GTIN or brand' },
  { tone: 'bg-orange-500', text: 'Variants not grouped for ChatGPT' },
  { tone: 'bg-amber-400', text: 'Titles too thin for AI answers' },
]

const POINTS = [
  'More than 50 checks against Google and OpenAI feed rules',
  'Live check of your store: prices, broken links, images, AI crawler access',
  'AI-written title fixes built only from your own product data',
]

/** Home page band that sells the free audit and accepts a file right here. */
export default function AuditPromo() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const el = cardRef.current
    if (!el || typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true)
          io.disconnect()
        }
      },
      { threshold: 0.35 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const start = (file: File | null | undefined, how: 'drop' | 'browse') => {
    if (!file) return
    const problem = validateFile(file)
    setError(problem)
    if (problem) return
    trackEvent(GA_EVENTS.AUDIT_CTA_CLICK, { location: 'home_section', action: how })
    setPendingAuditFile(file)
    router.push('/audit-tool')
  }

  return (
    <section id="free-audit" className="border-y border-gray-200 bg-gradient-to-br from-accent/[0.06] via-white to-accent/[0.03]" aria-labelledby="free-audit-heading">
      <div className="mx-auto grid max-w-7xl min-w-0 gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-2 lg:items-center lg:gap-16 lg:py-20">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-white px-3 py-1 text-xs font-semibold text-accent">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Free AI Channel Readiness Audit
          </span>
          <h2 id="free-audit-heading" className="mt-4 text-balance text-2xl font-bold leading-tight text-gray-900 sm:text-3xl">
            Will ChatGPT and Google AI recommend <span className="text-accent">your products?</span>
          </h2>
          <p className="mt-3 text-pretty text-sm leading-relaxed text-gray-600 sm:text-base">
            Drop in your product feed or store export and get a readiness score for every AI shopping channel, with the exact fixes. No account needed.
          </p>
          <ul className="mt-5 space-y-2.5">
            {POINTS.map((p) => (
              <li key={p} className="flex gap-2.5 text-sm text-gray-700">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                  <CheckIcon className="h-3 w-3" />
                </span>
                {p}
              </li>
            ))}
          </ul>

          <div
            role="button"
            tabIndex={0}
            aria-label="Drop a product feed file to start the free audit"
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
              start(e.dataTransfer.files?.[0], 'drop')
            }}
            className={`mt-7 flex cursor-pointer flex-col items-center justify-center gap-2 border-2 border-dashed px-4 py-7 text-center transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${
              dragging ? 'scale-[1.01] border-accent bg-accent/[0.08]' : 'border-accent/30 bg-white hover:border-accent/60 hover:bg-accent/[0.03]'
            }`}
          >
            <svg className="h-8 w-8 text-accent" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0l-4 4m4-4l4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
            </svg>
            <span className="text-sm font-semibold text-gray-900">Drop your feed here to get your score</span>
            <span className="text-xs text-gray-500">CSV, TSV or XML · Shopify, WooCommerce, Magento or Google Merchant exports</span>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.tsv,.txt,.xml"
              className="hidden"
              onChange={(e) => start(e.target.files?.[0], 'browse')}
            />
          </div>
          {error ? <p className="mt-2 text-sm text-red-600" role="alert">{error}</p> : null}
          <p className="mt-3 text-xs text-gray-500">
            No file handy?{' '}
            <Link
              href="/audit-tool"
              className="font-semibold text-accent hover:underline"
              onClick={() => trackEvent(GA_EVENTS.AUDIT_CTA_CLICK, { location: 'home_section', action: 'link' })}
            >
              See how the audit works →
            </Link>
          </p>
        </div>

        <div ref={cardRef} className="min-w-0">
          <div className="relative border border-gray-200 bg-white p-5 shadow-lg sm:p-7">
            <span className="absolute right-4 top-4 rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[0.6875rem] font-medium text-gray-500">
              Example report
            </span>
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
              <div className="shrink-0">
                {visible ? <ScoreRing score={68} size={136} label="AI readiness" /> : <div className="h-[136px] w-[136px]" />}
              </div>
              <ul className="w-full min-w-0 space-y-3">
                {SAMPLE.map((s, i) => (
                  <li key={s.channel} className="transition-opacity duration-500" style={{ opacity: visible ? 1 : 0, transitionDelay: `${150 + i * 120}ms` }}>
                    <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                      <span className="flex min-w-0 items-center gap-1.5 font-medium text-gray-700">
                        <ChannelIcon channel={s.channel} className="h-4 w-4 shrink-0" />
                        <span className="truncate">{s.label}</span>
                      </span>
                      <span className="font-bold" style={{ color: scoreColor(s.score) }}>{s.score}</span>
                    </div>
                    <Bar pct={visible ? s.score : 0} tone="score" />
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-6 border-t border-gray-100 pt-4">
              <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-gray-400">Top issues found</p>
              <ul className="mt-2 space-y-2">
                {SAMPLE_ISSUES.map((issue, i) => (
                  <li
                    key={issue.text}
                    className="flex items-center gap-2 text-sm text-gray-700 transition-all duration-500"
                    style={{ opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(6px)', transitionDelay: `${700 + i * 150}ms` }}
                  >
                    <span className={`h-2 w-2 shrink-0 rounded-full ${issue.tone}`} />
                    {issue.text}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
