import type { Metadata } from 'next'
import Link from 'next/link'
import FaqAccordion from '@/components/faqs/FaqAccordion'
import faqItems from '@/lib/content/faqs/faqs.json'

export const metadata: Metadata = {
  title: 'FAQs · FeedForge',
  description: 'Answers to common questions about FeedForge product feeds, integrations, AI enrichment, and pricing.',
}

export default function FaqsPage() {
  return (
    <section className="border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:py-20">
        <div className="mb-4 flex justify-center">
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-900">
            • FAQs
          </span>
        </div>
        <h1 className="mb-4 text-center text-3xl font-bold leading-tight text-gray-900 lg:text-4xl">
          Frequently Asked Questions About <span className="text-accent">FeedForge</span>
        </h1>
        <p className="mx-auto max-w-2xl text-center text-sm leading-relaxed text-gray-600 lg:text-base">
          Quick answers about setup, channels, pricing, and day-to-day usage.
        </p>

        <FaqAccordion items={faqItems} />

        <div className="mx-auto mt-20 max-w-4xl overflow-hidden rounded-xl border border-accent/25 bg-gradient-to-br from-accent/[0.07] via-white to-accent/[0.04] px-8 py-12 text-center shadow-sm transition-shadow duration-500 hover:shadow-lg hover:shadow-accent/10 md:px-12">
          <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">
            Ready To Scale Your <span className="text-accent">Product Feeds</span>?
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-gray-600">
            Book a guided demo to see how FeedForge can improve feed quality, reduce manual
            work, and automate delivery across your channels.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs font-medium text-gray-700 sm:gap-3">
            <span className="rounded-full border border-gray-200 bg-white px-3 py-1">Import In Minutes</span>
            <span className="rounded-full border border-gray-200 bg-white px-3 py-1">AI Enrichment</span>
            <span className="rounded-full border border-gray-200 bg-white px-3 py-1">Automated Delivery</span>
          </div>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/#request-demo"
              className="inline-flex items-center justify-center border border-accent bg-accent px-8 py-3 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#070066] hover:shadow-md hover:shadow-accent/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            >
              Request A Demo
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center border border-gray-300 bg-white px-8 py-3 text-sm font-semibold text-gray-900 transition-all duration-300 hover:-translate-y-0.5 hover:border-accent hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
