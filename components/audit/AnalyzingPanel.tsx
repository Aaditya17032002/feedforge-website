'use client'

import { useEffect, useState } from 'react'
import { CheckIcon } from '@/components/audit/ui'

const STEPS = [
  'Reading your file',
  'Recognizing the feed format',
  'Checking Google Shopping & AI Mode rules',
  'Checking ChatGPT product feed rules',
  'Checking Microsoft Bing & Copilot and Meta rules',
  'Scoring titles, descriptions and attributes',
  'Calculating your AI Readiness Score',
]

export default function AnalyzingPanel({ fileName }: { fileName: string }) {
  const [step, setStep] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 650)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="border border-gray-200 bg-white p-6 shadow-sm sm:p-10" aria-live="polite">
      <div className="mx-auto max-w-lg">
        <div className="mb-6 flex items-center gap-4">
          <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent/10">
            <span className="absolute inset-0 animate-ping rounded-full bg-accent/20" aria-hidden />
            <svg className="h-6 w-6 animate-spin text-accent" fill="none" viewBox="0 0 24 24" aria-hidden>
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
              <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </span>
          <div className="min-w-0">
            <p className="text-lg font-bold text-gray-900">Auditing your catalog</p>
            <p className="truncate text-sm text-gray-500">{fileName}</p>
          </div>
        </div>
        <ol className="space-y-3">
          {STEPS.map((label, i) => {
            const done = i < step
            const active = i === step
            return (
              <li key={label} className={`flex items-center gap-3 text-sm transition-opacity ${i > step ? 'opacity-40' : 'opacity-100'}`}>
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                    done ? 'border-accent bg-accent text-white' : active ? 'border-accent text-accent' : 'border-gray-300 text-transparent'
                  }`}
                >
                  {done ? <CheckIcon className="h-3 w-3" /> : active ? <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" /> : null}
                </span>
                <span className={done || active ? 'font-medium text-gray-900' : 'text-gray-500'}>{label}</span>
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}
