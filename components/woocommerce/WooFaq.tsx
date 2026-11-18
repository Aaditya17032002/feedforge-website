import FaqAccordion from '@/components/faqs/FaqAccordion'
import SectionHeading from '@/components/woocommerce/SectionHeading'
import { WOOCOMMERCE_FAQS } from '@/lib/content/woocommerce'

export default function WooFaq() {
  return (
    <section className="border-t border-gray-200 bg-white" aria-labelledby="woo-faq-heading">
      <div className="mx-auto max-w-7xl min-w-0 px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
        <SectionHeading
          id="woo-faq-heading"
          eyebrow="FAQs"
          title="WooCommerce connection"
          accent="questions."
        >
          Straight answers about setup, ChatGPT submission, validation, and what stays on your store.
        </SectionHeading>
        <FaqAccordion items={WOOCOMMERCE_FAQS} />
      </div>
    </section>
  )
}
