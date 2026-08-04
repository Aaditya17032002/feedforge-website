import type { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ContactForm from '@/components/ContactForm'
import { CONTACT_EMAIL, CONTACT_SUPPORT_HOURS, DEMO_FORM_HREF } from '@/lib/content/contact'

export const metadata: Metadata = {
  title: 'Contact Us · FeedForge',
  description:
    'Contact the FeedForge team for help with onboarding, feed quality, channel delivery, and scale planning.',
}

const EXPECTATIONS = [
  {
    title: 'We reply within 2 business days',
    detail: 'You’ll hear back from a real person on our team.',
  },
  {
    title: 'We’ll learn how you run feeds today',
    detail: 'Catalog size, channels, and current workflow help us give useful recommendations.',
  },
  {
    title: 'You get clear next steps',
    detail: 'Demo, pricing guidance, or onboarding - whichever fits your goals.',
  },
] as const

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

              <div className="mt-8 space-y-3 text-sm text-gray-700">
                <p>
                  <span className="font-semibold text-gray-900">Email:</span>{' '}
                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    className="transition-colors hover:text-accent"
                  >
                    {CONTACT_EMAIL}
                  </a>
                </p>
                <p>
                  <span className="font-semibold text-gray-900">Support hours:</span>{' '}
                  {CONTACT_SUPPORT_HOURS}
                </p>
              </div>

              <div className="mt-10 max-w-xl">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                  What to expect
                </h2>
                <ol className="mt-4 space-y-5">
                  {EXPECTATIONS.map((item, index) => (
                    <li key={item.title} className="flex gap-3">
                      <span
                        className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-white"
                        aria-hidden
                      >
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                        <p className="mt-1 text-sm leading-relaxed text-gray-600">{item.detail}</p>
                      </div>
                    </li>
                  ))}
                </ol>
                <p className="mt-8 text-sm text-gray-600">
                  Prefer a live walkthrough?{' '}
                  <Link
                    href={DEMO_FORM_HREF}
                    className="font-semibold text-accent underline-offset-2 transition-colors hover:underline"
                  >
                    Request a demo
                  </Link>
                </p>
              </div>
            </div>

            <div className="border border-gray-200 bg-white p-6 shadow-sm transition-shadow transition-colors duration-200 hover:border-gray-300 hover:shadow-md sm:p-8">
              <ContactForm />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
