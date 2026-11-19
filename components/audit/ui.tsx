'use client'

import { useEffect, useState } from 'react'
import type { ChannelKey, Severity } from '@/lib/audit/types'

export const SEVERITY_STYLE: Record<Severity | 'info', { label: string; badge: string; dot: string }> = {
  critical: { label: 'Critical', badge: 'border-red-200 bg-red-50 text-red-700', dot: 'bg-red-500' },
  high: { label: 'High', badge: 'border-orange-200 bg-orange-50 text-orange-700', dot: 'bg-orange-500' },
  medium: { label: 'Medium', badge: 'border-amber-200 bg-amber-50 text-amber-700', dot: 'bg-amber-400' },
  low: { label: 'Low', badge: 'border-gray-200 bg-gray-50 text-gray-600', dot: 'bg-gray-400' },
  info: { label: 'Info', badge: 'border-gray-200 bg-gray-50 text-gray-600', dot: 'bg-gray-300' },
}

export function scoreColor(score: number): string {
  if (score >= 90) return '#047857'
  if (score >= 75) return '#090088'
  if (score >= 50) return '#b45309'
  return '#b91c1c'
}

export function SeverityBadge({ severity }: { severity: Severity | 'info' }) {
  const s = SEVERITY_STYLE[severity]
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-[0.6875rem] font-semibold ${s.badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} aria-hidden />
      {s.label}
    </span>
  )
}

/** "Channel rule" = a published requirement; "Recommendation" = best practice no channel enforces. */
export function BasisBadge({ basis }: { basis: 'rule' | 'best_practice' }) {
  return basis === 'rule' ? (
    <span
      className="inline-flex shrink-0 items-center rounded-full border border-accent/30 bg-accent/[0.06] px-2 py-0.5 text-[0.6875rem] font-semibold text-accent"
      title="A published requirement of the channel"
    >
      Channel rule
    </span>
  ) : (
    <span
      className="inline-flex shrink-0 items-center rounded-full border border-gray-200 bg-white px-2 py-0.5 text-[0.6875rem] font-semibold text-gray-600"
      title="Best practice for AI shopping answers; no channel rejects products for this"
    >
      Recommendation
    </span>
  )
}

/** Animated score ring. Counts up on mount. */
export function ScoreRing({ score, size = 168, label }: { score: number; size?: number; label?: string }) {
  const [shown, setShown] = useState(0)
  useEffect(() => {
    const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      setShown(score)
      return
    }
    let frame = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 1100)
      setShown(Math.round(score * (1 - Math.pow(1 - t, 3))))
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [score])

  const stroke = 12
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const color = scoreColor(score)
  return (
    <div className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-gray-100" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - shown / 100)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold tabular-nums text-gray-900 sm:text-5xl" style={{ color }}>
          {shown}
        </span>
        <span className="text-xs font-medium text-gray-500">{label ?? 'out of 100'}</span>
      </div>
    </div>
  )
}

export function Bar({ pct, tone = 'accent' }: { pct: number; tone?: 'accent' | 'score' }) {
  const color = tone === 'score' ? scoreColor(pct) : '#090088'
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100" role="presentation">
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.max(2, Math.min(100, pct))}%`, backgroundColor: color }} />
    </div>
  )
}

export function ChannelIcon({ channel, className = 'h-5 w-5' }: { channel: ChannelKey; className?: string }) {
  if (channel === 'google') {
    return (
      <svg className={className} viewBox="0 0 24 24" aria-hidden>
        <path fill="#4285F4" d="M22.6 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2.1-1.9 3.3-4.8 3.3-8z" />
        <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.7c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.8A11 11 0 0 0 12 23z" />
        <path fill="#FBBC05" d="M5.8 14.2a6.6 6.6 0 0 1 0-4.3V7.1H2.1a11 11 0 0 0 0 9.9l3.7-2.8z" />
        <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 0 0 2.1 7.1l3.7 2.8C6.7 7.3 9.1 5.4 12 5.4z" />
      </svg>
    )
  }
  if (channel === 'chatgpt') {
    return (
      <svg className={className} viewBox="0 0 24 24" aria-hidden>
        <circle cx="12" cy="12" r="11" fill="#111827" />
        <path fill="none" stroke="#fff" strokeWidth="1.6" d="M12 5.5l5.6 3.25v6.5L12 18.5l-5.6-3.25v-6.5z" />
        <circle cx="12" cy="12" r="2" fill="#fff" />
      </svg>
    )
  }
  if (channel === 'bing') {
    return (
      <svg className={className} viewBox="0 0 24 24" aria-hidden>
        <rect x="2" y="2" width="9.5" height="9.5" fill="#F25022" />
        <rect x="12.5" y="2" width="9.5" height="9.5" fill="#7FBA00" />
        <rect x="2" y="12.5" width="9.5" height="9.5" fill="#00A4EF" />
        <rect x="12.5" y="12.5" width="9.5" height="9.5" fill="#FFB900" />
      </svg>
    )
  }
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="11" fill="#0866FF" />
      <path
        fill="none"
        stroke="#fff"
        strokeWidth="1.8"
        strokeLinecap="round"
        d="M5.5 15c1.3-4 2.6-6 3.9-6 2.2 0 3 6 5.2 6 1.3 0 2.6-2 3.9-6"
      />
    </svg>
  )
}

export function LockIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path strokeLinecap="round" d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  )
}

export function CheckIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}
