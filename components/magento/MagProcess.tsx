import SectionHeading from '@/components/woocommerce/SectionHeading'
import { MAGENTO_STEPS } from '@/lib/content/magento'

export default function MagProcess() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-24 border-t border-gray-200 bg-white"
      aria-labelledby="mag-process-heading"
    >
      <div className="mx-auto max-w-7xl min-w-0 px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
        <SectionHeading
          id="mag-process-heading"
          eyebrow="How it works"
          title="Turn Your Magento Catalog Into"
          accent="AI-Ready Product Feeds."
        />
        <ol className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {MAGENTO_STEPS.map((step) => (
            <li key={step.number} className="border border-gray-200 bg-white p-5 shadow-sm">
              <p className="mb-3 text-xs font-bold tracking-wider text-accent">{step.number}</p>
              <h3 className="mb-2 text-base font-bold text-gray-900">{step.title}</h3>
              <p className="text-sm leading-relaxed text-gray-600">{step.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
