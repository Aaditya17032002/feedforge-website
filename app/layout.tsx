import type { Metadata } from 'next'
import { GoogleAnalytics } from '@next/third-parties/google'
import ChatbotMount from '@/components/chatbot/ChatbotMount'
import './globals.css'

const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

const siteTitle = 'FeedForge | AI-Optimized Product Feeds for Every Channel'
const siteDescription =
  'Transform your product catalog into high-performing listings across Google, Meta, marketplaces, and AI-powered discovery channels.'

export const metadata: Metadata = {
  metadataBase: new URL('https://feedforge.ai'),
  applicationName: 'FeedForge',
  title: {
    default: siteTitle,
    template: '%s | FeedForge',
  },
  description: siteDescription,
  keywords: [
    'FeedForge',
    'AI product feeds',
    'product feed optimization',
    'Google Shopping feeds',
    'Meta product feeds',
    'marketplace listings',
    'ecommerce feed management',
  ],
  authors: [{ name: 'FeedForge' }],
  creator: 'FeedForge',
  publisher: 'FeedForge',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'FeedForge',
    title: siteTitle,
    description: siteDescription,
    images: [
      {
        url: '/images/feedforge-logo.png',
        width: 1200,
        height: 630,
        alt: 'FeedForge logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteTitle,
    description: siteDescription,
    images: ['/images/feedforge-logo.png'],
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <ChatbotMount />
        {gaId ? <GoogleAnalytics gaId={gaId} /> : null}
      </body>
    </html>
  )
}

