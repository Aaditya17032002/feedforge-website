'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import SiteLogo from '@/components/layout/SiteLogo'
import { GA_EVENTS, trackEvent } from '@/lib/analytics/gtag'
import { LOGIN_URL, SIGNUP_URL } from '@/lib/shared/app-urls'

type MenuId = 'product' | 'integrations' | 'resources'

type IntegrationLink = {
  label: string
  description: string
  href: string
  external?: boolean
  mark: 'shopify' | 'woo' | 'magento' | 'google' | 'meta' | 'bing' | 'chatgpt'
}

const PLATFORMS: IntegrationLink[] = [
  {
    label: 'Shopify',
    description: 'Connect in FeedForge',
    href: SIGNUP_URL,
    external: true,
    mark: 'shopify',
  },
  {
    label: 'WooCommerce',
    description: 'Import, optimize, and export',
    href: '/woocommerce',
    mark: 'woo',
  },
  {
    label: 'Magento',
    description: 'Connect in FeedForge',
    href: SIGNUP_URL,
    external: true,
    mark: 'magento',
  },
]

const CHANNELS: IntegrationLink[] = [
  {
    label: 'Google Shopping',
    description: 'Merchant Center feeds',
    href: SIGNUP_URL,
    external: true,
    mark: 'google',
  },
  {
    label: 'Meta',
    description: 'Catalog feeds for Meta',
    href: SIGNUP_URL,
    external: true,
    mark: 'meta',
  },
  {
    label: 'Bing Shopping',
    description: 'Microsoft Merchant Center',
    href: SIGNUP_URL,
    external: true,
    mark: 'bing',
  },
  {
    label: 'ChatGPT',
    description: 'OpenAI commerce feeds',
    href: SIGNUP_URL,
    external: true,
    mark: 'chatgpt',
  },
]

function triggerClass(open: boolean, active: boolean) {
  return `inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${
    open || active ? 'bg-accent/10 text-accent' : 'text-gray-700 hover:bg-gray-100 hover:text-accent'
  }`
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  )
}

const INTEGRATION_LOGOS: Record<IntegrationLink['mark'], string> = {
  shopify: '/images/integrations/shopify.svg',
  woo: '/images/integrations/woocommerce.svg',
  magento: '/images/integrations/magento.svg',
  google: '/images/integrations/google.svg',
  meta: '/images/integrations/meta.svg',
  bing: '/images/integrations/bing.svg',
  chatgpt: '/images/integrations/chatgpt.svg',
}

function IntegrationMark({ mark }: { mark: IntegrationLink['mark'] }) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-[#ffffff]">
      <img src={INTEGRATION_LOGOS[mark]} alt="" className="h-5 w-5 object-contain" />
    </span>
  )
}

