/**
 * Carries a feed file dropped anywhere on the site (home page section, popup) to
 * the audit page, which starts analyzing it right away. Client-side navigation
 * keeps this module in memory, so the File object never leaves the browser tab.
 */
let pending: File | null = null

/** Set once a visitor has unlocked a report, so the site popup stops asking. */
export const AUDIT_DONE_KEY = 'ff_audit_done'

export function setPendingAuditFile(file: File) {
  pending = file
}

export function hasPendingAuditFile() {
  return pending !== null
}

export function takePendingAuditFile(): File | null {
  const file = pending
  pending = null
  return file
}
