import type { PortalCatalogProgram, ProgramTierPreview } from '@/lib/server/pricing-api';
import { formatUsdShort } from '@/components/pricing/pricing-format';

function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2l2.9 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 7.1-1.01L12 2z" />
    </svg>
  );
}

function formatActivationCell(preview: ProgramTierPreview) {
  const was = preview.activation_msrp;
  const final = preview.activation_final ?? 0;
  if (final <= 0) {
    return (
      <>
        <span className="font-semibold text-accent">Free</span>
        {was != null && was > 0 && (
          <span className="ml-1 text-xs text-gray-400 line-through">{formatUsdShort(was)}</span>
        )}
      </>
    );
  }
  return <span className="font-medium text-gray-900">{formatUsdShort(final)}</span>;
}

function formatMonth1(preview: ProgramTierPreview) {
  const total = preview.month1_total ?? 0;
  if (total <= 0) {
    return <span className="font-semibold text-accent">Free</span>;
  }
  return <span className="font-semibold text-accent">{formatUsdShort(total)}</span>;
}

function formatProgramEnd(programEnd?: string | null): string | null {
  if (!programEnd) return null;
  const parsed = new Date(programEnd);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function ProgramBlock({
  program,
  previews,
}: {
  program: PortalCatalogProgram;
  previews: ProgramTierPreview[];
}) {
  const tierPreviews = previews.filter((p) => p.program_id === program.id);
  if (tierPreviews.length === 0) return null;

  const endLabel = formatProgramEnd(program.program_end);

  return (
    <div className="border border-accent/30 bg-accent/[0.04]">
      <div className="border-b border-accent/20 px-6 py-6 sm:px-8">
        <h3 className="text-xl font-bold text-gray-900 sm:text-2xl">{program.name}</h3>
        {program.description && (
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-gray-700">{program.description}</p>
        )}
        {program.slots_remaining != null && (
          <p className="mt-2 text-xs text-gray-600">
            <span className="font-semibold text-gray-900">{program.slots_remaining}</span> slots
            remaining
          </p>
        )}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[36rem] border-collapse text-left">
          <thead>
            <tr className="border-b border-accent/20 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <th className="px-6 py-4 sm:px-8">Tier</th>
              <th className="px-6 py-4">Activation fee</th>
              <th className="px-6 py-4">Month 1</th>
              <th className="px-6 py-4">Monthly from month 2</th>
              <th className="px-6 py-4">Min. commitment</th>
            </tr>
          </thead>
          <tbody>
            {tierPreviews.map((preview) => {
              const isPopular = preview.tier_key === 'growth';
              return (
                <tr
                  key={`${preview.program_id}-${preview.tier_id}`}
                  className={`border-b border-accent/10 last:border-b-0 ${isPopular ? 'bg-accent/[0.05]' : ''}`}
                >
                  <td className="px-6 py-4 sm:px-8">
                    <span className="inline-flex items-center gap-1.5 font-bold text-gray-900">
                      {preview.tier_name}
                      {isPopular && <StarIcon className="h-3.5 w-3.5 text-accent" />}
                    </span>
                  </td>
                  <td className="px-6 py-4">{formatActivationCell(preview)}</td>
                  <td className="px-6 py-4">{formatMonth1(preview)}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {preview.month2_monthly != null ? `${formatUsdShort(preview.month2_monthly)}/mo` : '—'}
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    {preview.min_commitment_months ? `${preview.min_commitment_months} months` : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-accent/10 md:hidden">
        {tierPreviews.map((preview) => {
          const isPopular = preview.tier_key === 'growth';
          return (
            <div
              key={`${preview.program_id}-${preview.tier_id}-mobile`}
              className={`px-6 py-5 ${isPopular ? 'bg-accent/[0.05]' : ''}`}
            >
              <div className="mb-3 flex items-center gap-1.5">
                <span className="font-bold text-gray-900">{preview.tier_name}</span>
                {isPopular && <StarIcon className="h-3.5 w-3.5 text-accent" />}
              </div>
              <dl className="grid grid-cols-2 gap-y-2 text-sm">
                <dt className="text-gray-600">Activation fee</dt>
                <dd className="text-right">{formatActivationCell(preview)}</dd>
                <dt className="text-gray-600">Month 1</dt>
                <dd className="text-right">{formatMonth1(preview)}</dd>
                <dt className="text-gray-600">From month 2</dt>
                <dd className="text-right font-medium text-gray-900">
                  {preview.month2_monthly != null ? `${formatUsdShort(preview.month2_monthly)}/mo` : '—'}
                </dd>
                <dt className="text-gray-600">Min. commitment</dt>
                <dd className="text-right text-gray-700">
                  {preview.min_commitment_months ? `${preview.min_commitment_months} months` : '—'}
                </dd>
              </dl>
            </div>
          );
        })}
      </div>

      {(program.max_redemptions != null || endLabel) && (
        <div className="border-t border-accent/10 px-6 py-4 sm:px-8">
          <p className="text-sm leading-relaxed text-gray-700">
            <span className="font-semibold text-gray-900">Program terms:</span>{' '}
            {program.max_redemptions != null && (
              <>Available to the first {program.max_redemptions} merchants</>
            )}
            {program.max_redemptions != null && endLabel && <>, or through {endLabel}</>}
            {program.max_redemptions == null && endLabel && <>Available through {endLabel}</>}
            {(program.max_redemptions != null || endLabel) && (
              <> — whichever comes first. After the program closes, standard rates apply.</>
            )}
          </p>
        </div>
      )}
    </div>
  );
}

type DiscountProgramsSectionProps = {
  programs?: PortalCatalogProgram[] | null;
  previews?: ProgramTierPreview[] | null;
};

export function DiscountProgramsSection({ programs, previews }: DiscountProgramsSectionProps) {
  const safePrograms = programs ?? [];
  const safePreviews = previews ?? [];

  const programsWithPreviews = safePrograms.filter((program) =>
    safePreviews.some((p) => p.program_id === program.id)
  );

  if (programsWithPreviews.length === 0) {
    return null;
  }

  return (
    <div id="discount-programs" className="mt-14 w-full scroll-mt-24 space-y-6 sm:mt-16">
      <h2 className="text-center text-xl font-bold text-gray-900 sm:text-2xl">Discount programs</h2>
      {programsWithPreviews.map((program) => (
        <ProgramBlock key={program.id} program={program} previews={safePreviews} />
      ))}
    </div>
  );
}
