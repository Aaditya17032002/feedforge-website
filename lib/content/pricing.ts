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
  /**
   * Concise plan bullets (shared product capabilities).
   * Included rows are appended in the UI from `includedRows`.
   */
  features: string[]
}

export type PricingValueItem = {
  key: string
  emoji: string
  label: string
  description: string
}

export type PricingIncludedFeature = {
  key: string
  label: string
  description: string
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

/** Program marketing caps — aligned with Platform seed (max_redemptions / end date). */
export const FOUNDING_PROGRAM = {
  maxMerchants: 200,
  endsOnLabel: '31 December 2026',
  /** Seeded rules: activation free + first month free + 3-month min. */
  activationWaived: true,
  firstMonthFree: true,
  minCommitmentMonths: 3,
} as const

/** Shared capabilities included with every active plan (not per-tier gated in catalog). */
export const SHARED_PLAN_FEATURES = [
  'AI-powered product optimization',
  'Feed management & validation',
  'Channel-ready exports',
] as const

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
    features: [...SHARED_PLAN_FEATURES],
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
    features: [...SHARED_PLAN_FEATURES],
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
    features: [...SHARED_PLAN_FEATURES],
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
    features: [...SHARED_PLAN_FEATURES],
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
    features: [...SHARED_PLAN_FEATURES],
  },
]

/** Included product capabilities — maps to real Platform surfaces. */
export const PRICING_INCLUDED_FEATURES: PricingIncludedFeature[] = [
  {
    key: 'import',
    label: 'Import & Manage Your Catalog',
    description: 'Bring products in from Shopify, WooCommerce, CSV, or custom feeds.',
  },
  {
    key: 'ai_optimize',
    label: 'AI-Powered Product Optimization',
    description: 'Improve titles, descriptions, and attributes with FeedForge AI.',
  },
  {
    key: 'mapping',
    label: 'Feed Mapping & Validation',
    description: 'Map fields correctly and catch feed issues before they go live.',
  },
  {
    key: 'generation',
    label: 'Automated Feed Generation',
    description: 'Generate and refresh channel-ready feeds on your schedule.',
  },
  {
    key: 'exports',
    label: 'Multi-Channel Exports',
    description: 'Distribute to Google Shopping, Bing, Meta, and more.',
  },
  {
    key: 'insights',
    label: 'Catalog Quality Insights',
    description: 'See feed health and quality signals so you know what to fix next.',
  },
]

/** Expansion value (customer outcomes — not priced add-on labels). */
export const PRICING_VALUE_ITEMS: PricingValueItem[] = [
  {
    key: 'enhance_content',
    emoji: '✨',
    label: 'Enhance Product Content',
    description:
      'Improve titles, descriptions, attributes, and other product information with AI.',
  },
  {
    key: 'ai_search_visibility',
    emoji: '🤖',
    label: 'Get Discovered Across AI & Search',
    description:
      'Make your products easier for AI platforms and search engines to discover and understand.',
  },
  {
    key: 'reach_shoppers',
    emoji: '🛍️',
    label: 'Reach More Shoppers',
    description: 'Expand your presence across Google Shopping, Bing, Meta, and more.',
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
