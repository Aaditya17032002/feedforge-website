'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import type { AuditIssue, AuditReport, ChannelKey, Severity, StoreReport } from '@/lib/audit/types'
import { AUDIT_CHANNEL_INFO } from '@/lib/content/audit'
import { CONTACT_PAGE_HREF } from '@/lib/content/contact'
import { SIGNUP_URL } from '@/lib/shared/app-urls'
import { GA_EVENTS, trackEvent } from '@/lib/analytics/gtag'
import { Bar, BasisBadge, ChannelIcon, CheckIcon, ScoreRing, SeverityBadge, SEVERITY_STYLE, scoreColor } from '@/components/audit/ui'

const CHANNEL_ORDER: ChannelKey[] = ['google', 'chatgpt', 'bing', 'meta']
const SECTIONS = [
  ['overview', 'Overview'],
  ['channels', 'Channels'],
  ['issues', 'Issues & fixes'],
  ['store', 'Live store check'],
  ['completeness', 'Data completeness'],
  ['ai-rewrites', 'AI rewrites'],
  ['products', 'Products'],
  ['method', 'How we score'],
] as const

function Section({ id, title, subtitle, children }: { id: string; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-28 border border-gray-200 bg-white p-5 shadow-sm sm:p-7 print:break-inside-avoid print:shadow-none">
      <div className="mb-5">
        <h2 className="text-lg font-bold text-gray-900 sm:text-xl">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-gray-600">{subtitle}</p> : null}
      </div>
      {children}
    </section>
  )
}

