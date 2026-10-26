'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { GA_EVENTS, trackEvent } from '@/lib/analytics/gtag'
import { postJson } from '@/lib/shared/http'
import { sanitizeText } from '@/lib/shared/strings'

const GENERATION_STEPS = [
  'Sending your product to the AI…',
  'Tuning title and description for shopping feeds…',
  'Drafting search-friendly tags…',
  'Checking format and channel rules…',
] as const

// FIX: minimum visible duration per step so fast API responses don't feel abrupt
const MIN_GENERATION_MS = GENERATION_STEPS.length * 2200

const AD_DOMAIN = 'feedforge.shop'

function toSlug(value: string): string {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'product'
  )
}

export default function CatalogPerfection() {
  const [productTitle, setProductTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationStepIndex, setGenerationStepIndex] = useState(0)
  const [statusMessage, setStatusMessage] = useState('')
  const [statusType, setStatusType] = useState<'success' | 'error' | ''>('')
  const [generatedOutput, setGeneratedOutput] = useState<{
    optimizedTitle: string
    optimizedDescription: string
    tags: string[]
  } | null>(null)
  const [comparison, setComparison] = useState<{
    before: { score: number; summary: string; issues: string[] }
    after: { score: number; summary: string; issues: string[] }
  } | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [portalReady, setPortalReady] = useState(false)
  const [expandedAfter, setExpandedAfter] = useState(false)
  const [expandedBefore, setExpandedBefore] = useState(false)

  const stepIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const generationStartRef = useRef<number | null>(null)
  const optimizedFeedPreviewButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!isGenerating) {
      if (stepIntervalRef.current) {
        clearInterval(stepIntervalRef.current)
        stepIntervalRef.current = null
      }
      return
    }

    setGenerationStepIndex(0)
    generationStartRef.current = Date.now()

    stepIntervalRef.current = setInterval(() => {
      setGenerationStepIndex((i) => Math.min(i + 1, GENERATION_STEPS.length - 1))
    }, 2200)

    return () => {
      if (stepIntervalRef.current) {
        clearInterval(stepIntervalRef.current)
        stepIntervalRef.current = null
      }
    }
  }, [isGenerating])

  useEffect(() => {
    setPortalReady(true)
  }, [])

  useEffect(() => {
    if (!isModalOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsModalOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isModalOpen])

  useEffect(() => {
    if (!generatedOutput || isGenerating || statusType !== 'success') return
    const id = requestAnimationFrame(() => {
      optimizedFeedPreviewButtonRef.current?.focus()
    })
    return () => cancelAnimationFrame(id)
  }, [generatedOutput, isGenerating, statusType])

  const handleGenerate = async () => {
    trackEvent(GA_EVENTS.GENERATE_AI_FEED_CLICK, { location: 'try_your_product' })
    setIsGenerating(true)
    setStatusMessage('')
    setStatusType('')
    setGeneratedOutput(null)
    setComparison(null)
    setIsModalOpen(false)
    setExpandedAfter(false)
    setExpandedBefore(false)

    const apiStart = Date.now()

    try {
      const sanitizedTitle = sanitizeText(productTitle, { maxLen: 200 })
      const sanitizedDescription = sanitizeText(description, { maxLen: 5000, preserveNewlines: true })

      const result = await postJson<
        {
          optimizedTitle: string
          optimizedDescription: string
          tags?: string[]
          before?: { score: number; summary: string; issues: string[] }
          after?: { score: number; summary: string; issues: string[] }
          message?: string
        },
        { productTitle: string; description: string }
      >('/api/try-product', { productTitle: sanitizedTitle, description: sanitizedDescription })

      const duration_ms = Date.now() - apiStart

      // FIX: enforce minimum display time so steps don't flash away on fast responses
      const remaining = MIN_GENERATION_MS - duration_ms
      if (remaining > 0) {
        await new Promise((resolve) => setTimeout(resolve, remaining))
      }

      if (!result.ok) {
        setStatusType('error')
        setStatusMessage(result.message || 'Could not generate AI feed. Please try again.')
        trackEvent(GA_EVENTS.GENERATE_AI_FEED_ERROR, { location: 'try_your_product', duration_ms })
        return
      }

      setGeneratedOutput({
        optimizedTitle: result.data.optimizedTitle,
        optimizedDescription: result.data.optimizedDescription,
        tags: result.data.tags || [],
      })

      if (result.data.before && result.data.after) {
        setComparison({ before: result.data.before, after: result.data.after })
      } else {
        setComparison(null)
      }

      setStatusType('success')
      setStatusMessage('AI feed generated successfully.')
      trackEvent(GA_EVENTS.GENERATE_AI_FEED_SUCCESS, { location: 'try_your_product', duration_ms })
    } catch (error) {
      console.error('Try product generation failed', error)
      setStatusType('error')
      setStatusMessage('Network error. Please try again.')
      trackEvent(GA_EVENTS.GENERATE_AI_FEED_ERROR, {
        location: 'try_your_product',
        duration_ms: Date.now() - apiStart,
      })
    } finally {
      setIsGenerating(false)
      setGenerationStepIndex(0)
    }
  }

  return (
    <section id="try-your-product" className="scroll-mt-24 border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl min-w-0 px-4 py-10 sm:px-6 sm:py-12 lg:py-16">
        <div className="grid min-w-0 gap-10 sm:gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left Column */}
          <div className="flex min-w-0 flex-col justify-center">
            <h2 className="mb-4 text-balance text-xl font-bold leading-tight text-gray-900 sm:text-2xl md:text-3xl lg:text-4xl">
              Instant Catalog <span className="text-accent">Perfection</span>
            </h2>

            <p className="mb-6 text-sm leading-relaxed text-gray-700">
              Don&apos;t let poor data kill your ads. Our built-in AI automatically rewrites titles, fixes
              descriptions, and tags products for maximum visibility.
            </p>

            {/* Why it matters card */}
            <div className="group border border-gray-200 bg-gray-50 p-6 transition-all duration-700 ease-in-out hover:border-accent hover:shadow-xl hover:-translate-y-1">
              <h3 className="mb-3 text-base font-semibold text-accent">Why It Matters</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <svg
                    className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-sm text-gray-700">Higher click-through rates</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg
                    className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-sm text-gray-700">Better matching for &quot;near me&quot; searches</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg
                    className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-sm text-gray-700">Automatic attribute filling</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column */}
          <div className="flex min-w-0 items-center justify-center">
            <div className="w-full min-w-0 max-w-2xl border border-gray-200 bg-white shadow-sm transition-all duration-700 ease-in-out hover:border-accent hover:shadow-2xl hover:-translate-y-1">
              <div className="border-b-2 border-accent px-6 py-4 text-center text-sm font-medium text-accent">
                Try Your Product
              </div>
              <div className="min-w-0 p-4 sm:p-6">
                  <div className="space-y-6">
                    <div>
                      <label className="mb-2 block text-xs font-semibold tracking-wider text-gray-400">
                        Your Product Data
                      </label>

                      <div className="space-y-4">
                        <div>
                          <label className="mb-2 block text-sm font-medium text-gray-700">
                            Product Title
                          </label>
                          <input
                            type="text"
                            value={productTitle}
                            onChange={(e) => setProductTitle(e.target.value)}
                            placeholder="e.g. leather boots black"
                            className="w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-all duration-300 hover:border-accent focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium text-gray-700">
                            Description (Optional)
                          </label>
                          <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Short description..."
                            rows={4}
                            className="w-full resize-none rounded-md border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-all duration-300 hover:border-accent focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                          />
                        </div>
                      </div>
                    </div>

                    {/* FIX: disabled when title is empty OR generating — saves a round-trip */}
                    <button
                      type="button"
                      onClick={handleGenerate}
                      disabled={isGenerating || !productTitle.trim()}
                      aria-busy={isGenerating}
                      className={`group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-md px-6 py-3 text-sm font-semibold text-white shadow-sm transition-[filter,box-shadow] duration-300 disabled:cursor-wait motion-reduce:disabled:cursor-default ${
                        isGenerating
                          ? 'bg-[linear-gradient(100deg,#03002a_0%,#090088_18%,#2a1899_38%,#5c45e8_50%,#2a1899_62%,#090088_82%,#03002a_100%)] bg-[length:280%_100%] bg-[position:15%_50%] bg-no-repeat motion-safe:animate-generate-btn-gradient ring-2 ring-white/30 ring-offset-2 ring-offset-white'
                          : !productTitle.trim()
                            ? 'bg-gradient-to-r from-accent/40 via-[#120b7a]/40 to-[#050055]/40 cursor-not-allowed'
                            : 'bg-gradient-to-r from-accent via-[#120b7a] to-[#050055] hover:brightness-110 hover:shadow-md active:brightness-95'
                      }`}
                    >
                      {isGenerating ? (
                        <svg
                          className="h-4 w-4 shrink-0 motion-safe:animate-spin"
                          fill="none"
                          viewBox="0 0 24 24"
                          aria-hidden
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-90"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="h-4 w-4 shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                          />
                        </svg>
                      )}
                      <span>{isGenerating ? 'Generating AI feed…' : 'Generate AI feed'}</span>
                    </button>

                    {isGenerating ? (
                      <div
                        className="space-y-2 text-center"
                        role="status"
                        aria-live="polite"
                        aria-atomic="true"
                      >
                        <p className="text-sm font-medium text-accent motion-safe:transition-opacity motion-safe:duration-300">
                          {GENERATION_STEPS[generationStepIndex]}
                        </p>
                        <div
                          className="mx-auto flex max-w-xs justify-center gap-1.5"
                          aria-hidden
                        >
                          {GENERATION_STEPS.map((_, i) => (
                            <span
                              key={i}
                              className={`h-1.5 flex-1 max-w-[3rem] rounded-full transition-colors duration-300 ${
                                i < generationStepIndex
                                  ? 'bg-accent/50'
                                  : i === generationStepIndex
                                    ? 'bg-accent motion-safe:animate-pulse'
                                    : 'bg-gray-200'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    ) : statusMessage ? (
                      <p
                        className={`text-center text-sm ${
                          statusType === 'error' ? 'text-red-600' : 'text-green-600'
                        }`}
                      >
                        {statusMessage}
                      </p>
                    ) : (
                      <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                          />
                        </svg>
                        <span>Enter product details to see the magic.</span>
                      </div>
                    )}

                    {generatedOutput && !isGenerating ? (
                      <div className="relative rounded-md p-[1.5px] bg-[linear-gradient(110deg,#090088_0%,#5c45e8_25%,#a78bfa_50%,#5c45e8_75%,#090088_100%)] bg-[length:200%_100%] motion-safe:animate-border-sweep">
                        <button
                          ref={optimizedFeedPreviewButtonRef}
                          type="button"
                          onClick={() => setIsModalOpen(true)}
                          aria-haspopup="dialog"
                          aria-expanded={isModalOpen}
                          className="group relative flex w-full items-center justify-center gap-2 rounded-[calc(0.375rem-1.5px)] bg-white px-4 py-2.5 text-sm font-semibold text-accent focus:outline-none focus:ring-2 focus:ring-accent/40 motion-safe:animate-score-glow"
                        >
                          <GoogleGIcon className="h-4 w-4 shrink-0" />
                          <span>Preview as Google Ad</span>
                        </button>
                      </div>
                    ) : null}
                  </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {portalReady && isModalOpen && generatedOutput
        ? createPortal(
            <div
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4 py-8"
              role="dialog"
              aria-modal="true"
              aria-label={
                comparison
                  ? 'Optimized feed preview: before and after with feed health scores'
                  : 'Optimized feed preview'
              }
              onMouseDown={(e) => {
                if (e.target === e.currentTarget) setIsModalOpen(false)
              }}
            >
          <div className="relative flex w-full max-h-[min(95vh,920px)] max-w-[min(96vw,1100px)] flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute right-3 top-3 z-10 rounded-full bg-white/80 p-2 text-gray-500 backdrop-blur transition-colors hover:bg-gray-100 hover:text-gray-900"
              aria-label="Close"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              <div className="border-b border-gray-200 bg-white px-6 pb-4 pt-5 sm:px-10">
                <div className="relative flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                  <div className="sm:absolute sm:left-0 sm:top-1/2 sm:-translate-y-1/2">
                    <GoogleLogo />
                  </div>
                  <GoogleSearchBar query={productTitle.trim() || generatedOutput.optimizedTitle} />
                </div>
                <div className="mt-3 text-xs text-[#5f6368]">
                  About 1,240,000 results (0.42 seconds)
                </div>
              </div>

              <div className="bg-white px-6 py-5 sm:px-10">
                <div className="flex flex-col gap-6">
                  <AdSlot label="Optimized by FeedForge AI" labelTone="accent">
                    <GoogleTextAd
                      title={generatedOutput.optimizedTitle}
                      description={generatedOutput.optimizedDescription}
                      sitelinks={generatedOutput.tags}
                      expanded={expandedAfter}
                      onToggleExpanded={() => setExpandedAfter((v) => !v)}
                    />
                  </AdSlot>

                  <AdSlot label="Your original ad" labelTone="neutral">
                    <GoogleTextAd
                      title={productTitle.trim() || 'Untitled product'}
                      description={description.trim()}
                      expanded={expandedBefore}
                      onToggleExpanded={() => setExpandedBefore((v) => !v)}
                    />
                  </AdSlot>
                </div>
              </div>

              {comparison ? (
                <div className="border-t border-gray-200 bg-gray-50 px-6 py-5 sm:px-10">
                  <div className="mb-3 flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-gray-900">Performance Analysis</h3>
                    <span className="text-xs text-gray-500">— Before vs After</span>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <AnalysisCard
                      tone="neutral"
                      heading="Before"
                      score={comparison.before.score}
                      summary={comparison.before.summary}
                      issues={comparison.before.issues}
                    />
                    <AnalysisCard
                      tone="accent"
                      heading="After"
                      score={comparison.after.score}
                      summary={comparison.after.summary}
                      issues={comparison.after.issues}
                    />
                  </div>
                </div>
              ) : null}
            </div>

            {comparison ? (
              <div className="shrink-0 border-t border-gray-200 bg-gray-50 px-4 py-2.5 sm:px-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">Feed Health Score</span>
                    <span className="inline-flex items-center gap-1.5 text-sm text-gray-600">
                      <span className="rounded-md bg-gray-900 px-1.5 py-0.5 text-xs font-semibold text-white tabular-nums">
                        {comparison.before.score}
                      </span>
                      <svg
                        viewBox="0 0 24 24"
                        className="h-3.5 w-3.5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        aria-hidden
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M13 6l6 6-6 6" />
                      </svg>
                      <span className="rounded-md bg-accent px-1.5 py-0.5 text-xs font-semibold text-white tabular-nums">
                        {comparison.after.score}
                      </span>
                    </span>
                    <span
                      className="relative inline-flex items-center rounded-full p-[1.5px] bg-[linear-gradient(110deg,#090088_0%,#5c45e8_25%,#a78bfa_50%,#5c45e8_75%,#090088_100%)] bg-[length:200%_100%] motion-safe:animate-border-sweep"
                    >
                      <span className="inline-flex items-center rounded-full bg-white px-2 py-0.5 text-xs font-bold tabular-nums text-accent">
                        +{Math.max(0, comparison.after.score - comparison.before.score)}
                      </span>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="shrink-0 rounded-md bg-gray-900 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex shrink-0 justify-end border-t border-gray-200 bg-gray-50 px-4 py-2.5 sm:px-5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>,
            document.body,
          )
        : null}
    </section>
  )
}

function GoogleGIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <path
        fill="#FFC107"
        d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
      />
      <path
        fill="#FF3D00"
        d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
      />
      <path
        fill="#1976D2"
        d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
      />
    </svg>
  )
}

function GoogleLogo() {
  return (
    <div
      className="select-none text-[26px] font-medium leading-none sm:text-[30px]"
      style={{ fontFamily: '"Google Sans", "Product Sans", Arial, sans-serif', letterSpacing: '-0.5px' }}
      aria-label="Google"
    >
      <span style={{ color: '#4285F4' }}>G</span>
      <span style={{ color: '#EA4335' }}>o</span>
      <span style={{ color: '#FBBC05' }}>o</span>
      <span style={{ color: '#4285F4' }}>g</span>
      <span style={{ color: '#34A853' }}>l</span>
      <span style={{ color: '#EA4335' }}>e</span>
    </div>
  )
}

function GoogleSearchBar({ query }: { query: string }) {
  return (
    <div className="flex w-full max-w-[560px] items-center gap-3 rounded-full border border-[#dfe1e5] bg-white px-4 py-2.5 shadow-[0_1px_6px_rgba(32,33,36,0.08)] transition-shadow hover:shadow-[0_1px_8px_rgba(32,33,36,0.14)]">
      <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-[#9aa0a6]" fill="none" stroke="currentColor" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
      </svg>
      <div className="min-w-0 flex-1 truncate text-[15px] text-[#202124]" aria-label="Search query">
        {query || 'product search'}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
          <path
            fill="#4285F4"
            d="M12 14a3 3 0 003-3V5a3 3 0 10-6 0v6a3 3 0 003 3z"
          />
          <path
            fill="#34A853"
            d="M19 11a1 1 0 10-2 0 5 5 0 01-10 0 1 1 0 10-2 0 7 7 0 006 6.92V20H8a1 1 0 100 2h8a1 1 0 100-2h-3v-2.08A7 7 0 0019 11z"
          />
        </svg>
        <svg viewBox="0 0 192 192" className="h-5 w-5" aria-hidden>
          <circle cx="96" cy="96" r="20" fill="#FBBC04" />
          <circle cx="96" cy="96" r="40" fill="none" stroke="#34A853" strokeWidth="14" strokeDasharray="60 200" />
          <circle cx="96" cy="96" r="40" fill="none" stroke="#EA4335" strokeWidth="14" strokeDasharray="60 200" strokeDashoffset="-80" />
          <circle cx="96" cy="96" r="40" fill="none" stroke="#4285F4" strokeWidth="14" strokeDasharray="60 200" strokeDashoffset="-160" />
        </svg>
      </div>
    </div>
  )
}

function AdSlot({
  label,
  labelTone,
  children,
}: {
  label: string
  labelTone: 'accent' | 'neutral'
  children: React.ReactNode
}) {
  const isAccent = labelTone === 'accent'
  return (
    <div className="relative">
      <div className="mb-1.5 flex items-center gap-2 px-1">
        <span
          className={`inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider ${
            isAccent ? 'text-accent' : 'text-gray-500'
          }`}
        >
          {isAccent ? (
            <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor" aria-hidden>
              <path d="M12 2l2.39 5.72L20 8.27l-4.5 3.9L17 18l-5-3.27L7 18l1.5-5.83L4 8.27l5.61-.55L12 2z" />
            </svg>
          ) : null}
          {label}
        </span>
      </div>
      <div
        className={`rounded-lg border bg-white p-3 sm:p-4 ${
          isAccent ? 'border-accent/30 shadow-sm ring-1 ring-accent/10' : 'border-gray-200'
        }`}
      >
        {children}
      </div>
    </div>
  )
}

function AnalysisCard({
  tone,
  heading,
  score,
  summary,
  issues,
}: {
  tone: 'accent' | 'neutral'
  heading: string
  score: number
  summary: string
  issues: string[]
}) {
  const isAccent = tone === 'accent'
  return (
    <div
      className={`flex flex-col rounded-lg border bg-white p-4 ${
        isAccent ? 'border-accent/30 ring-1 ring-accent/10' : 'border-gray-200'
      }`}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <span
          className={`text-[11px] font-semibold uppercase tracking-wider ${
            isAccent ? 'text-accent' : 'text-gray-500'
          }`}
        >
          {heading}
        </span>
        <span
          className={`inline-flex items-baseline gap-1 rounded-full px-3 py-1 text-white ${
            isAccent ? 'bg-accent motion-safe:animate-score-glow' : 'bg-gray-900'
          }`}
        >
          <span className="text-[10px] font-semibold uppercase tracking-wider opacity-70">Score</span>
          <span className="text-base font-bold leading-none tabular-nums">{score}</span>
          <span className="text-[11px] font-medium opacity-70">/100</span>
        </span>
      </div>

      <div className="mb-3">
        <div
          className={`mb-1 text-[10px] font-semibold uppercase tracking-wider ${
            isAccent ? 'text-accent' : 'text-gray-500'
          }`}
        >
          Summary
        </div>
        <p className="text-sm leading-snug text-gray-800">{summary}</p>
      </div>

      <div>
        <div
          className={`mb-1 text-[10px] font-semibold uppercase tracking-wider ${
            isAccent ? 'text-accent' : 'text-gray-500'
          }`}
        >
          Top Issues
        </div>
        {issues.length > 0 ? (
          <ul className="space-y-1 text-sm text-gray-800">
            {issues.map((issue, idx) => (
              <li key={`${heading}-${issue}-${idx}`} className="flex gap-1.5">
                <span
                  className={`mt-2 h-1 w-1 flex-shrink-0 rounded-full ${
                    isAccent ? 'bg-accent/70' : 'bg-gray-400'
                  }`}
                />
                <span className="min-w-0 break-words leading-snug">{issue}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm italic text-gray-500">No remaining issues.</p>
        )}
      </div>
    </div>
  )
}

function GoogleTextAd({
  title,
  description,
  sitelinks,
  expanded,
  onToggleExpanded,
}: {
  title: string
  description: string
  sitelinks?: string[]
  expanded: boolean
  onToggleExpanded: () => void
}) {
  const slug = toSlug(title)
  const hasDescription = description.trim().length > 0
  const visibleSitelinks = sitelinks?.filter(Boolean).slice(0, 4) ?? []

  return (
    <div className="bg-white" role="group" aria-label="Google text ad preview">
      <div className="flex items-center gap-2">
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gray-200 to-gray-300 text-[10px] font-bold text-gray-700 ring-1 ring-gray-200"
          aria-hidden
        >
          FF
        </div>
        <div className="flex min-w-0 flex-col leading-tight">
          <span className="text-sm font-medium text-gray-900">Sponsored</span>
          <span className="truncate text-xs text-[#5f6368]">{AD_DOMAIN}</span>
        </div>
      </div>

      <a
        href="#ad-preview"
        onClick={(e) => e.preventDefault()}
        className="mt-2 block break-words text-[18px] font-normal leading-snug text-[#1a0dab] hover:underline visited:text-[#681da8] sm:text-[20px]"
      >
        {title}
      </a>

      <div className="mt-0.5 truncate text-xs text-[#5f6368]">
        {AD_DOMAIN} <span className="px-1">›</span> products <span className="px-1">›</span> {slug}
      </div>

      {hasDescription ? (
        <div className="mt-1.5 text-sm leading-snug text-[#4d5156]">
          <p
            className={`whitespace-pre-wrap break-words ${expanded ? '' : 'line-clamp-2'}`}
          >
            {description}
          </p>
          <button
            type="button"
            onClick={onToggleExpanded}
            className="mt-0.5 text-sm font-medium text-[#1a0dab] hover:underline focus:outline-none focus-visible:underline"
            aria-expanded={expanded}
          >
            {expanded ? 'See less' : 'See more'}
          </button>
        </div>
      ) : (
        <div className="mt-1.5 text-sm italic leading-snug text-gray-400">
          No description — Google may shorten or skip this ad.
        </div>
      )}

      {visibleSitelinks.length > 0 ? (
        <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1">
          {visibleSitelinks.map((label) => (
            <a
              key={label}
              href="#ad-preview"
              onClick={(e) => e.preventDefault()}
              className="text-xs text-[#1a0dab] hover:underline"
            >
              {label}
            </a>
          ))}
        </div>
      ) : null}
    </div>
  )
}
