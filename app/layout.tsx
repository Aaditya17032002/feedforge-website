import { GoogleAnalytics } from '@next/third-parties/google'
import ChatbotMount from '@/components/chatbot/ChatbotMount'
import JsonLd from '@/components/seo/JsonLd'
import { rootMetadata, siteJsonLd } from '@/lib/seo'
import './globals.css'

// GA_MEASUREMENT_ID is read at request time (Docker env_file). NEXT_PUBLIC_* is build-time only.
const gaId =
  process.env.NODE_ENV === 'production'
    ? process.env.GA_MEASUREMENT_ID?.trim() ||
      process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() ||
      undefined
    : undefined

export const metadata = rootMetadata

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <JsonLd data={siteJsonLd()} />
        {children}
        <ChatbotMount />
        {gaId ? <GoogleAnalytics gaId={gaId} /> : null}
      </body>
    </html>
  )
}

