import type { PortalCatalogPriceItem, PortalCatalogTier } from '@/lib/server/pricing-api';

export function formatMsrp(msrp?: number | null, currency = 'USD'): string {
  if (msrp == null) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(msrp);
}

export function formatCatalogBand(skuMin: number, skuMax: number | null): string {
  if (skuMax == null) return `${skuMin.toLocaleString()}+ SKUs`;
  return `${skuMin.toLocaleString()}–${skuMax.toLocaleString()} SKUs`;
}

export function formatRowCount(msrp?: number | null): string {
  if (msrp == null) return '—';
  return Math.round(msrp).toLocaleString();
}

export function priceByItemKey(prices: PortalCatalogPriceItem[], key: string): number | null {
  const row = prices.find((p) => p.item_key === key);
  return row?.msrp ?? null;
}

export function currencyByItemKey(prices: PortalCatalogPriceItem[], key: string): string {
  const row = prices.find((p) => p.item_key === key);
  return row?.currency ?? 'USD';
}

export function formatMonthlyHeadline(tier: PortalCatalogTier): string {
  if (tier.key === 'enterprise') return 'Custom';
  const monthly = priceByItemKey(tier.prices, 'monthly_fee') ?? tier.monthly_msrp;
  if (monthly == null) return '—';
  return formatMsrp(monthly, currencyByItemKey(tier.prices, 'monthly_fee')).replace('.00', '');
}

export function formatUsdShort(amount?: number | null): string {
  if (amount == null) return '—';
  const s = formatMsrp(amount);
  return amount % 1 === 0 ? s.replace('.00', '') : s;
}
