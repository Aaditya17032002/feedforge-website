import Link from 'next/link';

type PricingContactCtaProps = {
  reason?: 'unavailable' | 'empty';
  fullWidth?: boolean;
};

export function PricingContactCta({ reason = 'unavailable', fullWidth = false }: PricingContactCtaProps) {
  const description =
    reason === 'empty'
      ? 'We are preparing updated plan tiers for your catalog size. Reach out and we will share pricing matched to your SKU count and channels.'
      : 'Live plan pricing is temporarily unavailable. Contact our team for a quote tailored to your catalog and growth plans.';

  if (fullWidth) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6 text-center sm:gap-8">
        <span className="inline-flex rounded-full border border-accent/30 bg-accent/[0.06] px-3 py-1 text-xs font-medium text-accent">
          Pricing inquiry
        </span>
        <h1 className="text-2xl font-bold leading-tight text-gray-900 sm:text-3xl lg:text-4xl lg:whitespace-nowrap">
          Let&apos;s find the right <span className="text-accent">plan</span> for you
        </h1>
        <p className="max-w-lg text-sm leading-relaxed text-gray-600 sm:text-base lg:text-lg">
          {description}
        </p>
        <Link
          href="/contact"
          className="mt-2 inline-block bg-accent px-8 py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#070066] hover:shadow-[0_10px_24px_-8px_rgba(9,0,136,0.55)] sm:text-base"
        >
          Contact us for pricing
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-5 border border-gray-200 bg-white px-8 py-10 text-center shadow-[0_12px_40px_-16px_rgba(0,0,0,0.14)] sm:px-10 sm:py-12">
      <span className="inline-flex rounded-full border border-accent/30 bg-accent/[0.06] px-3 py-1 text-xs font-medium text-accent">
        Pricing inquiry
      </span>
      <h2 className="text-2xl font-bold leading-tight text-gray-900 sm:text-3xl">
        Let&apos;s find the right <span className="text-accent">plan</span> for you
      </h2>
      <p className="text-sm leading-relaxed text-gray-600">{description}</p>
      <Link
        href="/contact"
        className="mt-1 inline-block w-full max-w-xs bg-accent px-6 py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#070066] hover:shadow-[0_10px_24px_-8px_rgba(9,0,136,0.55)] sm:w-auto"
      >
        Contact us for pricing
      </Link>
    </div>
  );
}
