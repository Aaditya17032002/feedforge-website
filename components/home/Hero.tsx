'use client'

import { SIGNUP_URL } from '@/lib/shared/app-urls'

const example = {
  rawTitle: 'Blue Shirt L',
  rawDescription: 'Cotton shirt blue color.',
  optimizedTitle: 'Premium Oxford Cotton Button-Down Shirt | Navy Blue | Slim Fit Large',
  optimizedDescription:
    'Elevate your formal wardrobe with this 100% organic cotton Oxford shirt. Features moisture-wicking fabric, reinforced stitching, and a modern slim fit.',
  tags: ["MEN'S FASHION", 'FORMAL WEAR', 'SUMMER COLLECTION', 'SUSTAINABLE'],
}

export default function Hero() {
  return (
    <section className="mx-auto max-w-7xl min-w-0 px-4 py-10 sm:px-6 sm:py-12 lg:py-16">
      <div className="grid min-w-0 gap-10 sm:gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="flex min-w-0 flex-col justify-center">
          <div className="mb-4">
            <span className="inline-flex max-w-full flex-wrap items-center gap-2 rounded-full border border-gray-200 bg-gray-100 px-3 py-1 text-[0.6875rem] font-medium text-gray-900 sm:text-xs">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gray-900"></span>
              <span className="min-w-0 text-pretty">AI-Powered Product Feeds</span>
            </span>
          </div>

          <h1 className="mb-4 text-balance text-xl font-bold leading-tight text-gray-900 sm:text-2xl lg:text-3xl xl:text-4xl">
            Your Product Feed, <span className="text-accent">AI Optimized</span>
          </h1>

          <p className="mb-8 text-pretty text-sm text-gray-600 sm:text-base">
            Turn your catalog into Google Merchant Center and Meta feeds, with AI-written titles and descriptions.
          </p>

          <div className="flex flex-col gap-4 sm:flex-row">
            <a
              href="#request-demo"
              className="relative inline-flex border border-accent bg-accent px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#070066]"
            >
              <span className="absolute -left-1 -top-1 h-2 w-2 border-l-2 border-t-2 border-gray-900"></span>
              <span className="absolute -right-1 -top-1 h-2 w-2 border-r-2 border-t-2 border-gray-900"></span>
              <span className="absolute -left-1 -bottom-1 h-2 w-2 border-l-2 border-b-2 border-gray-900"></span>
              <span className="absolute -right-1 -bottom-1 h-2 w-2 border-r-2 border-b-2 border-gray-900"></span>
              <span className="relative">Request A Demo</span>
            </a>
            <a
              href={SIGNUP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="relative inline-flex border border-gray-300 bg-white px-5 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              <span className="absolute -left-1 -top-1 h-2 w-2 border-l-2 border-t-2 border-gray-900"></span>
              <span className="absolute -right-1 -top-1 h-2 w-2 border-r-2 border-t-2 border-gray-900"></span>
              <span className="absolute -left-1 -bottom-1 h-2 w-2 border-l-2 border-b-2 border-gray-900"></span>
              <span className="absolute -right-1 -bottom-1 h-2 w-2 border-r-2 border-b-2 border-gray-900"></span>
              <span className="relative">Get Started</span>
            </a>
          </div>
        </div>

        <div className="flex min-w-0 items-center justify-center">
          <div className="w-full min-w-0 max-w-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
            <div className="space-y-6">
              <div>
                <label className="mb-2 block text-xs font-semibold tracking-wider text-gray-400">
                  Raw Data Input
                </label>
                <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <div>
                    <div className="mb-1 text-xs font-medium text-gray-600">Title</div>
                    <div className="text-sm text-gray-900">{example.rawTitle}</div>
                  </div>
                  <div>
                    <div className="mb-1 text-xs font-medium text-gray-600">Description</div>
                    <div className="text-sm text-gray-900">{example.rawDescription}</div>
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center gap-2">
                  <svg className="h-4 w-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  <label className="text-xs font-semibold tracking-wider text-accent">AI Optimized Output</label>
                </div>
                <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <div className="mb-2 break-words text-base font-bold text-accent sm:text-lg">{example.optimizedTitle}</div>
                  <div className="mb-4 text-sm leading-relaxed text-gray-700">{example.optimizedDescription}</div>
                  <div className="flex flex-wrap gap-2">
                    {example.tags.map((tag) => (
                      <span
                        key={tag}
                        className="cursor-default rounded-md bg-accent/10 px-3 py-1 text-xs font-medium text-accent"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
