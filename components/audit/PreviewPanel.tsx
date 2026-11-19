'use client'

import { useState } from 'react'
import type { AuditPreview } from '@/lib/audit/types'
import { AUDIT_CHANNEL_INFO } from '@/lib/content/audit'
import { isValidEmail } from '@/lib/shared/validation'
import { Bar, BasisBadge, ChannelIcon, CheckIcon, LockIcon, ScoreRing, SeverityBadge, scoreColor } from '@/components/audit/ui'

type UnlockInput = { email: string; storeUrl: string; fullName: string }

type Props = {
  preview: AuditPreview
  onUnlock: (input: UnlockInput) => Promise<void>
  unlocking: boolean
  unlockError: string | null
  onReset: () => void
}

/**
 * Placeholder rows for the locked area. These are fixed strings, not data from
 * the audit: the real report is not on the page until it is unlocked.
 */
const LOCKED_PLACEHOLDER = [
  ['Critical', 'Lorem ipsum dolor sit amet consectetur', '00 products'],
  ['High', 'Sed do eiusmod tempor incididunt labore', '00 products'],
  ['High', 'Ut enim ad minim veniam quis nostrud', '00 products'],
  ['Medium', 'Duis aute irure dolor in reprehenderit', '00 products'],
  ['Medium', 'Excepteur sint occaecat cupidatat non', '00 products'],
]

