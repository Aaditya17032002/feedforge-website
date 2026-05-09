import type { Metadata } from 'next'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ContactForm from '@/components/ContactForm'
import { CONTACT_EMAIL, CONTACT_SALES_PHONE, CONTACT_SUPPORT_HOURS } from '@/lib/content/contact'

export const metadata: Metadata = {
  title: 'Contact Us · FeedForge',
  description:
    'Contact the FeedForge team for help with onboarding, feed quality, channel delivery, and scale planning.',
}

export default function ContactPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      <main className="flex-1">
        <section className="border-t border-gray-200 bg-white">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:py-16">
            <div>
              <div className="mb-4">
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-900">
                  • Contact Us
                </span>
              </div>
              <h1 className="text-3xl font-bold leading-tight text-gray-900 lg:text-4xl">
                Let&apos;s Improve Your <span className="text-accent">Product Feeds</span>
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-gray-600 lg:text-base">
                Tell us about your catalog, channels, and current workflow. We&apos;ll follow up with
                practical recommendations, implementation guidance, and clear next steps.
              </p>

              <div className="mt-8 space-y-4 text-sm text-gray-700">
                <p>
                  <span className="font-semibold text-gray-900">Email:</span> {CONTACT_EMAIL}
                </p>
                <p>
                  <span className="font-semibold text-gray-900">Sales:</span> {CONTACT_SALES_PHONE}
                </p>
                <p>
                  <span className="font-semibold text-gray-900">Support hours:</span> {CONTACT_SUPPORT_HOURS}
                </p>
              </div>
            </div>

            <div className="border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
              <ContactForm />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
