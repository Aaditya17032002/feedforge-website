import PricingContent from '@/components/pricing/PricingContent'
import JsonLd from '@/components/seo/JsonLd'
import { pageMetadata, softwareApplicationJsonLd } from '@/lib/seo'

export const metadata = pageMetadata({
  title: 'Pricing',
  description:
    'Simple, catalog-based pricing for AI-optimized feeds in CSV, JSON, Google Merchant Center, and Meta formats, delivered over SFTP or HTTPS.',
  path: '/pricing',
})

export default function PricingPage() {
  return (
    <>
      <JsonLd data={softwareApplicationJsonLd()} />
      <section className="border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl min-w-0 px-4 py-10 sm:px-6 lg:py-12">
          <PricingContent />
        </div>
      </section>
    </>
  )
}