export default function PreviewPanel({ preview, onUnlock, unlocking, unlockError, onReset }: Props) {
  const { summary, file, channels } = preview
  const counts = summary.issue_counts

  return (
    <div className="space-y-6">
      {/* Score header */}
      <div className="border border-gray-200 bg-white p-5 shadow-sm sm:p-8">
        <div className="flex flex-col items-center gap-8 md:flex-row md:items-center">
          <ScoreRing score={summary.overall_score} label="AI Readiness" />
          <div className="min-w-0 flex-1 text-center md:text-left">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Your AI Readiness Score</p>
            <h2 className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">
              <span style={{ color: scoreColor(summary.overall_score) }}>{summary.grade.label}</span>
              <span className="text-gray-900"> for AI shopping</span>
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {file.platform.label} · {file.rows_analyzed} of {file.rows_in_file_estimated ? 'about ' : ''}
              {file.rows_in_file.toLocaleString()}
              {file.rows_in_file_capped ? '+' : ''} products audited · {summary.checks_run} checks
            </p>
            <p className="mt-1 text-xs text-gray-500">
              A readiness index built from each channel&apos;s published rules and AI-shopping best practices. It isn&apos;t a ranking
              published by any channel.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(['critical', 'high', 'medium', 'low'] as const).map((sev) => (
                <div key={sev} className="border border-gray-200 bg-gray-50 px-3 py-2.5 text-left">
                  <SeverityBadge severity={sev} />
                  <p className="mt-1.5 text-xl font-bold tabular-nums text-gray-900">{counts[sev]}</p>
                  <p className="text-[0.6875rem] text-gray-500">issue types</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Channels */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {channels.map((c) => (
          <div key={c.key} className="border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <ChannelIcon channel={c.key} />
              <p className="min-w-0 truncate text-sm font-bold text-gray-900">{AUDIT_CHANNEL_INFO[c.key]?.short ?? c.label}</p>
              <span className="ml-auto text-lg font-bold tabular-nums" style={{ color: scoreColor(c.score) }}>
                {c.score}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-gray-500">{AUDIT_CHANNEL_INFO[c.key]?.detail}</p>
            <div className="mt-3">
              <Bar pct={c.score} tone="score" />
            </div>
            <p className="mt-2 text-xs text-gray-600">
              <span className="font-semibold text-gray-900">{c.eligible}</span> of {c.eligible + c.ineligible} products eligible
            </p>
          </div>
        ))}
      </div>

      {/* Top findings */}
      <div className="border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-base font-bold text-gray-900">Top findings</h3>
          <p className="text-xs text-gray-500">
            {summary.products_with_issues} of {file.rows_analyzed} products have at least one issue · data completeness {summary.completeness_pct}%
          </p>
        </div>
        {preview.top_issues.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-gray-700">
            <CheckIcon className="h-4 w-4 text-emerald-600" /> No issues found in the products we checked.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {preview.top_issues.map((issue) => (
              <li key={issue.title} className="flex flex-wrap items-center gap-3 py-3">
                <SeverityBadge severity={issue.severity} />
                {issue.basis ? <BasisBadge basis={issue.basis} /> : null}
                <span className="min-w-0 flex-1 text-sm font-medium text-gray-900">{issue.title}</span>
                <span className="text-xs text-gray-500">{issue.dimension_label}</span>
                <span className="w-24 text-right text-sm font-bold tabular-nums text-gray-900">
                  {issue.affected} product{issue.affected === 1 ? '' : 's'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Locked area */}
      <div className="relative overflow-hidden border border-accent/25 bg-white shadow-sm">
        <div className="pointer-events-none absolute inset-0 select-none p-5 blur-[6px] sm:p-6" aria-hidden>
          <p className="mb-4 text-base font-bold text-gray-900">All issues with fixes</p>
          <ul className="space-y-2">
            {LOCKED_PLACEHOLDER.map(([sev, text, count], i) => (
              <li key={i} className="flex items-center gap-3 border border-gray-200 px-3 py-3">
                <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs">{sev}</span>
                <span className="flex-1 text-sm text-gray-700">{text}</span>
                <span className="text-sm font-bold text-gray-900">{count}</span>
              </li>
            ))}
          </ul>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[60, 35, 80, 45].map((w, i) => (
              <div key={i} className="h-16 border border-gray-200 bg-gray-50" style={{ opacity: w / 100 }} />
            ))}
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-white/75 to-white" aria-hidden />
        <div className="relative flex justify-center px-3 py-8 sm:px-8 sm:py-12">
          <UnlockForm
            hidden={preview.locked.issues_hidden}
            includes={preview.locked.includes}
            onUnlock={onUnlock}
            unlocking={unlocking}
            error={unlockError}
          />
        </div>
      </div>

      <div className="text-center">
        <button
          type="button"
          onClick={onReset}
          className="text-sm font-medium text-gray-600 underline-offset-4 hover:text-accent hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Audit a different file
        </button>
      </div>
    </div>
  )
}

function UnlockForm({
  hidden,
  includes,
  onUnlock,
  unlocking,
  error,
}: {
  hidden: number
  includes: string[]
  onUnlock: (input: UnlockInput) => Promise<void>
  unlocking: boolean
  error: string | null
}) {
  const [email, setEmail] = useState('')
  const [storeUrl, setStoreUrl] = useState('')
  const [fullName, setFullName] = useState('')
  const [touched, setTouched] = useState(false)

  const emailOk = isValidEmail(email.trim())
  const storeOk = /^(https?:\/\/)?[a-z0-9.-]+\.[a-z]{2,}(\/.*)?$/i.test(storeUrl.trim())
  const inputClass =
    'w-full border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20'

  return (
    <form
      noValidate
      onSubmit={async (e) => {
        e.preventDefault()
        setTouched(true)
        if (!emailOk || !storeOk || unlocking) return
        await onUnlock({ email: email.trim(), storeUrl: storeUrl.trim(), fullName: fullName.trim() })
      }}
      className="w-full max-w-xl border border-gray-200 bg-white p-5 text-left shadow-lg sm:p-7"
    >
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-white">
          <LockIcon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-base font-bold text-gray-900 sm:text-lg">Unlock your full report</p>
          <p className="text-sm text-gray-600">
            {hidden > 0 ? `${hidden} more issue type${hidden === 1 ? '' : 's'}, ` : ''}every fix, and a live check of your store.
          </p>
        </div>
      </div>
      <ul className="mb-5 grid gap-1.5 sm:grid-cols-2">
        {includes.map((item) => (
          <li key={item} className="flex items-start gap-2 text-xs text-gray-700">
            <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
            {item}
          </li>
        ))}
      </ul>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-gray-700">Work email</span>
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@yourstore.com"
            className={inputClass}
            aria-invalid={touched && !emailOk}
          />
          {touched && !emailOk ? <span className="mt-1 block text-xs text-red-600">Enter a valid email.</span> : null}
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-gray-700">Store URL</span>
          <input
            type="text"
            inputMode="url"
            autoComplete="url"
            required
            value={storeUrl}
            onChange={(e) => setStoreUrl(e.target.value)}
            placeholder="yourstore.com"
            className={inputClass}
            aria-invalid={touched && !storeOk}
          />
          {touched && !storeOk ? <span className="mt-1 block text-xs text-red-600">Enter your store&apos;s domain.</span> : null}
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-xs font-semibold text-gray-700">
            Name <span className="font-normal text-gray-400">(optional)</span>
          </span>
          <input type="text" autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} />
        </label>
      </div>
      {error ? (
        <p role="alert" className="mt-3 border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={unlocking}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 border border-accent bg-accent px-6 py-3 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#070066] hover:shadow-md hover:shadow-accent/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:translate-y-0 disabled:cursor-wait disabled:opacity-80"
      >
        {unlocking ? (
          <>
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden>
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
              <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
            Checking your store and writing AI examples…
          </>
        ) : (
          'Unlock full report'
        )}
      </button>
      <p className="mt-3 text-[0.6875rem] leading-relaxed text-gray-500">
        We&apos;ll check your store&apos;s public pages and email you a link to this report. We never share your details.
      </p>
    </form>
  )
}
