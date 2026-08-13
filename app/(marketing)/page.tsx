import Hero from '@/components/home/Hero'
import LogoCarousel from '@/components/home/LogoCarousel'
import StatsBanner from '@/components/home/StatsBanner'
import SearchChanging from '@/components/home/SearchChanging'
import AISolution from '@/components/home/AISolution'
import SimpleProcess from '@/components/home/SimpleProcess'
import BuiltForTeams from '@/components/home/BuiltForTeams'
import CatalogPerfection from '@/components/home/CatalogPerfection'
import StartBuilding from '@/components/home/StartBuilding'
import DemoRequest from '@/components/forms/DemoRequest'

export default function Home() {
  return (
    <>
      <Hero />
      <LogoCarousel />
      <StatsBanner />
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
