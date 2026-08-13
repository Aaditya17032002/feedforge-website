'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import SiteLogo from '@/components/layout/SiteLogo'
import { GA_EVENTS, trackEvent } from '@/lib/analytics/gtag'
import { LOGIN_URL, SIGNUP_URL } from '@/lib/shared/app-urls'

export default function Header() {
  const [dark, setDark] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const navLinkClass = (href: string) =>
    `text-sm font-medium transition-colors ${
      pathname === href ? 'text-accent' : 'text-gray-700 hover:text-accent'
    }`

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

  const toggleTheme = () => {
    const next = !document.documentElement.classList.contains('dark')
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('feedforge-theme', next ? 'dark' : 'light')
    setDark(next)
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
        {/* Logo */}
        <SiteLogo className="flex min-w-0" imgClassName="h-[2.625rem] w-auto sm:h-[2.625rem]" />

        {/* Navigation */}
        <nav className="hidden items-center gap-8 md:flex nav-family">
          <Link href="/" className={navLinkClass('/')}>
            Home
          </Link>
          <Link href="/faqs" className={navLinkClass('/faqs')}>
            FAQs
          </Link>
          <Link href="/pricing" className={navLinkClass('/pricing')}>
            Pricing
          </Link>
          <Link href="/contact" className={navLinkClass('/contact')}>
            Contact Us
          </Link>
        </nav>

        {/* Right side actions — desktop */}
        <div className="hidden items-center md:flex">
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

        {/* Mobile: compact actions + menu */}
        <div className="flex shrink-0 items-center justify-end gap-1 min-[400px]:gap-2 md:hidden">
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
          <button
            type="button"
            onClick={() => navigateToFeedDemo('mobile_header')}
            className="flex h-10 max-w-[7.5rem] shrink-0 items-center border border-gray-300 bg-white px-2 text-xs font-medium text-accent transition-colors hover:bg-accent/5 min-[400px]:max-w-none min-[400px]:px-3 sm:text-sm"
            aria-label="Open the AI product feed demo on the home page"
          >
            <span className="truncate">Try It Free</span>
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
            onClick={() => setMenuOpen((o) => !o)}
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
        <div className="border-t border-gray-200 bg-white px-4 py-4 shadow-lg md:hidden">
          <nav className="flex flex-col gap-3 nav-family">
            <Link href="/" className={navLinkClass('/')} onClick={() => setMenuOpen(false)}>
              Home
            </Link>
            <Link href="/faqs" className={navLinkClass('/faqs')} onClick={() => setMenuOpen(false)}>
              FAQs
            </Link>
            <Link href="/pricing" className={navLinkClass('/pricing')} onClick={() => setMenuOpen(false)}>
              Pricing
            </Link>
            <Link href="/contact" className={navLinkClass('/contact')} onClick={() => setMenuOpen(false)}>
              Contact Us
            </Link>
          </nav>
          <div className="mt-4 flex flex-col gap-2 border-t border-gray-200 pt-4">
            <button
              type="button"
              className="flex h-10 items-center justify-center border border-accent/40 bg-white text-sm font-medium text-accent transition-colors hover:bg-accent/5"
              onClick={() => {
                navigateToFeedDemo('mobile_nav')
                setMenuOpen(false)
              }}
            >
             Try It Free
            </button>
            <a
              href="#"
              className="flex h-10 items-center justify-center border border-gray-300 bg-white text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              onClick={() => setMenuOpen(false)}
            >
              Contact
            </a>
            <a
              href={LOGIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-10 items-center justify-center border border-gray-300 bg-white text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              onClick={() => {
                trackEvent(GA_EVENTS.LOGIN_CLICK, { location: 'mobile_nav' })
                setMenuOpen(false)
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

