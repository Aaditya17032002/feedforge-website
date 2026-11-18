import AuditCta from '@/components/woocommerce/AuditCta'
import SectionHeading from '@/components/woocommerce/SectionHeading'
import { AUDIT_CHECKS, AUDIT_SAMPLE } from '@/lib/content/woocommerce'

export default function WooAudit() {
  return (
    <section className="border-t border-gray-200 bg-white" aria-labelledby="woo-audit-heading">
      <div className="mx-auto max-w-7xl min-w-0 px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
        <SectionHeading
          id="woo-audit-heading"
          eyebrow="AI Channel Readiness Audit"
          title="Find Out How Ready Your WooCommerce Store Is for"
          accent="AI Shopping."
        >
          Review the catalog for missing product data and for issues that affect Google Merchant Center, Meta, Bing
          Shopping, and ChatGPT. The report beside this list is an illustration.
        </SectionHeading>

        <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-12">
          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-900">What the audit checks</h3>
            <ul className="space-y-3">
              {AUDIT_CHECKS.map((check) => (
                <li key={check} className="flex items-start gap-3 text-sm leading-relaxed text-gray-700">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border border-accent/30 bg-accent/10 text-accent" aria-hidden>
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  {check}
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <AuditCta>Check My Store for Free</AuditCta>
            </div>
          </div>

          <figure className="border border-accent/25 bg-gradient-to-br from-accent/[0.07] via-white to-accent/[0.04] p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Sample report</p>
                <p className="mt-1 text-sm font-bold text-gray-900">{AUDIT_SAMPLE.productsReviewed}</p>
              </div>
              <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-900">
                Illustrative
              </span>
            </div>
            <div className="mb-5 flex items-center gap-4 border border-gray-200 bg-white p-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-4 border-accent/30 bg-accent/5">
                <span className="text-xl font-bold text-accent">{AUDIT_SAMPLE.score}</span>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">{AUDIT_SAMPLE.scoreLabel}</p>
                <p className="text-xs text-gray-500">Out of 100 in this example</p>
              </div>
            </div>
            <ul className="space-y-2">
              {AUDIT_SAMPLE.issues.map((issue) => (
                <li key={issue.label} className="flex items-center justify-between gap-3 border border-gray-200 bg-white px-3 py-2.5">
                  <span className="text-sm text-gray-700">{issue.label}</span>
                  <span className="text-sm font-bold text-gray-900">{issue.count}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-gray-700">{AUDIT_SAMPLE.recommendation}</p>
            <figcaption className="mt-4 text-xs font-medium text-gray-500">{AUDIT_SAMPLE.caption}</figcaption>
          </figure>
        </div>
      </div>
    </section>
  )
}
