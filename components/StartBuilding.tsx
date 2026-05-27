'use client'

import Link from 'next/link'
export default function StartBuilding() {
  return (
    <section className="border-t border-gray-200 bg-white">
      {/* Top Section - Hero-like */}
      <div className="mx-auto max-w-7xl min-w-0 px-4 py-4 sm:px-6 lg:py-6">
        <div className="grid min-w-0 gap-3 lg:grid-cols-2 lg:items-center lg:gap-4">
          {/* Left Column */}
          <div className="min-w-0">
            <h2 className="mb-1 text-balance text-base font-bold leading-tight text-gray-900 sm:text-lg lg:text-xl">
              Get Your AI Readiness Score For Free
            </h2>
            <p className="text-xs text-gray-600">
              Discover feed gaps, improve catalog quality, and launch faster with AI-powered
              optimization and validation workflows.
            </p>
          </div>

          {/* Right Column - Buttons */}
          <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center bg-accent px-5 py-2 text-center text-sm font-medium text-white transition-colors duration-300 hover:bg-[#070066]"
            >
              Start Building
            </Link>
            <Link
              href="/#try-your-product"
              className="inline-flex items-center justify-center border border-accent bg-white px-5 py-2 text-center text-sm font-medium text-accent transition-colors duration-300 hover:bg-accent hover:text-white"
            >
              Try It Free
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

