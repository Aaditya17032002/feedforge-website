'use client'

import { useRef, useState } from 'react'
import { AUDIT_FORMATS } from '@/lib/content/audit'
import { CheckIcon } from '@/components/audit/ui'

const ACCEPT = '.csv,.tsv,.txt,.xml,text/csv,text/tab-separated-values,application/xml,text/xml'

type Props = {
  onFile: (file: File) => void
  error: string | null
}

export function validateFile(file: File): string | null {
  if (!/\.(csv|tsv|txt|xml)$/i.test(file.name)) return 'Upload a CSV, TSV or XML file.'
  if (file.size === 0) return 'The file is empty.'
  return null
}

export default function UploadPanel({ onFile, error }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  const pick = (file: File | undefined | null) => {
    if (!file) return
    const problem = validateFile(file)
    setLocalError(problem)
    if (!problem) onFile(file)
  }

  const shownError = localError || error

  return (
    <div className="border border-accent/25 bg-gradient-to-br from-accent/[0.06] via-white to-accent/[0.03] p-4 shadow-sm sm:p-8">
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload a product feed file"
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
          pick(e.dataTransfer.files?.[0])
        }}
        className={`flex cursor-pointer flex-col items-center justify-center border-2 border-dashed px-6 py-12 text-center transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 sm:py-16 ${
          dragging ? 'scale-[1.01] border-accent bg-accent/[0.06]' : 'border-gray-300 bg-white hover:border-accent/60 hover:bg-accent/[0.02]'
        }`}
      >
        <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-accent">
          <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0l-4 4m4-4l4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
          </svg>
        </span>
        <p className="text-base font-bold text-gray-900 sm:text-lg">Drop your product feed here</p>
        <p className="mt-1 text-sm text-gray-600">
          or <span className="font-semibold text-accent underline underline-offset-4">browse your files</span>
        </p>
        <p className="mt-4 text-xs text-gray-500">CSV, TSV or XML · any size · the first 100 products are audited</p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="sr-only"
          onChange={(e) => {
            pick(e.target.files?.[0])
            e.target.value = ''
          }}
        />
      </div>

      {shownError ? (
        <p role="alert" className="mt-4 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {shownError}
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        {AUDIT_FORMATS.map((f) => (
          <span key={f} className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-700">
            <CheckIcon className="h-3 w-3 text-accent" />
            {f}
          </span>
        ))}
      </div>
      <p className="mt-4 text-center text-xs text-gray-500">
        Your file is read once to run the checks and isn&apos;t stored. No account needed.
      </p>
    </div>
  )
}
