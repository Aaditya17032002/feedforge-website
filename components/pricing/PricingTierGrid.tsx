import Link from 'next/link';
import type { CSSProperties } from 'react';

import { SIGNUP_URL } from '@/lib/shared/app-urls';
import type { PortalCatalogTier } from '@/lib/server/pricing-api';
import {
  currencyByItemKey,
  formatCatalogBand,
  formatMonthlyHeadline,
  formatMsrp,
  formatRowCount,
  priceByItemKey,
} from '@/components/pricing/pricing-format';

function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2l2.9 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 7.1-1.01L12 2z" />
    </svg>
  );
}

function StatRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`text-sm font-semibold ${accent ? 'text-accent' : 'text-gray-900'}`}>{value}</span>
    </div>
  );
}

export function PricingTierGrid({ tiers }: { tiers: PortalCatalogTier[] }) {
  const sorted = [...tiers].sort((a, b) => a.sort_order - b.sort_order);
  const tierCount = sorted.length;

  return (
    <div
      className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:[grid-template-columns:repeat(var(--tier-count),minmax(0,1fr))]"
      style={{ '--tier-count': tierCount } as CSSProperties}
    >
      {sorted.map((tier) => {
        const isPopular = tier.key === 'growth';
        const isEnterprise = tier.key === 'enterprise';
        const prices = tier.prices;
        const activation = priceByItemKey(prices, 'activation_fee') ?? tier.activation_msrp;
        const includedRows = priceByItemKey(prices, 'included_rows_monthly');
        const overage = priceByItemKey(prices, 'overage_per_1k_rows');
        const monthlyDisplay = formatMonthlyHeadline(tier);
        const ctaHref = isEnterprise ? '/contact' : `${SIGNUP_URL}?recommend=${tier.legacy_plan_key}`;
        const ctaLabel = isEnterprise ? 'Contact Sales' : `Choose ${tier.name}`;

        return (
          <div
            key={tier.id}
            className={`relative flex flex-col border bg-white p-6 transition-shadow ${
              isPopular
                ? 'border-accent shadow-[0_12px_40px_-12px_rgba(9,0,136,0.35)]'
                : 'border-gray-200 hover:shadow-[0_12px_40px_-16px_rgba(0,0,0,0.18)]'
            }`}
          >
            {isPopular && (
              <span className="absolute -top-3 left-6 inline-flex items-center gap-1 bg-accent px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                <StarIcon className="h-3 w-3" />
                Most popular
              </span>
            )}

            <h2 className="text-xl font-bold text-gray-900">{tier.name}</h2>
            <p className="mt-1 text-xs font-medium text-gray-500">{formatCatalogBand(tier.sku_min, tier.sku_max)}</p>

            <div className="mt-5 flex items-baseline gap-1">
              <span className="text-3xl font-bold text-accent">{monthlyDisplay}</span>
              {!isEnterprise && <span className="text-sm font-medium text-gray-500">/mo</span>}
            </div>
            <p className="mt-1 text-xs text-gray-500">Monthly subscription</p>

            <div className="mt-5 divide-y divide-gray-100 border-y border-gray-100">
              <StatRow
                label="Activation fee"
                value={
                  isEnterprise
                    ? 'Custom'
                    : activation != null
                      ? formatMsrp(activation, currencyByItemKey(prices, 'activation_fee'))
                      : '—'
                }
              />
              <StatRow label="Included rows / mo" value={isEnterprise ? 'Custom' : formatRowCount(includedRows)} />
              <StatRow
                label="Overage / 1K rows"
                value={
                  isEnterprise
                    ? 'Custom'
                    : overage != null
                      ? formatMsrp(overage, currencyByItemKey(prices, 'overage_per_1k_rows'))
                      : '—'
                }
              />
            </div>

            <div className="flex-1" />

            <Link
              href={ctaHref}
              className={`mt-6 block w-full px-4 py-3 text-center text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 ${
                isPopular
                  ? 'bg-accent text-white hover:bg-[#070066] hover:shadow-[0_10px_24px_-8px_rgba(9,0,136,0.55)]'
                  : 'border border-gray-900 bg-white text-gray-900 hover:border-accent hover:bg-accent hover:text-white hover:shadow-[0_10px_24px_-8px_rgba(9,0,136,0.45)]'
              }`}
            >
              {ctaLabel}
            </Link>
          </div>
        );
      })}
    </div>
  );
}
