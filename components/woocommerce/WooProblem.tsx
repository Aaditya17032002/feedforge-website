import SectionHeading from '@/components/woocommerce/SectionHeading'
import { WOOCOMMERCE_CALLOUTS, WOOCOMMERCE_PROBLEMS } from '@/lib/content/woocommerce'

const icons = [
  <svg key="visibility" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>,
  <svg key="data" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>,
  <svg key="rules" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
  </svg>,
  <svg key="manual" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>,
]

export default function WooProblem() {
  return (
    <section className="border-t border-gray-200 bg-white" aria-labelledby="woo-problem-heading">
      <div className="mx-auto max-w-7xl min-w-0 px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
        <SectionHeading
          id="woo-problem-heading"
          eyebrow="The problem"
          title="Your Products Are Online. But Are They Ready for"
          accent="AI Shopping?"
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {WOOCOMMERCE_PROBLEMS.map((problem, index) => (
            <article
              key={problem.title}
              className="flex min-w-0 flex-col border border-accent/20 bg-gradient-to-br from-white to-accent/[0.06] p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:shadow-accent/10"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center border border-gray-200 bg-white text-gray-900">
                {icons[index]}
              </div>
              <h3 className="mb-2 text-sm font-bold text-gray-900">{problem.title}</h3>
              <p className="text-sm leading-relaxed text-gray-600">{problem.description}</p>
            </article>
          ))}
        </div>
        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {WOOCOMMERCE_CALLOUTS.map((item) => (
            <li
              key={item}
              className="flex items-center gap-2 border border-gray-200 bg-gray-50 px-3 py-3 text-sm font-medium text-gray-900"
            >
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
