import FaqAccordion from '@/components/faqs/FaqAccordion'
import SectionHeading from '@/components/woocommerce/SectionHeading'
import { MAGENTO_FAQS } from '@/lib/content/magento'

export default function MagFaq() {
  return (
    <section className="border-t border-gray-200 bg-white" aria-labelledby="mag-faq-heading">
      <div className="mx-auto max-w-7xl min-w-0 px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
        <SectionHeading
          id="mag-faq-heading"
          eyebrow="FAQs"
          title="Magento connection"
          accent="questions."
        >
          Straight answers about setup, store views, ChatGPT submission, validation, and what stays on your store.
        </SectionHeading>
        <FaqAccordion items={MAGENTO_FAQS} />
      </div>
    </section>
  )
}
