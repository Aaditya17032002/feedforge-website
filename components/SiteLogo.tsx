'use client'

import Link from 'next/link'

type SiteLogoProps = {
  className?: string
  imgClassName?: string
}

export default function SiteLogo({
  className,
  imgClassName = 'h-11 w-auto sm:h-11',
}: SiteLogoProps) {
  return (
    <Link
      href="/"
      className={`inline-flex min-w-0 shrink-0 items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${className ?? ''}`}
      aria-label="FeedForge home"
    >
      <img
        src="/images/icon-1.svg"
        alt="FeedForge logo mark"
        width={189}
        height={44}
        className={`${imgClassName} object-contain object-left dark:hidden`}
        draggable={false}
      />
      <img
        src="/images/icon-2.svg"
        alt="FeedForge logo mark"
        width={189}
        height={44}
        className={`${imgClassName} hidden object-contain object-left dark:block`}
        draggable={false}
      />
      {/* <span className="ml-2 text-base font-light uppercase tracking-[0.14em] text-[#586487] dark:text-white sm:text-lg">
        FEEDFORGE.AI
      </span> */}
    </Link>
  )
}
