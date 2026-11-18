import SectionHeading from '@/components/woocommerce/SectionHeading'
import { WOOCOMMERCE_CHANNELS } from '@/lib/content/woocommerce'

export default function WooChannels() {
  return (
    <section className="border-t border-gray-200 bg-white" aria-labelledby="woo-channels-heading">
      <div className="mx-auto max-w-7xl min-w-0 px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
        <SectionHeading
          id="woo-channels-heading"
          eyebrow="Channels"
          title="Prepare Your Products for the"
          accent="Next Generation of Shopping."
        >
          Each destination gets its own feed from the WooCommerce catalog. Delivery is over SFTP or HTTPS.
        </SectionHeading>
        <ul className="grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {WOOCOMMERCE_CHANNELS.map((channel) => (
            <li key={channel.name} className="min-w-0">
              <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-gray-200 bg-[#ffffff]">
                <img src={channel.logo} alt="" className="h-8 w-8 object-contain" />
              </span>
              <h3 className="text-base font-bold text-gray-900">{channel.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{channel.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
