import Link from 'next/link'
import AuditTool from '@/components/audit/AuditTool'
import { ChannelIcon } from '@/components/audit/ui'
import FaqAccordion from '@/components/faqs/FaqAccordion'
import JsonLd from '@/components/seo/JsonLd'
import SectionHeading from '@/components/woocommerce/SectionHeading'
import { AUDIT_CHANNEL_INFO, AUDIT_DIMENSIONS, AUDIT_FAQS, AUDIT_META } from '@/lib/content/audit'
import { breadcrumbJsonLd, faqPageJsonLd, pageMetadata } from '@/lib/seo'
import type { ChannelKey } from '@/lib/audit/types'

export const metadata = pageMetadata({
  title: AUDIT_META.title,
  description: AUDIT_META.description,
  path: '/audit-tool',
  absoluteTitle: true,
})

const CHANNELS: ChannelKey[] = ['google', 'chatgpt', 'bing', 'meta']

export default function AuditToolPage() {
  return (
    <>
      <JsonLd data={faqPageJsonLd(AUDIT_FAQS)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'AI Channel Readiness Audit', path: '/audit-tool' },
        ])}
      />

      <section className="relative overflow-hidden bg-white">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-gradient-to-b from-accent/[0.07] via-accent/[0.02] to-transparent"
          aria-hidden
        />
        <div className="relative mx-auto max-w-5xl min-w-0 px-4 pb-12 pt-10 sm:px-6 sm:pb-16 sm:pt-12 lg:pt-16">
          <nav aria-label="Breadcrumb" className="mb-8 print:hidden">
            <ol className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
              <li>
                <Link href="/" className="font-medium text-gray-700 transition-colors hover:text-accent">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="font-medium text-gray-900" aria-current="page">
                AI Channel Readiness Audit
              </li>
            </ol>
          </nav>

          <div className="mb-10 text-center print:hidden">
            <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-900">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Free · Instant · No account needed
            </span>
            <h1 className="mx-auto mt-5 max-w-3xl text-balance text-3xl font-bold leading-tight text-gray-900 sm:text-4xl lg:text-5xl">
              Is Your Catalog Ready for <span className="text-accent">AI Shopping?</span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-pretty text-sm leading-relaxed text-gray-600 sm:text-base">
              Upload your product feed or store export. In seconds you&apos;ll see how your products score on Google Shopping and AI Mode,
              ChatGPT, Microsoft Copilot and Meta, and exactly what to fix.
            </p>
            <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
              {CHANNELS.map((c) => (
                <li key={c} className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <ChannelIcon channel={c} className="h-5 w-5" />
                  {AUDIT_CHANNEL_INFO[c].short}
                </li>
              ))}
            </ul>
          </div>

          <AuditTool />
        </div>
      </section>

      <section className="border-t border-gray-200 bg-white print:hidden" aria-labelledby="audit-checks-heading">
        <div className="mx-auto max-w-7xl min-w-0 px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
          <SectionHeading id="audit-checks-heading" eyebrow="What the audit checks" title="More than 50 checks across" accent="six areas.">
            Built from the published rules of each channel and from what AI assistants need to recommend a product with confidence.
          </SectionHeading>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {AUDIT_DIMENSIONS.map((d, i) => (
              <div key={d.title} className="border border-gray-200 bg-white p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-md">
                <span className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-sm font-bold text-accent">
                  {i + 1}
                </span>
                <h3 className="text-base font-bold text-gray-900">{d.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{d.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-gray-200 bg-white print:hidden" aria-labelledby="audit-faq-heading">
        <div className="mx-auto max-w-7xl min-w-0 px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
          <SectionHeading id="audit-faq-heading" eyebrow="FAQs" title="About the" accent="audit.">
            How the audit works, what it reads, and what happens to your file.
          </SectionHeading>
          <FaqAccordion items={AUDIT_FAQS} />
        </div>
      </section>
    </>
  )
}
