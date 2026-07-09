/**
 * Server-side client for Portal pricing API.
 */

import { resolveBackendBaseUrl } from '@/lib/server/backend-url';

const PRICING_REQUEST_TIMEOUT_MS = 15_000;
const PRICING_REVALIDATE_SECONDS = 300;

export type PortalCatalogPriceItem = {
  item_key: string;
  label: string;
  item_type: string;
  msrp: number;
  currency: string;
};

export type PortalCatalogTier = {
  id: string;
  key: string;
  legacy_plan_key: string;
  name: string;
  sku_min: number;
  sku_max: number | null;
  sort_order: number;
  monthly_msrp: number | null;
  activation_msrp: number | null;
  prices: PortalCatalogPriceItem[];
};

export type PortalCatalogProgram = {
  id: string;
  name: string;
  description?: string | null;
  program_start: string;
  program_end?: string | null;
  max_redemptions?: number | null;
  redemption_count: number;
  slots_remaining?: number | null;
  min_commitment_months?: number | null;
  rule_count: number;
};

export type ProgramTierPreview = {
  program_id: string;
  program_name: string;
  tier_id: string;
  tier_key: string;
  tier_name: string;
  activation_msrp?: number | null;
  activation_final?: number | null;
  month1_total?: number | null;
  month2_monthly?: number | null;
  min_commitment_months?: number | null;
};

export type PortalAddonPrice = {
  item_key: string;
  label: string;
  msrp?: number | null;
  currency: string;
  billing_cadence?: string | null;
};

export type PortalPricingSectionMeta = {
  ok: boolean;
  error?: string | null;
};

export type PortalPricingResponse = {
  as_of: string;
  cached: boolean;
  cached_at?: string | null;
  tiers: PortalCatalogTier[];
  tiers_meta: PortalPricingSectionMeta;
  programs: PortalCatalogProgram[];
  program_tier_previews: ProgramTierPreview[];
  programs_meta: PortalPricingSectionMeta;
  addons: PortalAddonPrice[];
  addons_meta: PortalPricingSectionMeta;
};

export type PortalPricingResult =
  | { ok: true; data: PortalPricingResponse }
  | { ok: false; error: string };

/** @deprecated Use PortalCatalogTier */
export type PublicCatalogTier = PortalCatalogTier;
/** @deprecated Use PortalCatalogPriceItem */
export type PublicCatalogPriceItem = PortalCatalogPriceItem;
/** @deprecated Use PortalCatalogProgram */
export type PublicCatalogProgram = PortalCatalogProgram;
/** @deprecated Use PortalPricingResponse */
export type PublicPricingResponse = PortalPricingResponse;

export async function fetchPortalPricing(): Promise<PortalPricingResult> {
  const url = `${resolveBackendBaseUrl()}/api/v1/portal/pricing`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PRICING_REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
      next: { revalidate: PRICING_REVALIDATE_SECONDS, tags: ['portal-pricing'] },
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error('fetchPortalPricing failed:', res.status, body);
      return { ok: false, error: 'Pricing catalog is temporarily unavailable.' };
    }

    const data = (await res.json()) as PortalPricingResponse;
    return { ok: true, data };
  } catch (e) {
    console.error('fetchPortalPricing error:', e);
    return { ok: false, error: 'Pricing catalog is temporarily unavailable.' };
  } finally {
    clearTimeout(timeout);
  }
}

/** @deprecated Use fetchPortalPricing */
export const fetchPublicPricing = async (): Promise<PortalPricingResponse | null> => {
  const result = await fetchPortalPricing();
  return result.ok ? result.data : null;
};