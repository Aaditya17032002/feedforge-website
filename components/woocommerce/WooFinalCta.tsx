import Link from 'next/link'
import AuditCta from '@/components/woocommerce/AuditCta'
import { CONTACT_PAGE_HREF } from '@/lib/content/contact'

export default function WooFinalCta() {
  return (
    <section className="border-t border-gray-200 bg-white" aria-labelledby="woo-final-heading">
      <div className="mx-auto max-w-7xl min-w-0 px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-4xl overflow-hidden rounded-xl border border-accent/25 bg-gradient-to-br from-accent/[0.07] via-white to-accent/[0.04] px-6 py-12 text-center shadow-sm sm:px-10">
          <h2 id="woo-final-heading" className="text-balance text-2xl font-bold text-gray-900 sm:text-3xl">
            Is Your WooCommerce Store Ready for <span className="text-accent">AI Shopping?</span>
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-gray-600 lg:text-base">
            Find product feed gaps, identify channel-rule issues, and see where clearer product data can improve
            visibility.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4">
            <AuditCta>Get Your Free AI Channel Readiness Audit</AuditCta>
            <Link
              href={CONTACT_PAGE_HREF}
              className="text-sm font-medium text-gray-700 underline-offset-4 transition-colors hover:text-accent hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            >
              Or talk to us
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
