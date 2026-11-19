import AuditNudge from '@/components/audit/AuditNudge'
import Footer from '@/components/layout/Footer'
import Header from '@/components/layout/Header'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      <main className="min-w-0 flex-1">{children}</main>
      <Footer />
      <AuditNudge />
    </div>
  )
}
