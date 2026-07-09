import type { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import StartBuilding from '@/components/StartBuilding';
import { DiscountProgramsSection } from '@/components/pricing/DiscountProgramsSection';
import { PricingAddonsSection } from '@/components/pricing/PricingAddonsSection';
import { PricingContactCta } from '@/components/pricing/PricingContactCta';
import { PricingTierSection } from '@/components/pricing/PricingTierSection';
import { fetchPortalPricing } from '@/lib/server/pricing-api';

export const metadata: Metadata = {
  title: 'Pricing · FeedForge',
  description: 'Simple, catalog-based pricing for optimizing product feeds with AI across every channel.',
};

export default async function PricingPage() {
  const result = await fetchPortalPricing();
  const pricing = result.ok ? result.data : null;
  const fetchError = !result.ok;

  const hasTierCatalog =
    !fetchError && pricing?.tiers_meta?.ok !== false && (pricing?.tiers?.length ?? 0) > 0;

  const hasPrograms =
    hasTierCatalog &&
    (pricing?.programs?.length ?? 0) > 0 &&
    (pricing?.program_tier_previews?.length ?? 0) > 0;

  const hasAddons = hasTierCatalog && (pricing?.addons?.length ?? 0) > 0;

  const ctaReason =
    fetchError || pricing?.tiers_meta?.ok === false ? 'unavailable' : 'empty';

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      <main className="flex-1">
        <section className="border-t border-gray-200 bg-white">
          {hasTierCatalog ? (
            <>
              <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
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
                  includes FeedForge AI for titles, descriptions, and channel-ready feeds.
                  {hasPrograms ? ' Discount programs may be available for qualifying merchants.' : ''}
                </p>

                {hasPrograms && (
                  <div className="mx-auto mt-8 flex max-w-2xl items-center justify-center">
                    <a
                      href="#discount-programs"
                      className="group inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-full border border-accent/30 bg-accent/[0.06] px-4 py-2 text-center text-xs font-medium text-accent transition-colors hover:bg-accent/10 sm:text-sm"
                    >
                      View discount programs
                      <span className="underline group-hover:no-underline">↓</span>
                    </a>
                  </div>
                )}

                <div className="mx-auto mt-12 lg:mt-14">
                  <PricingTierSection
                    tiers={pricing?.tiers}
                    meta={pricing?.tiers_meta}
                    fetchError={false}
                  />
                  {hasAddons && <PricingAddonsSection addons={pricing?.addons} />}
                </div>

                <DiscountProgramsSection
                  programs={pricing?.programs}
                  previews={pricing?.program_tier_previews}
                />

                <p className="mx-auto mt-10 max-w-2xl text-center text-xs leading-relaxed text-gray-500">
                  Prices shown are standard rack rates. Overage is billed per 1,000 additional feed rows
                  processed beyond your included monthly allotment. Taxes may apply. Enterprise
                  agreements include custom terms and onboarding.
                  {pricing?.as_of ? ` Updated ${pricing.as_of}.` : ''}
                </p>
              </div>

              <StartBuilding />
            </>
          ) : (
            <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-28">
              <PricingContactCta fullWidth reason={ctaReason} />
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
