import Link from 'next/link'
import { WOOCOMMERCE_AUDIT_PATH } from '@/lib/content/woocommerce'

const primaryClass =
  'inline-flex items-center justify-center border border-accent bg-accent px-8 py-3 text-center text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#070066] hover:shadow-md hover:shadow-accent/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2'

type AuditCtaProps = {
  children: React.ReactNode
  className?: string
}

export default function AuditCta({ children, className }: AuditCtaProps) {
  return (
    <Link href={WOOCOMMERCE_AUDIT_PATH} className={className ? `${primaryClass} ${className}` : primaryClass}>
      {children}
    </Link>
  )
}
