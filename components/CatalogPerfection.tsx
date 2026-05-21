'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { createPortal } from 'react-dom'
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

export default function CatalogPerfection() {
  const pathname = usePathname()
  const [activeTab, setActiveTab] = useState<'examples' | 'try'>('examples')
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
    const applyHash = () => {
      if (typeof window === 'undefined') return
      if (window.location.hash === '#try-your-product') {
        setActiveTab('try')
      }
    }
    applyHash()
    window.addEventListener('hashchange', applyHash)
    const onNavTryProduct = () => setActiveTab('try')
    window.addEventListener('feedforge:nav-try-product', onNavTryProduct)
    return () => {
      window.removeEventListener('hashchange', applyHash)
      window.removeEventListener('feedforge:nav-try-product', onNavTryProduct)
    }
  }, [])

  useEffect(() => {
    if (pathname !== '/') return
    if (typeof window === 'undefined') return
    if (window.location.hash === '#try-your-product') {
      setActiveTab('try')
    }
  }, [pathname])

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

  const exampleData = {
    rawTitle: 'Blue Shirt L',
    rawDescription: 'Cotton shirt blue color.',
    optimizedTitle: 'Premium Oxford Cotton Button-Down Shirt | Navy Blue | Slim Fit Large',
    optimizedDescription:
      'Elevate your formal wardrobe with this 100% organic cotton Oxford shirt. Features moisture-wicking fabric, reinforced stitching, and a modern slim fit.',
    tags: ["MEN'S FASHION", 'FORMAL WEAR', 'SUMMER COLLECTION', 'SUSTAINABLE'],
  }

  const handleGenerate = async () => {
    setIsGenerating(true)
    setStatusMessage('')
    setStatusType('')
    setGeneratedOutput(null)
    setComparison(null)
    setIsModalOpen(false)

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

      // FIX: enforce minimum display time so steps don't flash away on fast responses
      const elapsed = Date.now() - apiStart
      const remaining = MIN_GENERATION_MS - elapsed
      if (remaining > 0) {
        await new Promise((resolve) => setTimeout(resolve, remaining))
      }

      if (!result.ok) {
        setStatusType('error')
        setStatusMessage(result.message || 'Could not generate AI feed. Please try again.')
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
    } catch (error) {
      console.error('Try product generation failed', error)
      setStatusType('error')
      setStatusMessage('Network error. Please try again.')
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
              Don't let poor data kill your ads. Our built-in AI automatically rewrites titles, fixes
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
                  <span className="text-sm text-gray-700">35% higher click-through rates</span>
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
                  <span className="text-sm text-gray-700">Better matching for "near me" searches</span>
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
              {/* Tabs */}
              <div className="flex min-w-0 border-b border-gray-200">
                <button
                  onClick={() => setActiveTab('examples')}
                  className={`min-w-0 flex-1 px-3 py-3 text-xs font-medium transition-colors duration-300 sm:px-6 sm:py-4 sm:text-sm ${
                    activeTab === 'examples'
                      ? 'border-b-2 border-accent text-accent'
                      : 'text-gray-500 hover:text-accent'
                  }`}
                >
                  Examples
                </button>
                <button
                  onClick={() => setActiveTab('try')}
                  className={`min-w-0 flex-1 px-3 py-3 text-xs font-medium transition-colors duration-300 sm:px-6 sm:py-4 sm:text-sm ${
                    activeTab === 'try'
                      ? 'border-b-2 border-accent text-accent'
                      : 'text-gray-500 hover:text-accent'
                  }`}
                >
                  Try Your Product
                </button>
              </div>

              {/* Tab Content */}
              <div className="min-w-0 p-4 sm:p-6">
                {activeTab === 'examples' ? (
                  <div className="space-y-6">
                    {/* Raw Data Input */}
                    <div>
                      <label className="mb-2 block text-xs font-semibold tracking-wider text-gray-400">
                        Raw Data Input
                      </label>
                      <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all duration-500 hover:border-gray-300 hover:bg-gray-100">
                        <div>
                          <div className="mb-1 text-xs font-medium text-gray-600">Title</div>
                          <div className="text-sm text-gray-900">{exampleData.rawTitle}</div>
                        </div>
                        <div>
                          <div className="mb-1 text-xs font-medium text-gray-600">Description</div>
                          <div className="text-sm text-gray-900">{exampleData.rawDescription}</div>
                        </div>
                      </div>
                    </div>

                    {/* AI Optimized Output */}
                    <div>
                      <div className="mb-2 flex items-center gap-2">
                        <svg
                          className="h-4 w-4 text-accent"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                        <label className="text-xs font-semibold tracking-wider text-accent">
                          AI Optimized Output
                        </label>
                      </div>
                      <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all duration-500 hover:border-gray-300 hover:bg-gray-100 hover:shadow-md">
                        <div>
                          <div className="mb-2 break-words text-base font-bold text-accent sm:text-lg">
                            {exampleData.optimizedTitle}
                          </div>
                          <div className="mb-4 text-sm leading-relaxed text-gray-700">
                            {exampleData.optimizedDescription}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {exampleData.tags.map((tag) => (
                              <span
                                key={tag}
                                className="rounded-md bg-accent/10 px-3 py-1 text-xs font-medium text-accent transition-all duration-300 hover:bg-accent hover:text-white hover:scale-105 cursor-default"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
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
                          <svg
                            className="h-4 w-4 shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                          <span>Preview optimized feed</span>
                        </button>
                      </div>
                    ) : null}
                  </div>
                )}
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
          <div className="flex w-full max-h-[min(92vh,900px)] max-w-[min(96vw,1200px)] flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-gray-200 px-4 py-2.5 sm:px-5">
              <div className="min-w-0 py-0.5">
                <div className="text-sm font-semibold leading-tight text-gray-900">Try Your Product</div>
                <div className="mt-0.5 text-xs leading-snug text-gray-500">
                  {comparison
                    ? 'Before vs After + Feed Health Score'
                    : 'AI optimized title, description, and tags'}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="-mr-1 shrink-0 rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
                aria-label="Close"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5">
              <div className="grid gap-4 lg:grid-cols-2">
              <div className="flex min-w-0 flex-col rounded-lg border border-gray-200 bg-gray-50 p-3 sm:p-4">
                <div className="mb-2 flex shrink-0 items-center justify-between gap-3">
                  <div className="text-xs font-semibold tracking-wider text-gray-500">BEFORE</div>
                  {comparison ? (
                    <div className="inline-flex items-baseline gap-1 rounded-full bg-gray-900 px-3 py-1 text-white">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Score</span>
                      <span className="text-base font-bold leading-none tabular-nums">
                        {comparison.before.score}
                      </span>
                      <span className="text-[11px] font-medium text-gray-400">/100</span>
                    </div>
                  ) : null}
                </div>
                <div className="flex flex-col gap-2.5">
                  <div className="shrink-0 overflow-hidden rounded-md border border-gray-200 bg-white">
                    <div className="border-b border-gray-200 bg-gray-100 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-gray-800">
                      Title
                    </div>
                    <div className="px-3 py-2 break-words text-sm font-semibold text-gray-900">
                      {productTitle.trim() || '—'}
                    </div>
                  </div>
                  <div className="shrink-0 overflow-hidden rounded-md border border-gray-200 bg-white">
                    <div className="border-b border-gray-200 bg-gray-100 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-gray-800">
                      Description
                    </div>
                    <div className="px-3 py-2 whitespace-pre-wrap break-words text-sm text-gray-800">
                      {description.trim() || '—'}
                    </div>
                  </div>

                  {comparison ? (
                    <>
                      <div className="shrink-0 overflow-hidden rounded-md border border-gray-200 bg-white">
                        <div className="border-b border-gray-200 bg-gray-100 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-gray-800">
                          Summary
                        </div>
                        <div className="px-3 py-2 text-sm text-gray-800">{comparison.before.summary}</div>
                      </div>
                      <div className="shrink-0 overflow-hidden rounded-md border border-gray-200 bg-white">
                        <div className="border-b border-gray-200 bg-gray-100 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-gray-800">
                          Top issues
                        </div>
                        <ul className="space-y-1.5 px-3 py-2 text-sm text-gray-800">
                          {comparison.before.issues.map((issue, idx) => (
                            <li key={`${issue}-${idx}`} className="flex gap-2">
                              <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gray-400" />
                              <span className="min-w-0 break-words">{issue}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  ) : null}
                </div>
              </div>

              <div className="flex min-w-0 flex-col rounded-lg border border-gray-200 bg-white p-3 sm:p-4">
                <div className="mb-2 flex shrink-0 items-center justify-between gap-3">
                  <div className="text-xs font-semibold tracking-wider text-accent">AFTER</div>
                  {comparison ? (
                    <div className="inline-flex items-baseline gap-1 rounded-full bg-accent px-3 py-1 text-white motion-safe:animate-score-glow">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-white/70">Score</span>
                      <span className="text-base font-bold leading-none tabular-nums">
                        {comparison.after.score}
                      </span>
                      <span className="text-[11px] font-medium text-white/70">/100</span>
                    </div>
                  ) : null}
                </div>
                <div className="flex flex-col gap-2.5">
                  <div className="shrink-0 overflow-hidden rounded-md border border-gray-200 bg-white">
                    <div className="border-b border-accent/20 bg-accent/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-accent">
                      Optimized Title
                    </div>
                    <div className="px-3 py-2 break-words text-sm font-semibold text-gray-900">
                      {generatedOutput.optimizedTitle}
                    </div>
                  </div>
                  <div className="shrink-0 overflow-hidden rounded-md border border-gray-200 bg-white">
                    <div className="border-b border-accent/20 bg-accent/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-accent">
                      Optimized Description
                    </div>
                    <div className="px-3 py-2 whitespace-pre-wrap break-words text-sm text-gray-800">
                      {generatedOutput.optimizedDescription}
                    </div>
                  </div>
                  <div className="shrink-0 overflow-hidden rounded-md border border-gray-200 bg-white">
                    <div className="border-b border-accent/20 bg-accent/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-accent">
                      Tags
                    </div>
                    <div className="flex flex-wrap gap-2 px-3 py-2">
                      {generatedOutput.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-md bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {comparison ? (
                    <>
                      <div className="shrink-0 overflow-hidden rounded-md border border-gray-200 bg-white">
                        <div className="border-b border-accent/20 bg-accent/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-accent">
                          Summary
                        </div>
                        <div className="px-3 py-2 text-sm text-gray-800">{comparison.after.summary}</div>
                      </div>
                      <div className="shrink-0 overflow-hidden rounded-md border border-gray-200 bg-white">
                        <div className="border-b border-accent/20 bg-accent/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-accent">
                          Top issues
                        </div>
                        <ul className="space-y-1.5 px-3 py-2 text-sm text-gray-800">
                          {comparison.after.issues.map((issue, idx) => (
                            <li key={`${issue}-${idx}`} className="flex gap-2">
                              <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent/70" />
                              <span className="min-w-0 break-words">{issue}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
              </div>
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
