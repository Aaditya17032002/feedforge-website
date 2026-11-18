import Link from 'next/link'
import AuditCta from '@/components/woocommerce/AuditCta'
import { MAGENTO_AUDIT_PATH, MAGENTO_CHANNELS, SYNC_PANEL_PRODUCTS } from '@/lib/content/magento'

const secondaryClass =
  'inline-flex items-center justify-center border border-gray-300 bg-white px-8 py-3 text-center text-sm font-semibold text-gray-900 transition-all duration-300 hover:-translate-y-0.5 hover:border-accent hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2'

export default function MagHero() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl min-w-0 px-4 py-10 sm:px-6 sm:py-12 lg:py-16">
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
            <li>
              <Link href="/" className="font-medium text-gray-700 transition-colors hover:text-accent">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="font-medium text-gray-900" aria-current="page">
              Magento
            </li>
          </ol>
        </nav>

        <div className="grid min-w-0 items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="min-w-0">
            <div className="mb-4">
              <span className="inline-flex max-w-full flex-wrap items-center gap-2 rounded-full border border-gray-200 bg-gray-100 px-3 py-1 text-[0.6875rem] font-medium text-gray-900 sm:text-xs">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gray-900" />
                <span className="min-w-0 text-pretty">For Magento and Adobe Commerce</span>
              </span>
            </div>
            <h1 className="mb-4 text-balance text-3xl font-bold leading-tight text-gray-900 sm:text-4xl lg:text-5xl">
              From One Magento Store View to <span className="text-accent">Every Channel.</span>
            </h1>
            <p className="mb-8 max-w-xl text-pretty text-sm leading-relaxed text-gray-600 sm:text-base">
              Choose the store view, connect with a catalog-read token, and prepare simple and configurable products
              for Google Merchant Center, ChatGPT, Bing Shopping, and Meta. Nothing is written back to Magento.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <AuditCta href={MAGENTO_AUDIT_PATH}>Get Free AI Channel Readiness Audit</AuditCta>
              <a href="#how-it-works" className={secondaryClass}>
                See How It Works
              </a>
            </div>
          </div>

          <div className="min-w-0">
            <div className="border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Store view</p>
                  <p className="mt-1 text-sm font-bold text-gray-900">Example: default</p>
                </div>
                <span className="shrink-0 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-900">
                  No extension
                </span>
              </div>
              <ul className="space-y-2">
                {SYNC_PANEL_PRODUCTS.map((product) => (
                  <li key={product.title} className="border border-gray-200 bg-gray-50 px-3 py-3">
                    <p className="text-sm font-medium text-gray-900">{product.title}</p>
                    <p className="text-xs text-gray-500">{product.meta}</p>
                  </li>
                ))}
              </ul>
              <div className="my-4 h-px bg-gray-200" />
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Exports</p>
              <ul className="space-y-2">
                {MAGENTO_CHANNELS.map((channel) => (
                  <li
                    key={channel.name}
                    className="flex items-center justify-between gap-3 border border-gray-200 px-3 py-2.5"
                  >
                    <span className="min-w-0 text-sm font-medium text-gray-900">{channel.name}</span>
                    <span className="shrink-0 text-xs font-medium text-accent">Export ready</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-gray-500">Example layout. Not a connected store.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
