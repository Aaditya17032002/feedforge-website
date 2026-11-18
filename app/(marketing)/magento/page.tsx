import MagAudit from '@/components/magento/MagAudit'
import MagBenefits from '@/components/magento/MagBenefits'
import MagChannels from '@/components/magento/MagChannels'
import MagFaq from '@/components/magento/MagFaq'
import MagFinalCta from '@/components/magento/MagFinalCta'
import MagHero from '@/components/magento/MagHero'
import MagProblem from '@/components/magento/MagProblem'
import MagProcess from '@/components/magento/MagProcess'
import JsonLd from '@/components/seo/JsonLd'
import { MAGENTO_FAQS, MAGENTO_META } from '@/lib/content/magento'
import { breadcrumbJsonLd, faqPageJsonLd, pageMetadata } from '@/lib/seo'

export const metadata = pageMetadata({
  title: MAGENTO_META.title,
  description: MAGENTO_META.description,
  path: '/magento',
  absoluteTitle: true,
})

export default function MagentoPage() {
  return (
    <>
      <JsonLd data={faqPageJsonLd(MAGENTO_FAQS)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Magento', path: '/magento' },
        ])}
      />
      <MagHero />
      <MagProblem />
      <MagProcess />
      <MagAudit />
      <MagChannels />
      <MagBenefits />
      <MagFaq />
      <MagFinalCta />
    </>
  )
}
