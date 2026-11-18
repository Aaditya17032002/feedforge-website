import type { Metadata } from 'next'
import { CONTACT_EMAIL } from '@/lib/content/contact'
import { isActive, PRICING_TIERS } from '@/lib/content/pricing'

export const SITE_URL = 'https://feedforge.ai'
export const SITE_NAME = 'FeedForge'
export const SITE_TITLE = 'FeedForge | AI-Optimized Product Feeds'
export const SITE_DESCRIPTION =
  'Turn your catalog into Google Merchant Center and Meta feeds, with AI-written titles and descriptions. Export CSV or JSON over SFTP or HTTPS.'

const OG_IMAGE = {
  url: '/images/feedforge-logo.png',
  width: 1200,
  height: 630,
  alt: 'FeedForge logo',
} as const

type PageMetadataInput = {
  /** Short title. The root template appends ` | FeedForge`, unless `absoluteTitle` is set. */
  title: string
  description: string
  /** Path beginning with `/`. Used as the self-referencing canonical and Open Graph URL. */
  path: string
  /** Homepage keeps its existing title instead of running it through the template. */
  absoluteTitle?: boolean
  /** Set false for thin pages that should stay out of the index. */
  index?: boolean
  /** 404 has no stable URL, so it should not declare a canonical. */
  canonical?: boolean
}

export function pageMetadata({
  title,
  description,
  path,
  absoluteTitle = false,
  index = true,
  canonical = true,
}: PageMetadataInput): Metadata {
  const socialTitle = absoluteTitle ? title : `${title} | ${SITE_NAME}`

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    ...(canonical ? { alternates: { canonical: path } } : {}),
    // Page-level openGraph and twitter replace the root values in Next.js 14,
    // so the shared image, card, and site name are repeated here.
    openGraph: {
      type: 'website',
      locale: 'en_US',
      siteName: SITE_NAME,
      title: socialTitle,
      description,
      images: [OG_IMAGE],
      ...(canonical ? { url: path } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: socialTitle,
      description,
      images: [OG_IMAGE.url],
    },
    ...(index
      ? {}
      : {
          robots: {
            index: false,
            follow: true,
            googleBot: {
              index: false,
              follow: true,
            },
          },
        }),
  }
}

export const rootMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  title: {
    default: SITE_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: SITE_NAME,
    images: [OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    images: [OG_IMAGE.url],
  },
  icons: {
    icon: [
      { url: '/favicon_io/favicon.ico' },
      { url: '/favicon_io/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon_io/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    shortcut: '/favicon_io/favicon.ico',
    apple: '/favicon_io/apple-touch-icon.png',
  },
  manifest: '/favicon_io/site.webmanifest',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
}

/** Public pages that should appear in the sitemap. `/products` stays out until it has real content. */
export const INDEXABLE_PATHS = ['/', '/pricing', '/faqs', '/contact', '/woocommerce', '/magento'] as const

export function breadcrumbJsonLd(items: readonly { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.path === '/' ? '/' : item.path}`,
    })),
  }
}

export function siteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: SITE_NAME,
        url: SITE_URL,
        email: CONTACT_EMAIL,
        logo: `${SITE_URL}/images/feedforge-logo.png`,
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        name: SITE_NAME,
        url: SITE_URL,
        description: SITE_DESCRIPTION,
        publisher: { '@id': `${SITE_URL}/#organization` },
      },
    ],
  }
}

export function softwareApplicationJsonLd() {
  const offers = PRICING_TIERS.filter(isActive).flatMap((tier) => {
    if (tier.monthly == null) return []
    return [
      {
        '@type': 'Offer',
        name: tier.name,
        description: tier.catalog,
        price: String(tier.monthly),
        priceCurrency: 'USD',
        url: `${SITE_URL}/pricing`,
      },
    ]
  })

  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: SITE_NAME,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    offers,
  }
}

export function faqPageJsonLd(items: readonly { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }
}