export default function FullReport({
  report,
  emailedTo,
  onReset,
}: {
  report: AuditReport
  emailedTo?: string
  onReset: () => void
}) {
  const { summary, file } = report
  const issueTitles = useMemo(() => Object.fromEntries(report.issues.map((i) => [i.id, i])), [report.issues])

  return (
    <div className="space-y-6">
      {emailedTo ? (
        <p className="flex items-center gap-2 border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 print:hidden">
          <CheckIcon className="h-4 w-4 shrink-0" />
          <span>
            We&apos;ve emailed a link to this report to <strong>{emailedTo}</strong>. Use it to reopen the report on any device.
          </span>
        </p>
      ) : null}
      {/* Sub navigation */}
      <nav
        aria-label="Report sections"
        className="sticky top-16 z-10 -mx-1 flex gap-1 overflow-x-auto border border-gray-200 bg-white/95 px-1 py-1 shadow-sm backdrop-blur print:hidden"
      >
        {SECTIONS.map(([id, label]) => (
          <a key={id} href={`#${id}`} className="shrink-0 px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-100 hover:text-accent">
            {label}
          </a>
        ))}
        <button
          type="button"
          onClick={() => {
            trackEvent(GA_EVENTS.AUDIT_REPORT_PRINT)
            window.print()
          }}
          className="ml-auto shrink-0 border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-900 transition-colors hover:border-accent hover:text-accent"
        >
          Save as PDF
        </button>
      </nav>

      {/* Overview */}
      <Section id="overview" title="Overview">
        <div className="flex flex-col items-center gap-8 md:flex-row">
          <ScoreRing score={summary.overall_score} label="AI Readiness" />
          <div className="min-w-0 flex-1">
            <p className="text-2xl font-bold" style={{ color: scoreColor(summary.overall_score) }}>
              {summary.grade.label}
            </p>
            <p className="mt-1 text-sm text-gray-600">
              {file.name} · {file.platform.label} · {file.rows_analyzed} of {file.rows_in_file_estimated ? 'about ' : ''}
              {file.rows_in_file.toLocaleString()}
              {file.rows_in_file_capped ? '+' : ''} products audited
            </p>
            <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Eligible on every channel" value={`${summary.eligible_everywhere}/${file.rows_analyzed}`} />
              <Stat label="Products with issues" value={`${summary.products_with_issues}`} />
              <Stat label="Data completeness" value={`${summary.completeness_pct}%`} />
              <Stat label="Checks failed" value={`${summary.checks_failed}/${summary.checks_run}`} />
            </dl>
            {summary.rule_issue_types !== undefined ? (
              <p className="mt-3 text-xs text-gray-600">
                <span className="font-semibold text-gray-900">{summary.rule_issue_types}</span> issue types break a published channel
                rule · <span className="font-semibold text-gray-900">{summary.recommendation_issue_types}</span> are recommendations
              </p>
            ) : null}
          </div>
        </div>
        {report.notes.length ? (
          <ul className="mt-6 space-y-2">
            {report.notes.map((note) => (
              <li key={note} className="border-l-2 border-accent bg-accent/[0.04] px-3 py-2 text-sm text-gray-700">
                {note}
              </li>
            ))}
          </ul>
        ) : null}
      </Section>

      {/* Channels */}
      <Section id="channels" title="Readiness by channel" subtitle="Eligible products have no issue that would get them rejected on that channel.">
        <div className="grid gap-4 md:grid-cols-2">
          {CHANNEL_ORDER.map((key) => {
            const c = report.channels.find((x) => x.key === key)
            if (!c) return null
            const total = c.eligible + c.ineligible
            return (
              <div key={key} className="border border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <ChannelIcon channel={key} className="h-6 w-6" />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900">{c.label}</p>
                    <p className="text-xs text-gray-500">{AUDIT_CHANNEL_INFO[key]?.detail}</p>
                  </div>
                  <span className="ml-auto text-2xl font-bold tabular-nums" style={{ color: scoreColor(c.score) }}>
                    {c.score}
                  </span>
                </div>
                <div className="mt-3">
                  <Bar pct={c.score} tone="score" />
                </div>
                <p className="mt-3 text-sm text-gray-700">
                  <span className="font-bold text-gray-900">{c.eligible}</span> of {total} products eligible
                  {c.ineligible ? <span className="text-red-700"> · {c.ineligible} would be rejected</span> : null}
                </p>
                {c.top_blockers.length ? (
                  <p className="mt-2 text-xs text-gray-600">
                    <span className="font-semibold text-gray-900">Main blockers:</span> {c.top_blockers.join(' · ')}
                  </p>
                ) : null}
              </div>
            )
          })}
        </div>
      </Section>

      {/* Issues */}
      <IssuesSection issues={report.issues} total={file.rows_analyzed} />

      {/* Store */}
      <StoreSection store={report.store} />

      {/* Completeness */}
      <Section
        id="completeness"
        title="Data completeness"
        subtitle="Share of audited products that carry each attribute. AI assistants answer shoppers' questions from these fields."
      >
        <div className="grid gap-x-8 gap-y-3 md:grid-cols-2">
          {report.coverage.map((c) => (
            <div key={c.field}>
              <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
                <span className="text-gray-700">{c.label}</span>
                <span className="font-bold tabular-nums text-gray-900">{c.pct}%</span>
              </div>
              <Bar pct={c.pct} tone="score" />
            </div>
          ))}
        </div>
      </Section>

      {/* AI rewrites (after the quality / completeness section) */}
      <AiRewritesSection data={report.ai_examples} />

      {/* Products */}
      <Section id="products" title="Products" subtitle="Each audited product, its status on every channel, and its most serious issues.">
        <ProductTable report={report} issueTitles={issueTitles} />
      </Section>

      {/* Method */}
      <Section id="method" title="How we score">
        <p className="text-sm leading-relaxed text-gray-700">{report.methodology.text}</p>
        <p className="mt-3 text-xs text-gray-500">
          Audit version {report.audit_version} · generated {new Date(report.generated_at).toLocaleString()}. Channel rules change often; we
          update the checks as platforms publish changes.
        </p>
      </Section>

      {/* CTA */}
      <div className="overflow-hidden rounded-xl border border-accent/25 bg-gradient-to-br from-accent/[0.08] via-white to-accent/[0.04] px-6 py-10 text-center shadow-sm print:hidden sm:px-10">
        <h2 className="text-balance text-2xl font-bold text-gray-900 sm:text-3xl">
          Fix these automatically and <span className="text-accent">keep them fixed.</span>
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-gray-600 lg:text-base">
          FeedForge connects to your store, repairs titles, attributes and categories, validates every product against each channel, and
          sends clean feeds to Google, ChatGPT, Microsoft and Meta on a schedule, with proof of what each channel accepted.
        </p>
        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href={SIGNUP_URL}
            onClick={() => trackEvent(GA_EVENTS.SIGN_UP_CLICK, { location: 'audit_report' })}
            className="inline-flex items-center justify-center border border-accent bg-accent px-8 py-3 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#070066] hover:shadow-md hover:shadow-accent/25"
          >
            Start free
          </a>
          <Link
            href={CONTACT_PAGE_HREF}
            className="inline-flex items-center justify-center border border-gray-300 bg-white px-8 py-3 text-sm font-semibold text-gray-900 transition-all duration-300 hover:-translate-y-0.5 hover:border-accent hover:text-accent"
          >
            Talk to us about your report
          </Link>
        </div>
      </div>

      <div className="text-center print:hidden">
        <button type="button" onClick={onReset} className="text-sm font-medium text-gray-600 underline-offset-4 hover:text-accent hover:underline">
          Audit another file
        </button>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-gray-200 bg-gray-50 px-3 py-2.5">
      <dt className="text-[0.6875rem] font-medium text-gray-500">{label}</dt>
      <dd className="mt-0.5 text-lg font-bold tabular-nums text-gray-900">{value}</dd>
    </div>
  )
}

