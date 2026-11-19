export type Severity = 'critical' | 'high' | 'medium' | 'low'
export type Basis = 'rule' | 'best_practice'
export type ChannelKey = 'google' | 'chatgpt' | 'bing' | 'meta'

export type Grade = { key: 'ready' | 'strong' | 'needs_work' | 'at_risk'; label: string }

export type AuditFileInfo = {
  name: string
  format: 'csv' | 'tsv' | 'xml'
  platform: { key: string; label: string }
  rows_in_file: number
  rows_in_file_capped: boolean
  rows_in_file_estimated?: boolean
  rows_analyzed: number
}

export type ChannelSummary = {
  key: ChannelKey
  label: string
  score: number
  grade: Grade
  eligible: number
  ineligible: number
}

export type IssueCounts = Record<Severity, number>

/** Everything an anonymous visitor may see. Built server-side by whitelisting. */
export type AuditPreview = {
  audit_id: string
  file: AuditFileInfo
  summary: {
    overall_score: number
    grade: Grade
    issue_counts: IssueCounts
    checks_failed: number
    checks_run: number
    products_with_issues: number
    completeness_pct: number
  }
  channels: ChannelSummary[]
  top_issues: { title: string; severity: Severity; affected: number; dimension_label: string; basis: Basis }[]
  locked: { issues_hidden: number; includes: string[] }
}

export type AuditIssue = {
  id: string
  title: string
  dimension: string
  dimension_label: string
  severity: Severity
  basis: Basis
  sources: { label: string; url: string }[]
  channel_severity: Record<ChannelKey, Severity | null>
  affected: number
  affected_pct: number
  why: string
  fix: string
  examples: { row: number; id: string | null; product: string; value: string | null }[]
}

export type StoreFinding = { severity: Severity | 'info'; title: string; detail: string }

export type StoreReport = {
  store_url: string
  reachable: boolean
  https: boolean
  platform_hint?: string
  error?: string
  robots?: {
    found: boolean
    crawlers: { agent: string; powers: string; allowed: boolean; severity: Severity | 'info' }[]
  }
  llms_txt?: { found: boolean }
  product_pages?: {
    row: number
    id: string | null
    title: string | null
    url: string
    status: string
    error?: string
    structured_data?: boolean
    feed_price?: string | null
    page_price?: string
    price_match?: boolean
    feed_availability?: string | null
    page_availability?: string
    availability_match?: boolean
    variant_ambiguous?: boolean
  }[]
  images?: {
    row: number
    title?: string | null
    url: string
    status: string
    error?: string
    width?: number
    height?: number
  }[]
  product_links_on_domain?: number
  findings: StoreFinding[]
}

export type AuditReport = {
  audit_id: string
  audit_version: string
  generated_at: string
  unlocked_at: string | null
  file: AuditFileInfo
  summary: AuditPreview['summary'] & { eligible_everywhere: number; rule_issue_types?: number; recommendation_issue_types?: number }
  channels: (ChannelSummary & { top_blockers: string[] })[]
  issues: AuditIssue[]
  coverage: { field: string; label: string; pct: number }[]
  products: {
    row: number
    id: string | null
    title: string
    scores: Record<ChannelKey, number>
    issues: string[]
    availability: string | null
  }[]
  notes: string[]
  methodology: { text: string }
  store: StoreReport | null
  ai_examples?: {
    status: 'ok' | 'none_passed' | 'not_needed' | 'unavailable'
    examples: AiRewriteExample[]
  } | null
}

export type AiRewriteExample = {
  row: number
  id: string | null
  before: { title: string; description: string }
  after: { title: string; description: string }
  fixed: string[]
  remaining: string[]
}
