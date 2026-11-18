import WooAudit from '@/components/woocommerce/WooAudit'
import WooBenefits from '@/components/woocommerce/WooBenefits'
import WooChannels from '@/components/woocommerce/WooChannels'
import WooFaq from '@/components/woocommerce/WooFaq'
import WooFinalCta from '@/components/woocommerce/WooFinalCta'
import WooHero from '@/components/woocommerce/WooHero'
import WooProblem from '@/components/woocommerce/WooProblem'
import WooProcess from '@/components/woocommerce/WooProcess'
import JsonLd from '@/components/seo/JsonLd'
import { WOOCOMMERCE_FAQS, WOOCOMMERCE_META } from '@/lib/content/woocommerce'
import { breadcrumbJsonLd, faqPageJsonLd, pageMetadata } from '@/lib/seo'

export const metadata = pageMetadata({
  title: WOOCOMMERCE_META.title,
  description: WOOCOMMERCE_META.description,
  path: '/woocommerce',
  absoluteTitle: true,
})

export default function WooCommercePage() {
  return (
    <>
      <JsonLd data={faqPageJsonLd(WOOCOMMERCE_FAQS)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'WooCommerce', path: '/woocommerce' },
        ])}
      />
      <WooHero />
      <WooProblem />
      <WooProcess />
      <WooAudit />
      <WooChannels />
      <WooBenefits />
      <WooFaq />
      <WooFinalCta />
    </>
  )
}
