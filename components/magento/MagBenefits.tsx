import SectionHeading from '@/components/woocommerce/SectionHeading'
import { MAGENTO_BENEFITS } from '@/lib/content/magento'

export default function MagBenefits() {
  return (
    <section className="border-t border-gray-200 bg-white" aria-labelledby="mag-benefits-heading">
      <div className="mx-auto max-w-7xl min-w-0 px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
        <SectionHeading id="mag-benefits-heading" eyebrow="Why FeedForge" title="Why" accent="FeedForge?" />
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MAGENTO_BENEFITS.map((benefit) => (
            <li
              key={benefit.title}
              className="border border-accent/20 bg-gradient-to-br from-white to-accent/[0.06] p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:shadow-accent/10"
            >
              <h3 className="mb-2 text-sm font-bold text-gray-900">{benefit.title}</h3>
              <p className="text-sm leading-relaxed text-gray-600">{benefit.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