export default function Header() {
  const [dark, setDark] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [openMenu, setOpenMenu] = useState<MenuId | null>(null)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const navLinkClass = (href: string) =>
    `text-sm font-medium transition-colors ${
      pathname === href ? 'text-accent' : 'text-gray-700 hover:text-accent'
    }`

  const trackNav = (linkText: string, href: string, location: 'header' | 'mobile_nav') => {
    trackEvent(GA_EVENTS.NAV_CLICK, { link_text: linkText, href, location })
  }

  const navigateToFeedDemo = (location: 'header' | 'mobile_header' | 'mobile_nav') => {
    trackEvent(GA_EVENTS.TRY_DEMO_CLICK, { location })
    if (pathname === '/') {
      window.history.pushState(null, '', '#try-your-product')
      document.getElementById('try-your-product')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      window.dispatchEvent(new Event('feedforge:nav-try-product'))
    } else {
      router.push('/#try-your-product')
    }
  }

  const closeMenus = () => {
    setOpenMenu(null)
    setMenuOpen(false)
  }

  useEffect(() => {
    const stored = localStorage.getItem('feedforge-theme')
    const isDark = stored === 'dark'
    document.documentElement.classList.toggle('dark', isDark)
    setDark(isDark)
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setOpenMenu(null)
    setMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!openMenu && !menuOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenMenu(null)
        setMenuOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [openMenu, menuOpen])

  const toggleTheme = () => {
    const next = !document.documentElement.classList.contains('dark')
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('feedforge-theme', next ? 'dark' : 'light')
    setDark(next)
  }

  const toggleDesktopMenu = (id: MenuId, event: React.MouseEvent<HTMLButtonElement>) => {
    // A mouse click follows hover, which has already opened the panel. Keep it open.
    // Keyboard activation has no pointer detail, so that click still toggles.
    if (event.detail > 0) {
      setOpenMenu(id)
      return
    }
    setOpenMenu((current) => (current === id ? null : id))
  }

  return (
    <header
      className={`sticky top-0 z-40 w-full border-b border-gray-200 transition-all duration-300 ${
        scrolled
          ? 'bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/70 dark:border-gray-800 dark:bg-gray-950/80 dark:supports-[backdrop-filter]:bg-gray-950/70'
          : 'bg-white dark:border-gray-800 dark:bg-gray-950'
      }`}
    >
      <div className="mx-auto flex max-w-7xl min-w-0 items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
        <SiteLogo
          className="flex min-w-0"
          imgClassName="h-[2.625rem] w-auto sm:h-[2.625rem]"
          location="header"
        />

        <nav className="relative hidden items-center gap-1 lg:flex nav-family" aria-label="Primary">
          <div
            className="relative"
            onMouseEnter={() => setOpenMenu('product')}
            onMouseLeave={() => setOpenMenu((current) => (current === 'product' ? null : current))}
          >
            <button
              type="button"
              className={triggerClass(openMenu === 'product', false)}
              aria-expanded={openMenu === 'product'}
              aria-haspopup="true"
              onClick={(event) => toggleDesktopMenu('product', event)}
            >
              Product
              <Chevron open={openMenu === 'product'} />
            </button>
            {openMenu === 'product' && (
              <div className="absolute left-0 top-full z-50 w-72 pt-3">
                <div className="rounded-2xl border border-gray-200 bg-white p-2 shadow-lg">
                  <Link
                    href="/"
                    className="block rounded-lg px-3 py-2.5 hover:bg-gray-50"
                    onClick={() => {
                      trackNav('Product overview', '/', 'header')
                      setOpenMenu(null)
                    }}
                  >
                    <span className="block text-sm font-semibold text-gray-900">Overview</span>
                    <span className="mt-0.5 block text-xs text-gray-600">AI-optimized product feeds</span>
                  </Link>
                  <button
                    type="button"
                    className="block w-full rounded-lg px-3 py-2.5 text-left hover:bg-gray-50"
                    onClick={() => {
                      setOpenMenu(null)
                      navigateToFeedDemo('header')
                    }}
                  >
                    <span className="block text-sm font-semibold text-gray-900">Try a product</span>
                    <span className="mt-0.5 block text-xs text-gray-600">See a title rewritten with AI</span>
                  </button>
                  <Link
                    href="/#request-demo"
                    className="block rounded-lg px-3 py-2.5 hover:bg-gray-50"
                    onClick={() => {
                      trackNav('Request a demo', '/#request-demo', 'header')
                      setOpenMenu(null)
                    }}
                  >
                    <span className="block text-sm font-semibold text-gray-900">Request a demo</span>
                    <span className="mt-0.5 block text-xs text-gray-600">Walk through a catalog with us</span>
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div
            className="relative"
            onMouseEnter={() => setOpenMenu('integrations')}
            onMouseLeave={() => setOpenMenu((current) => (current === 'integrations' ? null : current))}
          >
            <button
              type="button"
              className={triggerClass(openMenu === 'integrations', pathname.startsWith('/woocommerce'))}
              aria-expanded={openMenu === 'integrations'}
              aria-haspopup="true"
              onClick={(event) => toggleDesktopMenu('integrations', event)}
            >
              Integrations
              <Chevron open={openMenu === 'integrations'} />
            </button>
            {openMenu === 'integrations' && (
              <div className="absolute left-1/2 top-full z-50 w-[36rem] -translate-x-1/2 pt-3">
                <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-lg">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="px-2 text-[0.6875rem] font-semibold uppercase tracking-wider text-gray-400">
                        Ecommerce platforms
                      </p>
                      <ul className="mt-2 space-y-1">
                        {PLATFORMS.map((item) => (
                          <li key={item.label}>
                            <IntegrationItem item={item} onNavigate={closeMenus} location="header" />
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="px-2 text-[0.6875rem] font-semibold uppercase tracking-wider text-gray-400">
                        Sales channels
                      </p>
                      <ul className="mt-2 space-y-1">
                        {CHANNELS.map((item) => (
                          <li key={item.label}>
                            <IntegrationItem item={item} onNavigate={closeMenus} location="header" />
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <Link
                    href="/#try-your-product"
                    className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-accent/20 bg-gradient-to-br from-accent/[0.07] via-white to-accent/[0.04] px-4 py-3 transition-colors hover:border-accent/40"
                    onClick={() => {
                      trackNav('Connect your catalog', '/#try-your-product', 'header')
                      setOpenMenu(null)
                    }}
                  >
                    <span>
                      <span className="block text-sm font-bold text-gray-900">Connect your catalog. Optimize with AI.</span>
                      <span className="mt-1 block text-xs leading-relaxed text-gray-600">
                        Bring your product data together and prepare optimized feeds for your sales channels.
                      </span>
                    </span>
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-accent/20 bg-white text-accent" aria-hidden>
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16v10H4V7z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 11h4M8 14h2" />
                      </svg>
                    </span>
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div
            className="relative"
            onMouseEnter={() => setOpenMenu('resources')}
            onMouseLeave={() => setOpenMenu((current) => (current === 'resources' ? null : current))}
          >
            <button
              type="button"
              className={triggerClass(
                openMenu === 'resources',
                pathname === '/faqs' || pathname === '/contact',
              )}
              aria-expanded={openMenu === 'resources'}
              aria-haspopup="true"
              onClick={(event) => toggleDesktopMenu('resources', event)}
            >
              Resources
              <Chevron open={openMenu === 'resources'} />
            </button>
            {openMenu === 'resources' && (
              <div className="absolute left-0 top-full z-50 w-64 pt-3">
                <div className="rounded-2xl border border-gray-200 bg-white p-2 shadow-lg">
                  <Link
                    href="/faqs"
                    className="block rounded-lg px-3 py-2.5 hover:bg-gray-50"
                    onClick={() => {
                      trackNav('FAQs', '/faqs', 'header')
                      setOpenMenu(null)
                    }}
                  >
                    <span className="block text-sm font-semibold text-gray-900">FAQs</span>
                    <span className="mt-0.5 block text-xs text-gray-600">Setup, channels, and pricing</span>
                  </Link>
                  <Link
                    href="/contact"
                    className="block rounded-lg px-3 py-2.5 hover:bg-gray-50"
                    onClick={() => {
                      trackNav('Contact Us', '/contact', 'header')
                      setOpenMenu(null)
                    }}
                  >
                    <span className="block text-sm font-semibold text-gray-900">Contact</span>
                    <span className="mt-0.5 block text-xs text-gray-600">Talk with the FeedForge team</span>
                  </Link>
                </div>
              </div>
            )}
          </div>

          <Link
            href="/pricing"
            className={triggerClass(false, pathname === '/pricing')}
            onClick={() => trackNav('Pricing', '/pricing', 'header')}
          >
            Pricing
          </Link>
        </nav>

        <div className="hidden items-center lg:flex">
          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-10 w-10 items-center justify-center border border-r-0 border-gray-300 bg-white text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
            aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {dark ? (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            )}
          </button>
          <button
            type="button"
            onClick={() => navigateToFeedDemo('header')}
            className="flex h-10 shrink-0 items-center border border-r-0 border-gray-300 bg-white px-3 text-sm font-medium text-accent transition-colors hover:bg-accent/5 sm:px-4"
            aria-label="Open the AI product feed demo on the home page"
          >
            Try It Free
          </button>
          <a
            href={LOGIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent(GA_EVENTS.LOGIN_CLICK, { location: 'header' })}
            className="flex h-10 items-center border border-r-0 border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Log in
          </a>
          <a
            href={SIGNUP_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent(GA_EVENTS.SIGN_UP_CLICK, { location: 'header' })}
            className="flex h-10 items-center border border-l-0 border-accent bg-accent px-4 text-sm font-medium text-white transition-colors hover:bg-[#070066]"
          >
            Sign up
          </a>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-1 min-[400px]:gap-2 lg:hidden">
          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-10 w-10 items-center justify-center border border-gray-300 bg-white text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
            aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {dark ? (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            )}
          </button>
          <a
            href={SIGNUP_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent(GA_EVENTS.SIGN_UP_CLICK, { location: 'mobile_header' })}
            className="flex h-10 items-center border border-accent bg-accent px-3 text-xs font-medium text-white transition-colors hover:bg-[#070066] sm:px-4 sm:text-sm"
          >
            Sign up
          </a>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="flex h-10 w-10 items-center justify-center border border-gray-300 bg-white text-gray-700 transition-colors hover:bg-gray-50"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            {menuOpen ? (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="max-h-[calc(100vh-4.5rem)] overflow-y-auto border-t border-gray-200 bg-white px-4 py-4 shadow-lg lg:hidden">
          <nav className="flex flex-col gap-5 nav-family" aria-label="Mobile">
            <div>
              <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-gray-400">Product</p>
              <div className="mt-2 flex flex-col gap-2">
                <Link href="/" className={navLinkClass('/')} onClick={() => { trackNav('Overview', '/', 'mobile_nav'); closeMenus() }}>
                  Overview
                </Link>
                <button
                  type="button"
                  className="text-left text-sm font-medium text-gray-700"
                  onClick={() => {
                    navigateToFeedDemo('mobile_nav')
                    closeMenus()
                  }}
                >
                  Try a product
                </button>
                <Link href="/#request-demo" className={navLinkClass('/#request-demo')} onClick={() => { trackNav('Request a demo', '/#request-demo', 'mobile_nav'); closeMenus() }}>
                  Request a demo
                </Link>
              </div>
            </div>
            <div>
              <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-gray-400">Ecommerce platforms</p>
              <ul className="mt-2 space-y-1">
                {PLATFORMS.map((item) => (
                  <li key={item.label}>
                    <IntegrationItem item={item} onNavigate={closeMenus} location="mobile_nav" />
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-gray-400">Sales channels</p>
              <ul className="mt-2 space-y-1">
                {CHANNELS.map((item) => (
                  <li key={item.label}>
                    <IntegrationItem item={item} onNavigate={closeMenus} location="mobile_nav" />
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-gray-400">Resources</p>
              <div className="mt-2 flex flex-col gap-2">
                <Link href="/faqs" className={navLinkClass('/faqs')} onClick={() => { trackNav('FAQs', '/faqs', 'mobile_nav'); closeMenus() }}>
                  FAQs
                </Link>
                <Link href="/pricing" className={navLinkClass('/pricing')} onClick={() => { trackNav('Pricing', '/pricing', 'mobile_nav'); closeMenus() }}>
                  Pricing
                </Link>
                <Link href="/contact" className={navLinkClass('/contact')} onClick={() => { trackNav('Contact Us', '/contact', 'mobile_nav'); closeMenus() }}>
                  Contact
                </Link>
              </div>
            </div>
          </nav>
          <div className="mt-4 flex flex-col gap-2 border-t border-gray-200 pt-4">
            <button
              type="button"
              className="flex h-10 items-center justify-center border border-accent/40 bg-white text-sm font-medium text-accent transition-colors hover:bg-accent/5"
              onClick={() => {
                navigateToFeedDemo('mobile_nav')
                closeMenus()
              }}
            >
              Try It Free
            </button>
            <a
              href={LOGIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-10 items-center justify-center border border-gray-300 bg-white text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              onClick={() => {
                trackEvent(GA_EVENTS.LOGIN_CLICK, { location: 'mobile_nav' })
                closeMenus()
              }}
            >
              Log in
            </a>
          </div>
        </div>
      )}
    </header>
  )
}

function IntegrationItem({
  item,
  onNavigate,
  location,
}: {
  item: IntegrationLink
  onNavigate: () => void
  location: 'header' | 'mobile_nav'
}) {
  const className = 'flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-gray-50'
  const body = (
    <>
      <IntegrationMark mark={item.mark} />
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-gray-900">{item.label}</span>
        <span className="block text-xs text-gray-600">{item.description}</span>
      </span>
    </>
  )
  const onClick = () => {
    trackEvent(GA_EVENTS.NAV_CLICK, { link_text: item.label, href: item.href, location })
    onNavigate()
  }

  if (item.external) {
    return (
      <a href={item.href} target="_blank" rel="noopener noreferrer" className={className} onClick={onClick}>
        {body}
      </a>
    )
  }

  return (
    <Link href={item.href} className={className} onClick={onClick}>
      {body}
    </Link>
  )
}
