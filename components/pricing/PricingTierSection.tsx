import { PricingContactCta } from '@/components/pricing/PricingContactCta';
import { PricingTierGrid } from '@/components/pricing/PricingTierGrid';
import type { PortalCatalogTier, PortalPricingSectionMeta } from '@/lib/server/pricing-api';

type PricingTierSectionProps = {
  tiers?: PortalCatalogTier[] | null;
  meta?: PortalPricingSectionMeta | null;
  fetchError?: boolean;
};

export function PricingTierSection({ tiers, meta, fetchError }: PricingTierSectionProps) {
  const safeTiers = tiers ?? [];
  const canShow = !fetchError && meta?.ok !== false && safeTiers.length > 0;

  if (canShow) {
    return <PricingTierGrid tiers={safeTiers} />;
  }

  return <PricingContactCta reason={fetchError || meta?.ok === false ? 'unavailable' : 'empty'} />;
}
