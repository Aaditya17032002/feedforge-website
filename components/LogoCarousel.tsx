'use client'

import Image from 'next/image'

const logos: Array<{ name: string; src?: string }> = [
  { name: 'Back in the Saddle', src: '/images/back-in-the-saddle-logo.png' },
  { name: 'Catalog Favorites', src: '/images/Favourite%20Catalog.png' },
  { name: 'Chadwicks', src: '/images/chadwicks-logo.png' },
  { name: 'Country Store Catalog', src: '/images/country-store-catalog-logo.png' },
  { name: 'Expressions', src: '/images/Expressions.png' },
  { name: 'In the Company of Dogs', src: '/images/in-the-company-of-dogs-logo.png' },
  { name: "Magellan's", src: '/images/magellans-logo.png' },
  { name: "Nature's Jewelry", src: '/images/natures-jewelry-logo.png' },
  { name: 'North Style', src: '/images/northstyle-logo.png' },
  { name: 'Potpourri Gifts', src: '/images/Potpourri.png' },
  { name: 'Pyramid Collection', src: '/images/Pyramid%20Collection.png' },
  { name: 'Sagefinds', src: '/images/sagefinds-logo.png' },
  { name: 'Serengeti Fashions', src: '/images/serengeti-logo.png' },
  { name: 'The Stitchery', src: '/images/the-stitchery-logo.png' },
  { name: 'Whatever Works', src: '/images/whatever-works-logo.png' },
  { name: 'Young Explorers', src: '/images/young-explorers-logo.png' },
]

const duplicatedLogos = [...logos, ...logos, ...logos]

const SLOT =
  'relative flex h-[52px] w-[168px] flex-shrink-0 items-center justify-center sm:h-[56px] sm:w-[184px]'

export default function LogoCarousel() {
  return (
    <section className="min-w-0 overflow-x-hidden border-t border-gray-200 bg-white py-6">
      <div className="relative mx-auto w-full min-w-0 max-w-4xl px-4 sm:px-6">
        <div className="flex w-max animate-scroll items-center gap-10 will-change-transform motion-reduce:animate-none md:gap-14">
          {duplicatedLogos.map((logo, index) => (
            <div key={index} className={SLOT}>
              {logo.src ? (
                <Image
                  src={logo.src}
                  alt=""
                  fill
                  className="object-contain object-center"
                  sizes="(max-width: 640px) 168px, 184px"
                />
              ) : (
                <span className="line-clamp-2 px-2 text-center text-xs font-semibold leading-tight text-gray-900 sm:text-sm">
                  {logo.name}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
      <span className="sr-only">
        Brands:{' '}
        {logos
          .map((l) => l.name)
          .filter(Boolean)
          .join(', ')}
      </span>
    </section>
  )
}
