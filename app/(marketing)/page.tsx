import AuditPromo from '@/components/home/AuditPromo'
import Hero from '@/components/home/Hero'
import LogoCarousel from '@/components/home/LogoCarousel'
import SearchChanging from '@/components/home/SearchChanging'
import AISolution from '@/components/home/AISolution'
import SimpleProcess from '@/components/home/SimpleProcess'
import BuiltForTeams from '@/components/home/BuiltForTeams'
import CatalogPerfection from '@/components/home/CatalogPerfection'
import StartBuilding from '@/components/home/StartBuilding'
import DemoRequest from '@/components/forms/DemoRequest'
import { pageMetadata, SITE_DESCRIPTION, SITE_TITLE } from '@/lib/seo'

export const metadata = pageMetadata({
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  path: '/',
  absoluteTitle: true,
})

export default function Home() {
  return (
    <>
      <Hero />
      <LogoCarousel />
      <AuditPromo />
      <SearchChanging />
      <CatalogPerfection />
      <AISolution />
      <SimpleProcess />
      <BuiltForTeams />
      <DemoRequest />
      <StartBuilding />
    </>
  )
}
