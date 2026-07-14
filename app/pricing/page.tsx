import type { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import StartBuilding from '@/components/StartBuilding'
import { FOUNDING_TIERS, PRICING_TIERS } from '@/lib/content/pricing'
import { SIGNUP_URL } from '@/lib/shared/app-urls'

export const metadata: Metadata = {
  title: 'Pricing · FeedForge',
  description:
    'Simple, catalog-based pricing for optimizing product feeds with AI across every channel.',
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2l2.9 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 7.1-1.01L12 2z" />
    </svg>
  )
}

function StatRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`text-sm font-semibold ${accent ? 'text-accent' : 'text-gray-900'}`}>{value}</span>
    </div>
  )
}

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      <main className="flex-1">
        <section className="border-t border-gray-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
            <div className="mb-4 flex justify-center">
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-900">
                • Pricing
              </span>
            </div>
            <h1 className="mb-4 text-center text-3xl font-bold leading-tight text-gray-900 lg:text-4xl">
              Plans That Scale With Your <span className="text-accent">Catalog</span>
            </h1>
            <p className="mx-auto max-w-2xl text-center text-sm leading-relaxed text-gray-600 lg:text-base">
              Standard rack rates below. Pick the tier that matches your catalog size — every plan
              includes FeedForge AI for titles, descriptions, and channel-ready feeds. Founding
              Merchant pricing is available during the year-one acquisition window.
            </p>

            <div className="mx-auto mt-8 flex max-w-3xl items-center justify-center">
              <a
                href="#founding-merchant"
                className="group inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-full border border-accent/30 bg-accent/[0.06] px-4 py-2 text-center text-xs font-medium text-accent transition-colors hover:bg-accent/10 sm:text-sm"
              >
                <StarIcon className="h-3.5 w-3.5" />
                Founding Merchant Program — activation fee free for the first 200 merchants
                <span className="underline group-hover:no-underline">See offer ↓</span>
              </a>
            </div>

            <div className="mx-auto mt-12 max-w-7xl lg:mt-16">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {PRICING_TIERS.map((tier) => {
                  const href =
                    tier.name === 'Enterprise'
                      ? '/contact'
                      : tier.recommendKey
                        ? `${SIGNUP_URL}?recommend=${tier.recommendKey}`
                        : SIGNUP_URL
                  return (
                    <div
                      key={tier.name}
                      className={`relative flex flex-col border bg-white p-6 transition-shadow ${
                        tier.popular
                          ? 'border-accent shadow-[0_12px_40px_-12px_rgba(9,0,136,0.35)]'
                          : 'border-gray-200 hover:shadow-[0_12px_40px_-16px_rgba(0,0,0,0.18)]'
                      }`}
                    >
                      {tier.popular && (
                        <span className="absolute -top-3 left-6 inline-flex items-center gap-1 bg-accent px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                          <StarIcon className="h-3 w-3" />
                          Most popular
                        </span>
                      )}

                      <h2 className="text-xl font-bold text-gray-900">{tier.name}</h2>
                      <p className="mt-1 text-xs font-medium text-gray-500">{tier.catalog}</p>

                      <div className="mt-5 flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-accent">{tier.monthly}</span>
                        {tier.monthly !== 'Custom' && (
                          <span className="text-sm font-medium text-gray-500">/mo</span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-gray-500">Monthly subscription</p>

                      <div className="mt-5 divide-y divide-gray-100 border-y border-gray-100">
                        <StatRow label="Activation fee" value={tier.activationFee} />
                        <StatRow label="Included rows / mo" value={tier.includedRows} />
                        <StatRow label="Overage / 1K rows" value={tier.overage} />
                      </div>

                      <div className="flex-1" />

                      <Link
                        href={href}
                        className={`mt-6 block w-full px-4 py-3 text-center text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 ${
                          tier.ctaStyle === 'solid'
                            ? 'bg-accent text-white hover:bg-[#070066] hover:shadow-[0_10px_24px_-8px_rgba(9,0,136,0.55)]'
                            : 'border border-gray-900 bg-white text-gray-900 hover:border-accent hover:bg-accent hover:text-white hover:shadow-[0_10px_24px_-8px_rgba(9,0,136,0.45)]'
                        }`}
                      >
                        {tier.cta}
                      </Link>
                    </div>
                  )
                })}
              </div>

              <div className="mt-6 flex items-start gap-3 border border-gray-200 bg-gray-50 px-5 py-4">
                <span className="mt-0.5 inline-flex shrink-0 items-center bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                  Annual
                </span>
                <p className="text-sm leading-relaxed text-gray-700">
                  <span className="font-semibold text-gray-900">Annual plan:</span> Activation fee
                  waived for customers who commit to annual billing upfront.
                </p>
              </div>
            </div>

            <div id="founding-merchant" className="mx-auto mt-16 max-w-7xl scroll-mt-24 lg:mt-24">
              <div className="border border-accent/30 bg-accent/[0.04]">
                <div className="border-b border-accent/20 px-6 py-7 sm:px-8">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 bg-accent px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
                      <StarIcon className="h-3.5 w-3.5" />
                      Year One
                    </span>
                    <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                      Founding Merchant Program
                    </h2>
                  </div>
                  <p className="mt-3 max-w-3xl text-sm leading-relaxed text-gray-700">
                    Aggressive acquisition offer for the first 200 merchants or through the end of
                    Q4 2026, whichever comes first.{' '}
                    <span className="font-semibold text-gray-900">All tiers eligible.</span>
                  </p>
                </div>

                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b border-accent/20 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        <th className="px-6 py-4 sm:px-8">Tier</th>
                        <th className="px-6 py-4">Activation fee</th>
                        <th className="px-6 py-4">Month 1</th>
                        <th className="px-6 py-4">Monthly from month 2</th>
                        <th className="px-6 py-4">Min. commitment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {FOUNDING_TIERS.map((tier) => (
                        <tr
                          key={tier.name}
                          className={`border-b border-accent/10 last:border-b-0 ${
                            tier.popular ? 'bg-accent/[0.05]' : ''
                          }`}
                        >
                          <td className="px-6 py-5 sm:px-8">
                            <span className="inline-flex items-center gap-1.5 font-bold text-gray-900">
                              {tier.name}
                              {tier.popular && <StarIcon className="h-3.5 w-3.5 text-accent" />}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <span className="font-semibold text-accent">Free</span>{' '}
                            <span className="text-xs text-gray-400 line-through">
                              {tier.activationWas}
                            </span>
                          </td>
                          <td className="px-6 py-5 font-semibold text-accent">Free</td>
                          <td className="px-6 py-5 font-medium text-gray-900">
                            {tier.monthlyFromMonth2}
                          </td>
                          <td className="px-6 py-5 text-gray-700">{tier.minCommitment}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="divide-y divide-accent/10 md:hidden">
                  {FOUNDING_TIERS.map((tier) => (
                    <div
                      key={tier.name}
                      className={`px-6 py-5 ${tier.popular ? 'bg-accent/[0.05]' : ''}`}
                    >
                      <div className="mb-3 flex items-center gap-1.5">
                        <span className="font-bold text-gray-900">{tier.name}</span>
                        {tier.popular && <StarIcon className="h-3.5 w-3.5 text-accent" />}
                      </div>
                      <dl className="grid grid-cols-2 gap-y-2 text-sm">
                        <dt className="text-gray-600">Activation fee</dt>
                        <dd className="text-right">
                          <span className="font-semibold text-accent">Free</span>{' '}
                          <span className="text-xs text-gray-400 line-through">
                            {tier.activationWas}
                          </span>
                        </dd>
                        <dt className="text-gray-600">Month 1</dt>
                        <dd className="text-right font-semibold text-accent">Free</dd>
                        <dt className="text-gray-600">From month 2</dt>
                        <dd className="text-right font-medium text-gray-900">
                          {tier.monthlyFromMonth2}
                        </dd>
                        <dt className="text-gray-600">Min. commitment</dt>
                        <dd className="text-right text-gray-700">{tier.minCommitment}</dd>
                      </dl>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex items-start gap-3 border border-gray-200 bg-gray-50 px-5 py-4">
                <span className="mt-0.5 inline-flex shrink-0 items-center bg-gray-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                  Cap
                </span>
                <p className="text-sm leading-relaxed text-gray-700">
                  <span className="font-semibold text-gray-900">Program cap:</span> Available to the
                  first 200 merchants, or through 31 December 2026 — whichever comes first. After the
                  program closes, standard activation fees apply.
                </p>
              </div>
            </div>

            <p className="mx-auto mt-10 max-w-2xl text-center text-xs leading-relaxed text-gray-500">
              Prices shown are standard rack rates. Overage is billed per 1,000 additional feed rows
              processed beyond your included monthly allotment. Taxes may apply. Enterprise
              agreements include custom terms and onboarding.
            </p>
          </div>

          <StartBuilding />
        </section>
      </main>
      <Footer />
    </div>
  )
}
