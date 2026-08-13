'use client'

import { useMemo, useState, type ReactNode } from 'react'
import Link from 'next/link'
import {
  FOUNDING_PROGRAM,
  FOUNDING_TIERS,
  OVERAGE_PER_1K_USD,
  PRICING_INCLUDED_FEATURES,
  PRICING_TIERS,
  PRICING_VALUE_ITEMS,
  formatRowCount,
  formatUsd,
  isActive,
  type PricingIncludedFeature,
  type PricingTier,
  type PricingValueItem,
} from '@/lib/content/pricing'
import { GA_EVENTS, trackEvent } from '@/lib/analytics/gtag'
import { SIGNUP_URL } from '@/lib/shared/app-urls'

type BillingInterval = 'monthly' | 'annual'

function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2l2.9 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 7.1-1.01L12 2z" />
    </svg>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path
        fillRule="evenodd"
        d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function ChevronIcon({ open, className }: { open: boolean; className?: string }) {
  return (
    <svg
      className={`${className ?? ''} transition-transform ${open ? 'rotate-180' : ''}`}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function IntervalToggle({
  value,
  onChange,
}: {
  value: BillingInterval
  onChange: (v: BillingInterval) => void
}) {
  const select = (next: BillingInterval) => {
    if (next === value) return
    trackEvent(GA_EVENTS.BILLING_INTERVAL_TOGGLE, {
      billing_interval: next,
      location: 'pricing_page',
    })
    onChange(next)
  }

  return (
    <div className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 p-1">
      <button
        type="button"
        onClick={() => select('monthly')}
        className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors sm:text-sm ${
          value === 'monthly' ? 'bg-accent text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        Monthly
      </button>
      <button
        type="button"
        onClick={() => select('annual')}
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors sm:gap-2 sm:px-4 sm:text-sm ${
          value === 'annual' ? 'bg-accent text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        Annual
        <span className="rounded-full border border-accent/15 bg-white px-2 py-0.5 text-[12px] font-medium leading-none text-accent sm:text-[13px]">
          Activation fee waived
        </span>
      </button>
    </div>
  )
}

function tierHref(tier: PricingTier): string {
  if (tier.key === 'enterprise' || tier.monthly == null) return '/contact'
  if (tier.recommendKey) return `${SIGNUP_URL}?recommend=${tier.recommendKey}`
  return SIGNUP_URL
}

function tierHeadline(
  tier: PricingTier,
  interval: BillingInterval,
): { price: string; suffix: string; caption: string } {
  if (tier.monthly == null) {
    return { price: 'Custom', suffix: '', caption: 'Custom subscription' }
  }
  if (interval === 'annual') {
    return {
      price: formatUsd(tier.monthly * 12),
      suffix: '/yr',
      caption: 'Billed yearly · activation waived',
    }
  }
  return {
    price: formatUsd(tier.monthly),
    suffix: '/mo',
    caption: 'Monthly subscription',
  }
}

function activationLabel(tier: PricingTier, interval: BillingInterval): string | null {
  if (tier.activationFee == null) return null
  if (interval === 'annual') return 'Activation fee: Waived'
  return `Activation fee: ${formatUsd(tier.activationFee)}`
}

function planFeatureBullets(tier: PricingTier): string[] {
  const bullets = [...tier.features]
  if (tier.includedRows != null) {
    bullets.push(`${formatRowCount(tier.includedRows)} rows/month`)
  }
  return bullets
}

function FoundingBanner({
  detailsOpen,
  onToggle,
}: {
  detailsOpen: boolean
  onToggle: () => void
}) {
  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="rounded-xl border border-accent/25 bg-accent/[0.05] px-4 py-3 sm:px-5 sm:py-3.5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="min-w-0 flex items-start gap-2.5 sm:items-center">
            <StarIcon className="mt-0.5 h-4 w-4 shrink-0 text-accent sm:mt-0" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900">Founding Merchant Program</p>
              <p className="mt-0.5 text-xs leading-relaxed text-gray-600 sm:text-sm">
                {FOUNDING_PROGRAM.activationWaived ? 'Activation fee waived' : null}
                {FOUNDING_PROGRAM.activationWaived && FOUNDING_PROGRAM.firstMonthFree ? ' + ' : null}
                {FOUNDING_PROGRAM.firstMonthFree ? 'first month free' : null}
                {' '}
                for the first {FOUNDING_PROGRAM.maxMerchants} merchants.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              trackEvent(GA_EVENTS.FOUNDING_BANNER_TOGGLE, {
                action: detailsOpen ? 'close' : 'open',
                location: 'pricing_page',
              })
              onToggle()
            }}
            aria-expanded={detailsOpen}
            aria-controls="founding-merchant-details"
            className="inline-flex shrink-0 items-center justify-center gap-1 self-start rounded-full border border-accent/30 bg-white px-3 py-1.5 text-xs font-semibold text-accent shadow-[0_0_12px_rgba(9,0,136,0.28)] transition-all hover:bg-accent/10 hover:shadow-[0_0_18px_rgba(9,0,136,0.4)] sm:self-center"
          >
            {detailsOpen ? 'Hide offer' : 'View offer'}
            <ChevronIcon open={detailsOpen} className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

function FoundingDetails({ open }: { open: boolean }) {
  const founding = useMemo(() => FOUNDING_TIERS.filter(isActive), [])

  if (!open) return null

  return (
    <div
      id="founding-merchant-details"
      className="mx-auto mt-4 w-full max-w-7xl scroll-mt-24"
    >
      <div className="overflow-hidden rounded-xl border border-accent/20 bg-white">
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[32rem] border-collapse text-left">
            <thead>
              <tr className="border-b border-gray-100 text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-5 py-3">Tier</th>
                <th className="px-5 py-3">Activation</th>
                <th className="px-5 py-3">Month 1</th>
                <th className="px-5 py-3">From month 2</th>
                <th className="px-5 py-3">Commitment</th>
              </tr>
            </thead>
            <tbody>
              {founding.map((tier) => (
                <tr
                  key={tier.tierKey}
                  className={`border-b border-gray-50 last:border-b-0 ${
                    tier.popular ? 'bg-accent/[0.03]' : ''
                  }`}
                >
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                      {tier.name}
                      {tier.popular ? <StarIcon className="h-3.5 w-3.5 text-accent" /> : null}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm">
                    <span className="font-semibold text-accent">Free</span>{' '}
                    <span className="text-xs text-gray-400 line-through">
                      {formatUsd(tier.activationWas)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm font-semibold text-accent">Free</td>
                  <td className="px-5 py-3.5 text-sm font-medium text-gray-900">
                    {formatUsd(tier.monthlyFromMonth2)}/mo
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-700">{tier.minCommitment}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="divide-y divide-gray-100 md:hidden">
          {founding.map((tier) => (
            <div key={tier.tierKey} className={`px-4 py-4 ${tier.popular ? 'bg-accent/[0.03]' : ''}`}>
              <div className="mb-2 flex items-center gap-1.5">
                <span className="text-sm font-semibold text-gray-900">{tier.name}</span>
                {tier.popular ? <StarIcon className="h-3.5 w-3.5 text-accent" /> : null}
              </div>
              <dl className="grid grid-cols-2 gap-y-1.5 text-sm">
                <dt className="text-gray-600">Activation</dt>
                <dd className="text-right">
                  <span className="font-semibold text-accent">Free</span>{' '}
                  <span className="text-xs text-gray-400 line-through">
                    {formatUsd(tier.activationWas)}
                  </span>
                </dd>
                <dt className="text-gray-600">Month 1</dt>
                <dd className="text-right font-semibold text-accent">Free</dd>
                <dt className="text-gray-600">From month 2</dt>
                <dd className="text-right font-medium text-gray-900">
                  {formatUsd(tier.monthlyFromMonth2)}/mo
                </dd>
                <dt className="text-gray-600">Commitment</dt>
                <dd className="text-right text-gray-700">{tier.minCommitment}</dd>
              </dl>
            </div>
          ))}
        </div>

        <ul className="list-disc space-y-1.5 border-t border-accent/15 bg-accent/[0.03] px-4 py-4 pl-8 text-xs leading-relaxed text-gray-600 marker:text-accent sm:px-5 sm:pl-9 sm:text-sm">
          <li className="pl-0.5">Eligible active tiers</li>
          <li className="pl-0.5">
            Minimum commitment: {FOUNDING_PROGRAM.minCommitmentMonths} months
          </li>
          <li className="pl-0.5">
            Available to the first {FOUNDING_PROGRAM.maxMerchants} merchants, or through{' '}
            {FOUNDING_PROGRAM.endsOnLabel} - whichever comes first
          </li>
        </ul>
      </div>
    </div>
  )
}

function IncludedFeatureCard({ item }: { item: PricingIncludedFeature }) {
  return (
    <div className="min-w-0 rounded-xl bg-white px-5 py-5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
          <CheckIcon className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 sm:text-base">{item.label}</h3>
          <p className="mt-1 text-xs leading-relaxed text-gray-600 sm:text-sm">{item.description}</p>
        </div>
      </div>
    </div>
  )
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
      />
    </svg>
  )
}

function SearchDiscoverIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  )
}

function ShoppingBagIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
      />
    </svg>
  )
}

const VALUE_ICONS: Record<string, (props: { className?: string }) => ReactNode> = {
  enhance_content: SparklesIcon,
  ai_search_visibility: SearchDiscoverIcon,
  reach_shoppers: ShoppingBagIcon,
}

function ValueCard({ item }: { item: PricingValueItem }) {
  const Icon = VALUE_ICONS[item.key] ?? SparklesIcon
  return (
    <div className="flex h-full min-w-0 flex-col items-center rounded-xl bg-white/80 px-5 py-7 text-center">
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
        <Icon className="h-6 w-6" />
      </span>
      <h3 className="mt-4 text-sm font-bold text-gray-900 sm:text-base">{item.label}</h3>
      <p className="mt-2 text-xs leading-relaxed text-gray-600 sm:text-sm">{item.description}</p>
    </div>
  )
}

export default function PricingContent() {
  const [interval, setInterval] = useState<BillingInterval>('monthly')
  const [foundingOpen, setFoundingOpen] = useState(false)

  const tiers = useMemo(() => PRICING_TIERS.filter(isActive), [])

  return (
    <>
      {/* Hero */}
      <div className="mb-3 flex justify-center">
        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-900">
          • Pricing
        </span>
      </div>
      <h1 className="mb-3 text-center text-3xl font-bold leading-tight text-gray-900 lg:text-4xl">
        Plans That Scale With Your <span className="text-accent">Catalog</span>
      </h1>
      <p className="mx-auto max-w-2xl text-center text-sm leading-relaxed text-gray-600 lg:text-base">
        Simple pricing based on your catalog size. Every plan includes AI-powered product
        optimization, feed management, and channel-ready exports.
      </p>

      <div className="mx-auto mt-6 flex justify-center">
        <IntervalToggle value={interval} onChange={setInterval} />
      </div>

      {/* Founding banner (compact) */}
      <div id="founding-merchant" className="mx-auto mt-6 w-full max-w-7xl scroll-mt-24">
        <FoundingBanner detailsOpen={foundingOpen} onToggle={() => setFoundingOpen((v) => !v)} />
        <FoundingDetails open={foundingOpen} />
      </div>

      {/* Pricing cards */}
      <div className="mx-auto mt-8 max-w-7xl lg:mt-10">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tiers.map((tier) => {
            const headline = tierHeadline(tier, interval)
            const activation = activationLabel(tier, interval)
            const bullets = planFeatureBullets(tier)

            return (
              <div
                key={tier.key}
                className={`relative flex min-w-0 flex-col rounded-xl border bg-white p-6 transition-shadow ${
                  tier.popular
                    ? 'border-accent shadow-[0_12px_40px_-12px_rgba(9,0,136,0.35)]'
                    : 'border-gray-200 hover:shadow-[0_12px_40px_-16px_rgba(0,0,0,0.18)]'
                }`}
              >
                {tier.popular ? (
                  <span className="absolute -top-3 left-6 inline-flex items-center gap-1 bg-accent px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                    <StarIcon className="h-3 w-3" />
                    Most popular
                  </span>
                ) : null}

                <h2 className="text-xl font-bold text-gray-900">{tier.name}</h2>
                <p className="mt-1 text-xs font-medium text-gray-500">{tier.catalog}</p>

                <div className="mt-5 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-accent">{headline.price}</span>
                  {headline.suffix ? (
                    <span className="text-sm font-medium text-gray-500">{headline.suffix}</span>
                  ) : null}
                </div>
                <p className="mt-1 text-xs text-gray-500">{headline.caption}</p>
                {interval === 'annual' && tier.monthly != null ? (
                  <p className="mt-1 text-xs text-gray-400">
                    Equivalent to {formatUsd(tier.monthly)}/mo billed yearly
                  </p>
                ) : null}

                <ul className="mt-5 space-y-2.5">
                  {bullets.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="flex-1" />

                <Link
                  href={tierHref(tier)}
                  onClick={() =>
                    trackEvent(GA_EVENTS.PRICING_PLAN_CLICK, {
                      plan_key: tier.key,
                      plan_name: tier.name,
                      billing_interval: interval,
                      location: 'pricing_page',
                    })
                  }
                  className={`mt-6 block w-full rounded-lg px-4 py-3 text-center text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 ${
                    tier.ctaStyle === 'solid'
                      ? 'bg-accent text-white hover:bg-[#070066] hover:shadow-[0_10px_24px_-8px_rgba(9,0,136,0.55)]'
                      : 'border border-gray-900 bg-white text-gray-900 hover:border-accent hover:bg-accent hover:text-white hover:shadow-[0_10px_24px_-8px_rgba(9,0,136,0.45)]'
                  }`}
                >
                  {tier.cta}
                </Link>

                {activation ? (
                  <p className="mt-3 text-center text-xs text-gray-400">{activation}</p>
                ) : null}
              </div>
            )
          })}
        </div>

        <p className="mx-auto mt-5 max-w-2xl text-center text-xs leading-relaxed text-gray-500">
          Need more capacity? Additional feed processing is available at{' '}
          {formatUsd(OVERAGE_PER_1K_USD)} per 1,000 rows.
        </p>
      </div>

      {/* Included features */}
      <div className="mx-auto mt-14 max-w-7xl lg:mt-16">
        <div className="rounded-2xl bg-gray-50 px-4 py-10 sm:px-8 lg:px-10 lg:py-12">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Everything You Need to Manage Your Product Feeds
            </h2>
            <p className="mt-2 text-sm text-gray-600 sm:text-base">
              Import, optimize, validate, and distribute your catalog from one place.
            </p>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:mt-10 lg:grid-cols-3 lg:gap-4">
            {PRICING_INCLUDED_FEATURES.map((item) => (
              <IncludedFeatureCard key={item.key} item={item} />
            ))}
          </div>
        </div>
      </div>

      {/* Expansion value */}
      <div id="whats-included" className="mx-auto mt-14 max-w-7xl scroll-mt-24 lg:mt-16">
        <div className="rounded-2xl bg-accent/[0.04] px-4 py-10 sm:px-8 lg:px-10 lg:py-12">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Get More From Your Product Catalog
            </h2>
            <p className="mt-2 text-sm text-gray-600 sm:text-base">
              Extend your catalog&apos;s reach, visibility, and capabilities.
            </p>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:mt-10 lg:grid-cols-3 lg:gap-5">
            {PRICING_VALUE_ITEMS.map((item) => (
              <ValueCard key={item.key} item={item} />
            ))}
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="mx-auto mt-14 max-w-2xl text-center lg:mt-16">
        <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          Ready to Improve Your Product Catalog?
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-600 sm:text-base">
          Start building better feeds and reach more customers with FeedForge.
        </p>
        <Link
          href="/#try-your-product"
          onClick={() => trackEvent(GA_EVENTS.TRY_DEMO_CLICK, { location: 'pricing_page' })}
          className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#070066] sm:w-auto"
        >
          Try It Free
        </Link>
        <p className="mx-auto mt-6 max-w-xl text-xs leading-relaxed text-gray-400">
          Prices shown are standard rack rates. Taxes may apply. Contact us for custom enterprise
          agreements.
        </p>
      </div>
    </>
  )
}