function IssuesSection({ issues, total }: { issues: AuditIssue[]; total: number }) {
  const [severity, setSeverity] = useState<Severity | 'all'>('all')
  const [channel, setChannel] = useState<ChannelKey | 'all'>('all')
  const [basis, setBasis] = useState<'all' | 'rule' | 'best_practice'>('all')
  const [open, setOpen] = useState<string | null>(issues[0]?.id ?? null)

  const filtered = issues.filter(
    (i) =>
      (severity === 'all' || i.severity === severity) &&
      (channel === 'all' || i.channel_severity[channel]) &&
      (basis === 'all' || i.basis === basis)
  )
  const ruleCount = issues.filter((i) => i.basis === 'rule').length
  const chip = (active: boolean) =>
    `shrink-0 border px-3 py-1 text-xs font-semibold transition-colors ${
      active ? 'border-accent bg-accent text-white' : 'border-gray-300 bg-white text-gray-700 hover:border-accent hover:text-accent'
    }`

  return (
    <Section
      id="issues"
      title="Issues & how to fix them"
      subtitle={`${issues.length} issue types found: ${ruleCount} break a published channel rule, ${issues.length - ruleCount} are recommendations. Sorted by severity and reach.`}
    >
      <div className="mb-4 flex flex-wrap gap-2 print:hidden">
        {(
          [
            ['all', 'Rules & recommendations'],
            ['rule', 'Channel rules'],
            ['best_practice', 'Recommendations'],
          ] as const
        ).map(([key, label]) => (
          <button key={key} type="button" className={chip(basis === key)} onClick={() => setBasis(key)}>
            {label}
          </button>
        ))}
        <span className="mx-1 hidden w-px bg-gray-200 sm:block" aria-hidden />
        {(['all', 'critical', 'high', 'medium', 'low'] as const).map((s) => (
          <button key={s} type="button" className={chip(severity === s)} onClick={() => setSeverity(s)}>
            {s === 'all' ? 'All severities' : SEVERITY_STYLE[s].label}
          </button>
        ))}
        <span className="mx-1 hidden w-px bg-gray-200 sm:block" aria-hidden />
        {(['all', ...CHANNEL_ORDER] as const).map((c) => (
          <button key={c} type="button" className={chip(channel === c)} onClick={() => setChannel(c)}>
            {c === 'all' ? 'All channels' : AUDIT_CHANNEL_INFO[c].short}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="flex items-center gap-2 text-sm text-gray-700">
          <CheckIcon className="h-4 w-4 text-emerald-600" /> Nothing to fix for this filter.
        </p>
      ) : (
        <ul className="divide-y divide-gray-100 border border-gray-200">
          {filtered.map((issue) => {
            const isOpen = open === issue.id
            return (
              <li key={issue.id}>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : issue.id)}
                  className="flex w-full flex-wrap items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-gray-50"
                >
                  <SeverityBadge severity={issue.severity} />
                  <BasisBadge basis={issue.basis} />
                  <span className="min-w-0 flex-1 text-sm font-semibold text-gray-900">{issue.title}</span>
                  <span className="hidden text-xs text-gray-500 md:inline">{issue.dimension_label}</span>
                  <span className="text-sm font-bold tabular-nums text-gray-900">
                    {issue.affected}
                    <span className="font-normal text-gray-500">/{total}</span>
                  </span>
                  <svg className={`h-4 w-4 text-gray-400 transition-transform print:hidden ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className={`${isOpen ? 'block' : 'hidden'} space-y-4 bg-gray-50/60 px-4 pb-5 pt-1 print:block`}>
                  <div className="flex flex-wrap gap-2">
                    {CHANNEL_ORDER.map((c) => {
                      const sev = issue.channel_severity[c]
                      return sev ? (
                        <span key={c} className="inline-flex items-center gap-1.5 border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700">
                          <ChannelIcon channel={c} className="h-3.5 w-3.5" />
                          {AUDIT_CHANNEL_INFO[c].short}:{' '}
                          <span className={`font-semibold ${sev === 'critical' ? 'text-red-700' : ''}`}>
                            {sev === 'critical' ? 'Rejected' : SEVERITY_STYLE[sev].label}
                          </span>
                        </span>
                      ) : null
                    })}
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Why it matters</p>
                      <p className="mt-1 text-sm leading-relaxed text-gray-700">{issue.why}</p>
                      {issue.sources?.length ? (
                        <p className="mt-2 text-xs text-gray-500">
                          Source:{' '}
                          {issue.sources.map((s, idx) => (
                            <span key={s.url}>
                              {idx > 0 ? ' · ' : ''}
                              <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-accent">
                                {s.label}
                              </a>
                            </span>
                          ))}
                        </p>
                      ) : (
                        <p className="mt-2 text-xs text-gray-500">Best practice for AI shopping answers. No channel rejects products for this.</p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-accent">How to fix</p>
                      <p className="mt-1 text-sm leading-relaxed text-gray-700">{issue.fix}</p>
                    </div>
                  </div>
                  {issue.examples.length ? (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[480px] border border-gray-200 bg-white text-left text-xs">
                        <thead className="bg-gray-50 text-gray-500">
                          <tr>
                            <th className="px-3 py-2 font-semibold">Row</th>
                            <th className="px-3 py-2 font-semibold">Product</th>
                            <th className="px-3 py-2 font-semibold">Found</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {issue.examples.map((ex) => (
                            <tr key={`${issue.id}-${ex.row}`}>
                              <td className="px-3 py-2 tabular-nums text-gray-500">{ex.row}</td>
                              <td className="px-3 py-2 text-gray-900">
                                {ex.product}
                                {ex.id ? <span className="block text-gray-500">ID {ex.id}</span> : null}
                              </td>
                              <td className="break-all px-3 py-2 font-mono text-gray-700">{ex.value ?? '(empty)'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {issue.affected > issue.examples.length ? (
                        <p className="mt-2 text-xs text-gray-500">
                          Showing {issue.examples.length} of {issue.affected} affected products.
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </Section>
  )
}

function StoreSection({ store }: { store: StoreReport | null }) {
  if (!store) {
    return (
      <Section id="store" title="Live store check">
        <p className="text-sm text-gray-600">The live store check didn&apos;t run for this report.</p>
      </Section>
    )
  }
  const findings = store.findings ?? []
  const pages = store.product_pages ?? []
  return (
    <Section
      id="store"
      title="Live store check"
      subtitle={`${store.store_url}${store.platform_hint ? ` · ${store.platform_hint}` : ''}`}
    >
      {findings.length === 0 ? (
        <p className="flex items-center gap-2 border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckIcon className="h-4 w-4" /> No problems found on your store&apos;s public pages.
        </p>
      ) : (
        <ul className="space-y-2">
          {findings.map((f) => (
            <li key={f.title} className="flex flex-col gap-1 border border-gray-200 px-4 py-3 sm:flex-row sm:items-start sm:gap-3">
              <SeverityBadge severity={f.severity} />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900">{f.title}</p>
                <p className="mt-0.5 break-words text-sm text-gray-600">{f.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {store.robots?.crawlers?.length ? (
        <div className="mt-6">
          <h3 className="mb-2 text-sm font-bold text-gray-900">
            AI crawler access {store.robots.found ? '(from robots.txt)' : '(no robots.txt, so all crawlers are allowed)'}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] border border-gray-200 text-left text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="px-3 py-2 font-semibold">Crawler</th>
                  <th className="px-3 py-2 font-semibold">What it powers</th>
                  <th className="px-3 py-2 font-semibold">Access</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {store.robots.crawlers.map((c) => (
                  <tr key={c.agent}>
                    <td className="px-3 py-2 font-mono text-xs text-gray-900">{c.agent}</td>
                    <td className="px-3 py-2 text-gray-700">{c.powers}</td>
                    <td className="px-3 py-2">
                      {c.allowed ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                          <CheckIcon className="h-3.5 w-3.5" /> Allowed
                        </span>
                      ) : (
                        <span className={`text-xs font-semibold ${c.severity === 'info' ? 'text-gray-600' : 'text-red-700'}`}>Blocked</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            llms.txt: {store.llms_txt?.found ? 'found' : 'not found'}. Few AI systems read llms.txt today, so it doesn&apos;t affect your score.
          </p>
        </div>
      ) : null}

      {pages.length ? (
        <div className="mt-6">
          <h3 className="mb-2 text-sm font-bold text-gray-900">Feed vs. live product page</h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border border-gray-200 text-left text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="px-3 py-2 font-semibold">Product</th>
                  <th className="px-3 py-2 font-semibold">Price (feed → page)</th>
                  <th className="px-3 py-2 font-semibold">Stock (feed → page)</th>
                  <th className="px-3 py-2 font-semibold">Structured data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pages.map((p) => (
                  <tr key={p.row}>
                    <td className="max-w-[240px] px-3 py-2">
                      <a href={p.url} target="_blank" rel="noopener noreferrer nofollow" className="line-clamp-2 text-gray-900 hover:text-accent hover:underline">
                        {p.title || p.url}
                      </a>
                      {p.status !== 'checked' ? <span className="block text-xs text-red-700">{p.error || p.status}</span> : null}
                    </td>
                    <MatchCell from={p.feed_price} to={p.page_price} match={p.price_match} possible={p.variant_ambiguous} />
                    <MatchCell from={p.feed_availability} to={p.page_availability} match={p.availability_match} />
                    <td className="px-3 py-2 text-xs">
                      {p.status === 'checked' ? (p.structured_data ? <span className="text-emerald-700">Found</span> : <span className="text-amber-700">Missing</span>) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {store.images?.length ? <ImageChecks images={store.images} /> : null}
    </Section>
  )
}

function AiRewritesSection({ data }: { data: AuditReport['ai_examples'] }) {
  const examples = data?.examples ?? []
  if (examples.length === 0) {
    const message =
      data?.status === 'not_needed'
        ? 'Your titles and descriptions passed our content checks, so there was nothing to rewrite.'
        : 'AI rewrite examples weren’t available for this report. Ask us for a guided audit to see them on your products.'
    return (
      <Section id="ai-rewrites" title="AI rewrite preview">
        <p className="text-sm text-gray-600">{message}</p>
      </Section>
    )
  }
  return (
    <Section
      id="ai-rewrites"
      title="AI rewrite preview"
      subtitle="Your weakest titles and descriptions, rewritten by AI using only the facts already in your feed. Each rewrite was checked: no invented numbers, no promotional language, brand kept, under 150 characters."
    >
      <div className="space-y-5">
        {examples.map((ex) => (
          <article key={ex.row} className="border border-gray-200">
            <header className="flex flex-wrap items-center gap-2 border-b border-gray-200 bg-gray-50 px-4 py-2.5">
              <span className="text-xs font-semibold text-gray-500">
                Row {ex.row}
                {ex.id ? ` · ID ${ex.id}` : ''}
              </span>
              <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                <CheckIcon className="h-3 w-3" />
                Fixes {ex.fixed.length} issue{ex.fixed.length === 1 ? '' : 's'}
              </span>
            </header>
            <div className="grid md:grid-cols-2">
              <div className="border-b border-gray-200 p-4 md:border-b-0 md:border-r">
                <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-gray-400">Now</p>
                <p className="mt-1.5 text-sm font-semibold text-gray-900">{ex.before.title || '(no title)'}</p>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-gray-600">{ex.before.description || '(no description)'}</p>
              </div>
              <div className="bg-accent/[0.03] p-4">
                <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-accent">With FeedForge</p>
                <p className="mt-1.5 text-sm font-semibold text-gray-900">{ex.after.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-gray-700">{ex.after.description}</p>
              </div>
            </div>
            <footer className="flex flex-wrap gap-1.5 border-t border-gray-200 px-4 py-3">
              {ex.fixed.map((title) => (
                <span key={title} className="inline-flex items-center gap-1 border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs text-emerald-800">
                  <CheckIcon className="h-3 w-3" />
                  {title}
                </span>
              ))}
              {ex.remaining.map((title) => (
                <span key={title} className="border border-gray-200 bg-white px-2 py-0.5 text-xs text-gray-600">
                  Still to fix: {title}
                </span>
              ))}
            </footer>
          </article>
        ))}
      </div>
      <p className="mt-4 text-xs text-gray-500">
        AI-generated from your product data. In FeedForge you review and accept rewrites before they go to your channels.
      </p>
    </Section>
  )
}

function MatchCell({ from, to, match, possible }: { from?: string | null; to?: string; match?: boolean; possible?: boolean }) {
  if (to === undefined || match === undefined) {
    return <td className="px-3 py-2 text-xs text-gray-500">{from ?? '—'} → not shown on page</td>
  }
  const tone = match ? 'text-emerald-700' : possible ? 'text-amber-700' : 'text-red-700'
  return (
    <td className={`px-3 py-2 text-xs font-medium ${tone}`}>
      {from ?? '—'} → {to} {match ? '✓' : possible ? '(may be another variant)' : '✗'}
    </td>
  )
}

function ImageChecks({ images }: { images: NonNullable<StoreReport['images']> }) {
  const label = (i: (typeof images)[number]) => {
    if (i.status === 'ok') {
      if (i.width && i.height) {
        const small = Math.min(i.width, i.height) < 500
        return (
          <span className={small ? 'font-medium text-amber-700' : 'text-emerald-700'}>
            {i.width} × {i.height} px{small ? ' (below 500 × 500)' : ' ✓'}
          </span>
        )
      }
      return <span className="text-emerald-700">Loads ✓</span>
    }
    if (i.status === 'blocked') return <span className="text-gray-600">Blocked our crawler</span>
    if (i.status === 'skipped') return <span className="text-gray-500">Not checked</span>
    return <span className="font-medium text-red-700">{i.error || "Doesn't load"}</span>
  }
  return (
    <div className="mt-6">
      <h3 className="mb-2 text-sm font-bold text-gray-900">Product images</h3>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] border border-gray-200 text-left text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500">
            <tr>
              <th className="px-3 py-2 font-semibold">Product</th>
              <th className="px-3 py-2 font-semibold">Image</th>
              <th className="px-3 py-2 font-semibold">Result</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {images.map((i) => (
              <tr key={`${i.row}-${i.url}`}>
                <td className="max-w-[220px] px-3 py-2 text-gray-900">
                  <span className="line-clamp-2">{i.title || `Row ${i.row}`}</span>
                </td>
                <td className="max-w-[260px] px-3 py-2">
                  <a href={i.url} target="_blank" rel="noopener noreferrer nofollow" className="block truncate text-xs text-gray-600 hover:text-accent hover:underline">
                    {i.url}
                  </a>
                </td>
                <td className="px-3 py-2 text-xs">{label(i)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-gray-500">Google requires images of at least 500 × 500 px from 31 January 2027.</p>
    </div>
  )
}

function ProductTable({ report, issueTitles }: { report: AuditReport; issueTitles: Record<string, AuditIssue> }) {
  const [showAll, setShowAll] = useState(false)
  const rows = showAll ? report.products : report.products.slice(0, 25)
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border border-gray-200 text-left text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500">
            <tr>
              <th className="px-3 py-2 font-semibold">Row</th>
              <th className="px-3 py-2 font-semibold">Product</th>
              {CHANNEL_ORDER.map((c) => (
                <th key={c} className="px-2 py-2 text-center font-semibold">
                  <span className="inline-flex items-center gap-1">
                    <ChannelIcon channel={c} className="h-3.5 w-3.5" />
                    {AUDIT_CHANNEL_INFO[c].short}
                  </span>
                </th>
              ))}
              <th className="px-3 py-2 font-semibold">Top issues</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((p) => (
              <tr key={p.row} className="align-top">
                <td className="px-3 py-2 tabular-nums text-xs text-gray-500">{p.row}</td>
                <td className="max-w-[260px] px-3 py-2">
                  <span className="line-clamp-2 text-gray-900">{p.title}</span>
                  {p.id ? <span className="block text-xs text-gray-500">ID {p.id}</span> : null}
                </td>
                {CHANNEL_ORDER.map((c) => {
                  const score = p.scores[c]
                  return (
                    <td key={c} className="px-2 py-2 text-center">
                      <span
                        className="inline-flex min-w-[2.25rem] justify-center rounded-full px-2 py-0.5 text-xs font-bold tabular-nums text-white"
                        style={{ backgroundColor: scoreColor(score) }}
                        title={score === 0 ? 'Would be rejected' : `Score ${score}`}
                      >
                        {score === 0 ? '✗' : score}
                      </span>
                    </td>
                  )
                })}
                <td className="px-3 py-2 text-xs text-gray-700">
                  {p.issues.length === 0 ? (
                    <span className="text-emerald-700">No issues</span>
                  ) : (
                    <ul className="space-y-0.5">
                      {p.issues.slice(0, 3).map((id) => (
                        <li key={id}>{issueTitles[id]?.title ?? id}</li>
                      ))}
                      {p.issues.length > 3 ? <li className="text-gray-500">+{p.issues.length - 3} more</li> : null}
                    </ul>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {report.products.length > 25 ? (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="mt-3 text-sm font-semibold text-accent underline-offset-4 hover:underline print:hidden"
        >
          {showAll ? 'Show fewer' : `Show all ${report.products.length} products`}
        </button>
      ) : null}
    </div>
  )
}
