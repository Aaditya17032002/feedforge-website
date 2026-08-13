'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import SiteLogo from '@/components/layout/SiteLogo'
import { GA_EVENTS, trackEvent } from '@/lib/analytics/gtag'
import {
  CONTACT_ADDRESS_LINES,
  CONTACT_EMAIL,
  CONTACT_SUPPORT_HOURS,
} from '@/lib/content/contact'

const footerLinks = [
  { href: '/', label: 'Home' },
  { href: '/faqs', label: 'FAQs' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/contact', label: 'Contact Us' },
] as const

function linkIsActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/'
  if (href.startsWith('/#')) return false
  return pathname === href || pathname.startsWith(`${href}/`)
}

export default function Footer() {
  const pathname = usePathname()
  const currentYear = new Date().getFullYear()

  return (
    <footer className="mt-auto border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl min-w-0 px-4 py-10 sm:px-6 sm:py-12 lg:py-14">
        <div className="flex min-w-0 flex-col gap-10 sm:gap-12 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 lg:max-w-sm">
            <SiteLogo imgClassName="h-8 w-auto sm:h-9" location="footer" />
            <p className="mt-4 max-w-md text-sm leading-relaxed text-gray-600">
              AI-powered product feed management to import, optimize, validate, and export from one
              dashboard.
            </p>
          </div>

          <div className="flex min-w-0 flex-wrap gap-x-16 gap-y-10 sm:gap-x-20">
            <section
              className="min-w-0"
              aria-labelledby="footer-contact-heading"
            >
              <h3
                id="footer-contact-heading"
                className="mb-1.5 text-xs font-bold uppercase tracking-wide text-gray-500"
              >
                Contact
              </h3>
              <address className="not-italic">
                <ul className="-mt-1 flex w-full flex-col gap-0 text-sm leading-snug text-gray-700">
                  <li>
                    <a
                      href={`mailto:${CONTACT_EMAIL}`}
                      className="flex w-fit items-center rounded-md py-1 font-medium transition-colors hover:bg-gray-50 hover:text-accent"
                    >
                      {CONTACT_EMAIL}
                    </a>
                  </li>
                  {CONTACT_ADDRESS_LINES.map((line) => (
                    <li key={line}>
                      <span className="flex w-fit items-center py-1">{line}</span>
                    </li>
                  ))}
                  <li>
                    <span className="flex w-fit items-center py-1 text-xs text-gray-500">
                      {CONTACT_SUPPORT_HOURS}
                    </span>
                  </li>
                </ul>
              </address>
            </section>

            <nav
              className="nav-family flex min-w-0 flex-col items-start gap-0"
              aria-labelledby="footer-quick-links-heading"
            >
              <h3
                id="footer-quick-links-heading"
                className="mb-1.5 text-xs font-bold uppercase tracking-wide text-gray-500"
              >
                Quick Links
              </h3>
              <ul className="-mt-1 flex w-full flex-col gap-0">
                {footerLinks.map(({ href, label }) => {
                  const active = linkIsActive(pathname, href)
                  return (
                    <li key={`${href}-${label}`}>
                      <Link
                        href={href}
                        onClick={() =>
                          trackEvent(GA_EVENTS.NAV_CLICK, {
                            link_text: label,
                            href,
                            location: 'footer',
                          })
                        }
                        className={`flex w-fit items-center rounded-md py-1 text-sm leading-snug transition-colors ${
                          active
                            ? 'font-semibold text-accent'
                            : 'font-medium text-gray-700 hover:bg-gray-50 hover:text-accent'
                        }`}
                      >
                        {label}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </nav>
          </div>
        </div>
        <div className="mt-10 border-t border-gray-200 pt-5">
          <p className="text-xs text-gray-500">
            Copyright {currentYear} FeedForge. Built for reliable, production-ready feed operations.
          </p>
        </div>
      </div>
    </footer>
  )
}
