export type PricingTier = {
  name: string
  catalog: string
  activationFee: string
  monthly: string
  includedRows: string
  overage: string
  popular?: boolean
  cta: string
  ctaStyle: 'solid' | 'outline'
  /** App signup recommend key (legacy plan key), if applicable */
  recommendKey?: string
}

export type FoundingTier = {
  name: string
  popular?: boolean
  activationWas: string
  monthlyFromMonth2: string
  minCommitment: string
}

/** Marketing rack rates — static copy; not fetched from Platform. */
export const PRICING_TIERS: PricingTier[] = [
  {
    name: 'Starter',
    catalog: '0–1,000 SKUs',
    activationFee: '$99',
    monthly: '$49',
    includedRows: '15,000',
    overage: '$8',
    cta: 'Start with Starter',
    ctaStyle: 'outline',
    recommendKey: 'starter_500',
  },
  {
    name: 'Growth',
    catalog: '1,001–5,000 SKUs',
    activationFee: '$299',
    monthly: '$129',
    includedRows: '60,000',
    overage: '$6',
    popular: true,
    cta: 'Choose Growth',
    ctaStyle: 'solid',
    recommendKey: 'growth_1000',
  },
  {
    name: 'Scale',
    catalog: '5,001–15,000 SKUs',
    activationFee: '$799',
    monthly: '$299',
    includedRows: '250,000',
    overage: '$5',
    cta: 'Choose Scale',
    ctaStyle: 'outline',
    recommendKey: 'scale_5000',
  },
  {
    name: 'Pro',
    catalog: '15,001–50,000 SKUs',
    activationFee: '$1,999',
    monthly: '$699',
    includedRows: '800,000',
    overage: '$4',
    cta: 'Choose Pro',
    ctaStyle: 'outline',
    recommendKey: 'scale_5000',
  },
  {
    name: 'Enterprise',
    catalog: '50,001+ SKUs',
    activationFee: 'Custom',
    monthly: 'Custom',
    includedRows: 'Custom',
    overage: 'Custom',
    cta: 'Contact Sales',
    ctaStyle: 'outline',
  },
]

export const FOUNDING_TIERS: FoundingTier[] = [
  { name: 'Starter', activationWas: '$99', monthlyFromMonth2: '$49/mo', minCommitment: '3 months' },
  {
    name: 'Growth',
    popular: true,
    activationWas: '$299',
    monthlyFromMonth2: '$129/mo',
    minCommitment: '3 months',
  },
  { name: 'Scale', activationWas: '$799', monthlyFromMonth2: '$299/mo', minCommitment: '3 months' },
  { name: 'Pro', activationWas: '$1,999', monthlyFromMonth2: '$699/mo', minCommitment: '3 months' },
]
