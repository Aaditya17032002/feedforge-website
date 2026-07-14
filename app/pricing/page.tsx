import type { Metadata } from 'next'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import StartBuilding from '@/components/StartBuilding'
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
      <main className="flex-1">
        <section className="border-t border-gray-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
            <PricingContent />
          </div>
          <StartBuilding />
        </section>
      </main>
      <Footer />
    </div>
  )
}
