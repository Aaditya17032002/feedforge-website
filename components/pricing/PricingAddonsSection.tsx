import { formatMsrp } from '@/components/pricing/pricing-format';
import type { PortalAddonPrice } from '@/lib/server/pricing-api';

type PricingAddonsSectionProps = {
  addons?: PortalAddonPrice[] | null;
};

export function PricingAddonsSection({ addons }: PricingAddonsSectionProps) {
  const safeAddons = addons ?? [];
  if (safeAddons.length === 0) {
    return null;
  }

  return (
    <section className="mt-12 w-full border border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-6 py-4 sm:px-8">
        <h2 className="text-lg font-bold text-gray-900">Optional add-ons</h2>
        <p className="mt-1 text-xs text-gray-500">Available on every tier — billed monthly</p>
      </div>
      <ul className="divide-y divide-gray-100">
        {safeAddons.map((addon) => (
          <li
            key={addon.item_key}
            className="flex items-center justify-between gap-6 px-6 py-4 sm:px-8"
          >
            <span className="text-sm font-medium text-gray-900">{addon.label}</span>
            <span className="shrink-0 text-sm font-semibold text-gray-900">
              {addon.msrp != null ? `${formatMsrp(addon.msrp, addon.currency)}/mo` : '—'}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
