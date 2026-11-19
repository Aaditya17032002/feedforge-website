'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { AuditPreview, AuditReport } from '@/lib/audit/types'
import { GA_EVENTS, trackEvent, trackLead } from '@/lib/analytics/gtag'
import AnalyzingPanel from '@/components/audit/AnalyzingPanel'
import FullReport from '@/components/audit/FullReport'
import PreviewPanel from '@/components/audit/PreviewPanel'
import UploadPanel from '@/components/audit/UploadPanel'
import { AUDIT_DONE_KEY, hasPendingAuditFile, takePendingAuditFile } from '@/lib/audit/handoff'

type Stage =
  | { kind: 'upload' }
  | { kind: 'analyzing'; fileName: string }
  | { kind: 'preview'; preview: AuditPreview }
  | { kind: 'report'; report: AuditReport; emailedTo?: string }

const SESSION_KEY = 'ff_audit_session_v1'
/** Large feeds: upload only the start. The audit needs the first 100 products, and the server estimates the total. */
const UPLOAD_SLICE_BYTES = 8 * 1024 * 1024
type Saved = { auditId: string; token?: string; preview?: AuditPreview }

function readSaved(): Saved | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as Saved) : null
  } catch {
    return null
  }
}

function writeSaved(value: Saved | null) {
  try {
    if (value) sessionStorage.setItem(SESSION_KEY, JSON.stringify(value))
    else sessionStorage.removeItem(SESSION_KEY)
  } catch {
    /* storage unavailable: the tool still works, it just won't survive a refresh */
  }
}

async function readJson(res: Response): Promise<Record<string, unknown>> {
  try {
    return (await res.json()) as Record<string, unknown>
  } catch {
    return {}
  }
}

export default function AuditTool() {
  const [stage, setStage] = useState<Stage>({ kind: 'upload' })
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [unlocking, setUnlocking] = useState(false)
  const [unlockError, setUnlockError] = useState<string | null>(null)
  const topRef = useRef<HTMLDivElement>(null)

  const scrollTop = () => topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  // Open a report from the emailed link (?report=<id>&t=<token>), or restore after a refresh.
  useEffect(() => {
    const loadReport = (auditId: string, token: string, fromLink: boolean) =>
      fetch(`/api/audit/${auditId}/report`, { headers: { 'x-audit-token': token }, cache: 'no-store' })
        .then(async (res) => {
          const body = await readJson(res)
          if (res.ok && body.report) {
            writeSaved({ auditId, token })
            setStage({ kind: 'report', report: body.report as AuditReport })
          } else {
            writeSaved(null)
            if (fromLink) setUploadError('That report link has expired or is invalid. Upload your feed to run a new audit.')
          }
        })
        .catch(() => undefined)

    const params = new URLSearchParams(window.location.search)
    const linkId = params.get('report')
    const linkToken = params.get('t')
    if (linkId && linkToken && /^[0-9a-f-]{36}$/i.test(linkId)) {
      // Keep the token out of the address bar, history and analytics.
      window.history.replaceState(null, '', window.location.pathname)
      loadReport(linkId, linkToken, true)
      return
    }

    // A file dropped on another page starts a fresh audit instead of restoring the old one.
    if (hasPendingAuditFile()) return
    const saved = readSaved()
    if (!saved?.auditId) return
    if (saved.token) {
      loadReport(saved.auditId, saved.token, false)
    } else if (saved.preview) {
      setStage({ kind: 'preview', preview: saved.preview })
    }
  }, [])

  const analyze = useCallback(async (file: File) => {
    setUploadError(null)
    setStage({ kind: 'analyzing', fileName: file.name })
    trackEvent(GA_EVENTS.AUDIT_UPLOAD, { file_type: file.name.split('.').pop()?.toLowerCase(), size_kb: Math.round(file.size / 1024) })
    const started = Date.now()
    try {
      const form = new FormData()
      const blob = file.size > UPLOAD_SLICE_BYTES ? file.slice(0, UPLOAD_SLICE_BYTES) : file
      form.append('file', blob, file.name)
      form.append('original_size', String(file.size))
      const res = await fetch('/api/audit', { method: 'POST', body: form })
      const body = await readJson(res)
      // Let the progress animation breathe so results don't flash.
      const wait = Math.max(0, 2200 - (Date.now() - started))
      await new Promise((r) => setTimeout(r, wait))
      if (!res.ok || !body.preview) {
        const message = typeof body.message === 'string' ? body.message : 'The audit couldn’t run. Please try again.'
        trackEvent(GA_EVENTS.AUDIT_ERROR, { stage: 'analyze', status: res.status })
        setUploadError(message)
        setStage({ kind: 'upload' })
        return
      }
      const preview = body.preview as AuditPreview
      writeSaved({ auditId: preview.audit_id, preview })
      trackEvent(GA_EVENTS.AUDIT_PREVIEW_SHOWN, { score: preview.summary.overall_score, platform: preview.file.platform.key })
      setStage({ kind: 'preview', preview })
      scrollTop()
    } catch {
      trackEvent(GA_EVENTS.AUDIT_ERROR, { stage: 'analyze', status: 0 })
      setUploadError('We couldn’t reach the audit service. Check your connection and try again.')
      setStage({ kind: 'upload' })
    }
  }, [])

  useEffect(() => {
    const file = takePendingAuditFile()
    if (file) analyze(file)
  }, [analyze])

  const unlock = useCallback(
    async (input: { email: string; storeUrl: string; fullName: string }) => {
      if (stage.kind !== 'preview') return
      setUnlocking(true)
      setUnlockError(null)
      try {
        const res = await fetch(`/api/audit/${stage.preview.audit_id}/unlock`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        })
        const body = await readJson(res)
        if (!res.ok || !body.report || typeof body.token !== 'string') {
          trackEvent(GA_EVENTS.AUDIT_ERROR, { stage: 'unlock', status: res.status })
          setUnlockError(typeof body.message === 'string' ? body.message : 'We couldn’t unlock the report. Please try again.')
          return
        }
        writeSaved({ auditId: stage.preview.audit_id, token: body.token })
        trackLead('audit', 'audit_tool')
        try {
          localStorage.setItem(AUDIT_DONE_KEY, '1')
        } catch {
          /* only stops the site popup from asking again */
        }
        setStage({ kind: 'report', report: body.report as AuditReport, emailedTo: body.emailed ? input.email : undefined })
        scrollTop()
      } catch {
        setUnlockError('We couldn’t reach the audit service. Please try again.')
      } finally {
        setUnlocking(false)
      }
    },
    [stage]
  )

  const reset = useCallback(() => {
    writeSaved(null)
    setUploadError(null)
    setUnlockError(null)
    setStage({ kind: 'upload' })
    scrollTop()
  }, [])

  return (
    <div ref={topRef} className="scroll-mt-24">
      {stage.kind === 'upload' ? <UploadPanel onFile={analyze} error={uploadError} /> : null}
      {stage.kind === 'analyzing' ? <AnalyzingPanel fileName={stage.fileName} /> : null}
      {stage.kind === 'preview' ? (
        <PreviewPanel preview={stage.preview} onUnlock={unlock} unlocking={unlocking} unlockError={unlockError} onReset={reset} />
      ) : null}
      {stage.kind === 'report' ? <FullReport report={stage.report} emailedTo={stage.emailedTo} onReset={reset} /> : null}
    </div>
  )
}
