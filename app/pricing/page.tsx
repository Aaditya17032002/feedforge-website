import type { Metadata } from 'next'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import PricingContent from '@/components/pricing/PricingContent'

export const metadata: Metadata = {
  title: 'Pricing · FeedForge',
  description:
    'Simple, catalog-based pricing for optimizing product feeds with AI across every channel.',
}

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      <main className="min-w-0 flex-1">
        <section className="border-t border-gray-200 bg-white">
          <div className="mx-auto max-w-7xl min-w-0 px-4 py-10 sm:px-6 lg:py-12">
            <PricingContent />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
