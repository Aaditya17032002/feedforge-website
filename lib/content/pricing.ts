export type PricingStatus = 'active' | 'inactive'

/**
 * Must match Platform `tier_to_legacy_plan_key` in
 * `Backend/services/pricing_catalog_service.py` — used as `?recommend=` on signup.
 */
export const LEGACY_PLAN_KEYS = {
  starter: 'starter_500',
  growth: 'growth_1000',
  scale: 'scale_5000',
  /** Pro catalog band (~15k–50k SKUs). */
  pro: 'pro_15000',
  enterprise: 'enterprise',
} as const

export type PricingTier = {
  key: keyof typeof LEGACY_PLAN_KEYS | string
  name: string
  catalog: string
  /** One-time activation fee (USD). Waived when billing annually. */
  activationFee: number | null
  /** Monthly subscription MSRP (USD). */
  monthly: number | null
  includedRows: number | null
  popular?: boolean
  cta: string
  ctaStyle: 'solid' | 'outline'
  recommendKey?: string
  status: PricingStatus
}

export type PricingAddon = {
  key: string
  label: string
  description: string
  /** Monthly list price; null = usage / custom. */
  monthly: number | null
  /** How the price is billed in copy (always shown as monthly / usage — not toggled annual). */
  priceUnit: 'month' | 'per_1k_rows' | 'custom'
  status: PricingStatus
}

export type FoundingTier = {
  tierKey: string
  name: string
  popular?: boolean
  activationWas: number
  monthlyFromMonth2: number
  minCommitment: string
  status: PricingStatus
}

/** Flat overage rate for every plan ($ / 1K rows). */
export const OVERAGE_PER_1K_USD = 6

export function formatUsd(amount: number | null | undefined, fallback = 'Custom'): string {
  if (amount == null) return fallback
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatRowCount(rows: number | null | undefined): string {
  if (rows == null) return 'Custom'
  return rows.toLocaleString('en-US')
}

/** Active-only helper for marketing UI. */
export function isActive<T extends { status: PricingStatus }>(item: T): boolean {
  return item.status === 'active'
}

/** Marketing rack rates — static copy aligned with Platform seed catalog. */
export const PRICING_TIERS: PricingTier[] = [
  {
    key: 'starter',
    name: 'Starter',
    catalog: '0–1,000 SKUs',
    activationFee: 99,
    monthly: 49,
    includedRows: 15_000,
    cta: 'Start with Starter',
    ctaStyle: 'outline',
    recommendKey: LEGACY_PLAN_KEYS.starter,
    status: 'active',
  },
  {
    key: 'growth',
    name: 'Growth',
    catalog: '1,001–5,000 SKUs',
    activationFee: 299,
    monthly: 129,
    includedRows: 60_000,
    popular: true,
    cta: 'Choose Growth',
    ctaStyle: 'solid',
    recommendKey: LEGACY_PLAN_KEYS.growth,
    status: 'active',
  },
  {
    key: 'scale',
    name: 'Scale',
    catalog: '5,001–15,000 SKUs',
    activationFee: 799,
    monthly: 299,
    includedRows: 250_000,
    cta: 'Choose Scale',
    ctaStyle: 'outline',
    recommendKey: LEGACY_PLAN_KEYS.scale,
    status: 'active',
  },
  {
    key: 'pro',
    name: 'Pro',
    catalog: '15,001–50,000 SKUs',
    activationFee: 1_999,
    monthly: 699,
    includedRows: 800_000,
    cta: 'Choose Pro',
    ctaStyle: 'outline',
    recommendKey: LEGACY_PLAN_KEYS.pro,
    status: 'active',
  },
  {
    key: 'enterprise',
    name: 'Enterprise',
    catalog: '50,001+ SKUs',
    activationFee: null,
    monthly: null,
    includedRows: null,
    cta: 'Contact Sales',
    ctaStyle: 'outline',
    recommendKey: LEGACY_PLAN_KEYS.enterprise,
    status: 'inactive',
  },
]

/** Optional catalog add-ons (prices always monthly / usage — not affected by Annual toggle). */
export const PRICING_ADDONS: PricingAddon[] = [
  {
    key: 'addon_json_ld',
    label: 'JSON-LD structured data',
    description: 'Schema.org markup for richer product discovery.',
    monthly: 19,
    priceUnit: 'month',
    status: 'active',
  },
  {
    key: 'addon_enrichment',
    label: 'AI enrichment add-on',
    description: 'Extra AI enrichment capacity beyond your plan.',
    monthly: 19,
    priceUnit: 'month',
    status: 'active',
  },
  {
    key: 'addon_llms_txt',
    label: 'LLMs.txt generation',
    description: 'Publish an llms.txt map of your catalog for AI crawlers.',
    monthly: 19,
    priceUnit: 'month',
    status: 'active',
  },
  {
    key: 'addon_channel_export',
    label: 'Channel export add-on',
    description: 'Additional export channels beyond your included set.',
    monthly: 19,
    priceUnit: 'month',
    status: 'active',
  },
  {
    key: 'overage_per_1k_rows',
    label: 'Overage per 1,000 rows',
    description:
      'Billed for feed rows processed beyond your plan’s included monthly allotment. Same rate on every plan.',
    monthly: OVERAGE_PER_1K_USD,
    priceUnit: 'per_1k_rows',
    status: 'active',
  },
]

export const FOUNDING_TIERS: FoundingTier[] = [
  {
    tierKey: 'starter',
    name: 'Starter',
    activationWas: 99,
    monthlyFromMonth2: 49,
    minCommitment: '3 months',
    status: 'active',
  },
  {
    tierKey: 'growth',
    name: 'Growth',
    popular: true,
    activationWas: 299,
    monthlyFromMonth2: 129,
    minCommitment: '3 months',
    status: 'active',
  },
  {
    tierKey: 'scale',
    name: 'Scale',
    activationWas: 799,
    monthlyFromMonth2: 299,
    minCommitment: '3 months',
    status: 'active',
  },
  {
    tierKey: 'pro',
    name: 'Pro',
    activationWas: 1_999,
    monthlyFromMonth2: 699,
    minCommitment: '3 months',
    status: 'active',
  },
]
