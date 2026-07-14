'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  FOUNDING_TIERS,
  OVERAGE_PER_1K_USD,
  PRICING_ADDONS,
  PRICING_TIERS,
  formatRowCount,
  formatUsd,
  isActive,
  type PricingTier,
} from '@/lib/content/pricing'
import { SIGNUP_URL } from '@/lib/shared/app-urls'

type BillingInterval = 'monthly' | 'annual'

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

function IntervalToggle({
  value,
  onChange,
}: {
  value: BillingInterval
  onChange: (v: BillingInterval) => void
}) {
  return (
    <div className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 p-1">
      <button
        type="button"
        onClick={() => onChange('monthly')}
        className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors sm:text-sm ${
          value === 'monthly' ? 'bg-accent text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        Monthly
      </button>
      <button
        type="button"
        onClick={() => onChange('annual')}
        className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors sm:text-sm ${
          value === 'annual' ? 'bg-accent text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        Annual
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

function activationDisplay(tier: PricingTier, interval: BillingInterval): string {
  if (tier.activationFee == null) return 'Custom'
  if (interval === 'annual') return 'Waived'
  return formatUsd(tier.activationFee)
}

export default function PricingContent() {
  const [interval, setInterval] = useState<BillingInterval>('monthly')

  const tiers = useMemo(() => PRICING_TIERS.filter(isActive), [])
  const addons = useMemo(() => PRICING_ADDONS.filter(isActive), [])
  const founding = useMemo(() => FOUNDING_TIERS.filter(isActive), [])

  const gridClass =
    tiers.length >= 4
      ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'
      : 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'

  return (
    <>
      <div className="mb-4 flex justify-center">
        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-900">
          • Pricing
        </span>
      </div>
      <h1 className="mb-4 text-center text-3xl font-bold leading-tight text-gray-900 lg:text-4xl">
        Plans That Scale With Your <span className="text-accent">Catalog</span>
      </h1>
      <p className="mx-auto max-w-2xl text-center text-sm leading-relaxed text-gray-600 lg:text-base">
        Standard rack rates below. Pick the tier that matches your catalog size — every plan includes
        FeedForge AI for titles, descriptions, and channel-ready feeds. Founding Merchant pricing is
        available during the year-one acquisition window.
      </p>

      <div className="mx-auto mt-8 flex flex-col items-center gap-4">
        <IntervalToggle value={interval} onChange={setInterval} />
        {interval === 'annual' ? (
          <p className="text-center text-xs font-medium text-accent">
            Annual billing applies to plan subscriptions — activation fee waived.
          </p>
        ) : null}

        <a
          href="#founding-merchant"
          className="group inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-full border border-accent/30 bg-accent/[0.06] px-4 py-2 text-center text-xs font-medium text-accent transition-colors hover:bg-accent/10 sm:text-sm"
        >
          <StarIcon className="h-3.5 w-3.5" />
          Founding Merchant Program — activation fee free for the first 200 merchants
          <span className="underline group-hover:no-underline">See offer ↓</span>
        </a>
      </div>

      {/* 1 · Plans */}
      <div className="mx-auto mt-12 max-w-7xl lg:mt-16">
        <div className={gridClass}>
          {tiers.map((tier) => {
            const headline = tierHeadline(tier, interval)
            return (
              <div
                key={tier.key}
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

                <div className="mt-5 divide-y divide-gray-100 border-y border-gray-100">
                  <StatRow
                    label="Activation fee"
                    value={activationDisplay(tier, interval)}
                    accent={interval === 'annual' && tier.activationFee != null}
                  />
                  <StatRow label="Included rows / mo" value={formatRowCount(tier.includedRows)} />
                </div>

                <div className="flex-1" />

                <Link
                  href={tierHref(tier)}
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
      </div>

      {/* 2 · Discount program */}
      <div id="founding-merchant" className="mx-auto mt-16 max-w-7xl scroll-mt-24 lg:mt-20">
        <div className="border border-accent/30 bg-accent/[0.04]">
          <div className="border-b border-accent/20 px-6 py-7 sm:px-8">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 bg-accent px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
                <StarIcon className="h-3.5 w-3.5" />
                Year One
              </span>
              <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">Founding Merchant Program</h2>
            </div>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-gray-700">
              Aggressive acquisition offer for the first 200 merchants or through the end of Q4 2026,
              whichever comes first.{' '}
              <span className="font-semibold text-gray-900">Eligible active tiers shown below.</span>
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
                {founding.map((tier) => (
                  <tr
                    key={tier.tierKey}
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
                        {formatUsd(tier.activationWas)}
                      </span>
                    </td>
                    <td className="px-6 py-5 font-semibold text-accent">Free</td>
                    <td className="px-6 py-5 font-medium text-gray-900">
                      {formatUsd(tier.monthlyFromMonth2)}/mo
                    </td>
                    <td className="px-6 py-5 text-gray-700">{tier.minCommitment}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-accent/10 md:hidden">
            {founding.map((tier) => (
              <div key={tier.tierKey} className={`px-6 py-5 ${tier.popular ? 'bg-accent/[0.05]' : ''}`}>
                <div className="mb-3 flex items-center gap-1.5">
                  <span className="font-bold text-gray-900">{tier.name}</span>
                  {tier.popular && <StarIcon className="h-3.5 w-3.5 text-accent" />}
                </div>
                <dl className="grid grid-cols-2 gap-y-2 text-sm">
                  <dt className="text-gray-600">Activation fee</dt>
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
            <span className="font-semibold text-gray-900">Program cap:</span> Available to the first
            200 merchants, or through 31 December 2026 — whichever comes first. After the program
            closes, standard activation fees apply.
          </p>
        </div>
      </div>

      {/* 3 · Add-ons (always monthly / usage pricing) */}
      {addons.length > 0 ? (
        <div id="add-ons" className="mx-auto mt-14 max-w-7xl scroll-mt-24 lg:mt-16">
          <div className="mb-6 text-center sm:text-left">
            <h2 className="text-2xl font-bold text-gray-900">Optional add-ons</h2>
            <p className="mt-1 text-sm text-gray-600">
              Add catalog extras anytime. Prices below are monthly (or per-usage) and do not change
              with the Annual plan toggle.
            </p>
          </div>
          <div className="divide-y divide-gray-100 border border-gray-200 bg-white">
            {addons.map((addon) => {
              let priceLabel = 'Custom'
              if (addon.priceUnit === 'month' && addon.monthly != null) {
                priceLabel = `${formatUsd(addon.monthly)}/mo`
              } else if (addon.priceUnit === 'per_1k_rows' && addon.monthly != null) {
                priceLabel = `${formatUsd(addon.monthly)} / 1K rows`
              }

              return (
                <div
                  key={addon.key}
                  className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{addon.label}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-gray-500">{addon.description}</p>
                    {addon.key === 'overage_per_1k_rows' ? (
                      <p className="mt-1 text-xs text-gray-500">
                        Flat {formatUsd(OVERAGE_PER_1K_USD)} on every plan
                      </p>
                    ) : null}
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-gray-900 sm:text-right">{priceLabel}</p>
                </div>
              )
            })}
          </div>
        </div>
      ) : null}

      <p className="mx-auto mt-10 max-w-2xl text-center text-xs leading-relaxed text-gray-500">
        Prices shown are standard rack rates. Overage is billed at {formatUsd(OVERAGE_PER_1K_USD)} per
        1,000 additional feed rows beyond your included monthly allotment. Taxes may apply. Contact
        us for custom enterprise agreements.
      </p>
    </>
  )
}
