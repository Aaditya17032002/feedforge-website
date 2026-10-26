import type { Metadata } from 'next'
import PricingContent from '@/components/pricing/PricingContent'

export const metadata: Metadata = {
  title: 'Pricing · FeedForge',
  description:
    'Simple, catalog-based pricing for AI-optimized feeds in CSV, JSON, Google Merchant Center, and Meta formats, delivered over SFTP or HTTPS.',
}

export default function PricingPage() {
  return (
    <section className="border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl min-w-0 px-4 py-10 sm:px-6 lg:py-12">
        <PricingContent />
      </div>
    </section>
  )
}
