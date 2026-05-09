'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  CONTACT_EMAIL,
  CONTACT_PAGE_HREF,
  CONTACT_SALES_PHONE,
  CONTACT_SUPPORT_HOURS,
} from '@/lib/content/contact'

type ChatRole = 'user' | 'assistant'

type ChatMessage = {
  id: string
  role: ChatRole
  content: string
}

type ChatApiResponse =
  | { success: true; answer: string; shouldEscalate: boolean }
  | { success: false; message: string }

const quickPrompts = [
  'Pricing & plans',
  'Integrations',
  'Request a demo',
  'How does AI enrichment work?',
] as const

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function clampText(value: string, maxLen: number) {
  const text = value.trim()
  return text.length > maxLen ? `${text.slice(0, maxLen).trim()}…` : text
}

/* ── Typing indicator ── */
function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-gray-100 px-4 py-3">
        <span className="typing-dot" style={{ '--delay': '0ms' } as React.CSSProperties} />
        <span className="typing-dot" style={{ '--delay': '160ms' } as React.CSSProperties} />
        <span className="typing-dot" style={{ '--delay': '320ms' } as React.CSSProperties} />
      </div>
    </div>
  )
}

/* ── Avatar ── */
function BotAvatar({ size = 28 }: { size?: number }) {
  return (
    <div
      className="bot-avatar shrink-0 flex items-center justify-center rounded-full text-white font-semibold"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      FF
    </div>
  )
}

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string>('')
  const [shouldEscalate, setShouldEscalate] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: makeId(),
      role: 'assistant',
      content:
        'Hi! I can help with pricing, integrations, onboarding, and how FeedForge improves product feeds. What are you trying to achieve?',
    },
  ])

  const listRef = useRef<HTMLDivElement | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  const apiHistory = useMemo(
    () =>
      messages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({ role: m.role, content: clampText(m.content, 1200) }))
        .slice(-10),
    [messages]
  )

  /* auto-scroll */
  useEffect(() => {
    if (!isOpen) return
    const node = listRef.current
    if (!node) return
    node.scrollTop = node.scrollHeight
  }, [isOpen, messages.length, isSending, shouldEscalate, error])

  /* auto-grow textarea */
  function handleTextareaChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 112)}px`
  }

  async function sendMessage(text: string) {
    const content = clampText(text, 1200)
    if (!content) return

    setError('')
    setShouldEscalate(false)
    setIsSending(true)

    const userMessage: ChatMessage = { id: makeId(), role: 'user', content }
    setMessages((prev) => [...prev, userMessage])

    // reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content, history: apiHistory }),
      })

      const data = (await res.json()) as ChatApiResponse
      if (!res.ok || !data || data.success === false) {
        throw new Error(data && 'message' in data ? data.message : 'Chat request failed.')
      }

      setShouldEscalate(Boolean(data.shouldEscalate))
      setMessages((prev) => [
        ...prev,
        { id: makeId(), role: 'assistant', content: data.answer },
      ])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Chat request failed.')
    } finally {
      setIsSending(false)
    }
  }

  const unreadCount = messages.filter((m) => m.role === 'assistant').length - 1

  return (
    <>
      {/* ── Scoped styles ── */}
      <style>{`
        .ff-widget {
          --accent: #0800A0;
          --accent-hover: #06007a;
          --accent-light: #eeeeff;
          --radius-chat: 18px;
          font-family: 'Inter', system-ui, sans-serif;
        }

        .ff-panel {
          animation: ff-slide-up 0.28s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        @keyframes ff-slide-up {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        .ff-fab {
          animation: ff-pop-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
        @keyframes ff-pop-in {
          from { opacity: 0; transform: scale(0.7); }
          to   { opacity: 1; transform: scale(1); }
        }

        /* typing dots */
        .typing-dot {
          display: block;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #9ca3af;
          animation: ff-bounce 1.1s var(--delay, 0ms) infinite ease-in-out;
        }
        @keyframes ff-bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
          30%            { transform: translateY(-5px); opacity: 1; }
        }

        /* bot avatar gradient */
        .bot-avatar {
          background: linear-gradient(135deg, #0800A0 0%, #5b21b6 100%);
          letter-spacing: -0.02em;
        }

        /* quick prompt chips */
        .ff-chip {
          transition: background 0.15s, color 0.15s, border-color 0.15s, transform 0.12s;
        }
        .ff-chip:hover:not(:disabled) {
          background: var(--accent-light);
          border-color: var(--accent);
          color: var(--accent);
          transform: translateY(-1px);
        }
        .ff-chip:active:not(:disabled) {
          transform: translateY(0);
        }

        /* send button pulse while sending */
        .ff-btn-sending {
          animation: ff-pulse 1.4s infinite;
        }
        @keyframes ff-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.65; }
        }

        /* textarea focus ring */
        .ff-textarea:focus {
          outline: none;
          border-color: var(--accent) !important;
          box-shadow: 0 0 0 3px rgba(8,0,160,0.1);
        }

        /* scrollbar */
        .ff-scroll::-webkit-scrollbar { width: 5px; }
        .ff-scroll::-webkit-scrollbar-track { background: transparent; }
        .ff-scroll::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 99px; }

        /* message bubble entrance */
        .ff-bubble {
          animation: ff-bubble-in 0.22s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        @keyframes ff-bubble-in {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="ff-widget fixed bottom-4 right-4 z-50 flex flex-col items-end sm:bottom-6 sm:right-6">

        {/* ── Chat panel ── */}
        {isOpen && (
          <div className="ff-panel mb-3 flex w-[min(92vw,400px)] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            style={{ border: '1px solid #e5e7eb', maxHeight: '80vh' }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3"
              style={{ background: 'linear-gradient(135deg, #0800A0 0%, #4c1d95 100%)' }}
            >
              <BotAvatar size={36} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">FeedForge Assistant</p>
                <div className="flex items-center gap-1.5">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 0 2px rgba(52,211,153,0.3)' }} />
                  <p className="text-xs text-indigo-200">Online · usually replies instantly</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close chat"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-indigo-200 transition-colors hover:bg-white/10 hover:text-white"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Quick prompts */}
            <div className="flex flex-wrap gap-1.5 border-b border-gray-100 bg-gray-50/70 px-4 py-2.5">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  className="ff-chip rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-600 disabled:opacity-40"
                  onClick={() => sendMessage(prompt)}
                  disabled={isSending}
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Messages */}
            <div
              ref={listRef}
              className="ff-scroll flex-1 overflow-y-auto px-4 py-4"
              style={{ minHeight: 0 }}
            >
              <div className="space-y-3">
                {messages.map((m) => {
                  const isUser = m.role === 'user'
                  return (
                    <div key={m.id} className={`ff-bubble flex items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
                      {!isUser && <BotAvatar size={24} />}
                      <div
                        className={`max-w-[82%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                          isUser
                            ? 'rounded-br-sm text-white'
                            : 'rounded-bl-sm bg-gray-100 text-gray-900'
                        }`}
                        style={isUser ? { background: 'linear-gradient(135deg, #0800A0, #4c1d95)' } : {}}
                      >
                        {m.content}
                      </div>
                    </div>
                  )
                })}

                {/* Typing indicator */}
                {isSending && (
                  <div className="ff-bubble flex items-end gap-2">
                    <BotAvatar size={24} />
                    <TypingIndicator />
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div className="ff-bubble rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                    <span className="mr-1.5">⚠</span>{error}
                  </div>
                )}

                {/* Escalation */}
                {shouldEscalate && (
                  <div className="ff-bubble rounded-2xl border px-4 py-3.5" style={{ borderColor: 'rgba(8,0,160,0.2)', background: 'rgba(8,0,160,0.04)' }}>
                    <p className="text-sm font-semibold text-gray-900">Need more help?</p>
                    <p className="mt-1 text-sm text-gray-600">
                      Reach us at <span className="font-medium text-gray-800">{CONTACT_EMAIL}</span> or{' '}
                      <span className="font-medium text-gray-800">{CONTACT_SALES_PHONE}</span>.
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500">{CONTACT_SUPPORT_HOURS}</p>
                    <div className="mt-3">
                      <Link
                        href={CONTACT_PAGE_HREF}
                        className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold text-white transition-colors"
                        style={{ background: 'var(--accent)' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent-hover)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--accent)')}
                      >
                        Go to Contact page
                        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Input */}
            <div className="border-t border-gray-100 bg-white px-3 py-3">
              <div className="flex items-end gap-2 rounded-xl border border-gray-200 bg-gray-50/60 px-3 py-2 transition-colors focus-within:border-[#0800A0] focus-within:bg-white"
                style={{ boxShadow: 'none' }}
              >
                <textarea
                  ref={textareaRef}
                  id="chatbot-input"
                  value={input}
                  onChange={handleTextareaChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      const text = input
                      setInput('')
                      void sendMessage(text)
                    }
                  }}
                  rows={1}
                  className="ff-textarea max-h-28 flex-1 resize-none bg-transparent text-sm text-gray-900 placeholder:text-gray-400"
                  style={{ border: 'none', outline: 'none', boxShadow: 'none', lineHeight: '1.5' }}
                  placeholder="Ask a question… (Enter to send)"
                  aria-label="Message"
                />
                <button
                  type="button"
                  disabled={isSending || !input.trim()}
                  onClick={() => {
                    const text = input
                    setInput('')
                    void sendMessage(text)
                  }}
                  className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white transition-all disabled:opacity-40 ${isSending ? 'ff-btn-sending' : 'hover:opacity-90 active:scale-95'}`}
                  style={{ background: 'var(--accent)' }}
                  aria-label="Send message"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19V5M5 12l7-7 7 7" />
                  </svg>
                </button>
              </div>
              <p className="mt-1.5 text-center text-[10px] text-gray-400">Powered by FeedForge AI · Shift+Enter for new line</p>
            </div>
          </div>
        )}

        {/* ── FAB ── */}
        <button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          aria-label={isOpen ? 'Close chat' : 'Open chat'}
          className={`ff-fab relative inline-flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl active:scale-95 ${isOpen ? '' : ''}`}
          style={{ background: isOpen ? '#374151' : 'linear-gradient(135deg, #0800A0 0%, #4c1d95 100%)' }}
        >
          {isOpen ? (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18 18 6M6 6l12 12" />
            </svg>
          ) : (
            <>
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                  d="M21 11.5a8.38 8.38 0 0 1-9 8.5 8.38 8.38 0 0 1-4.5-1.3L3 20l1.2-3.6A8.4 8.4 0 0 1 3 11.5 8.5 8.5 0 0 1 12 3a8.5 8.5 0 0 1 9 8.5Z"
                />
              </svg>
              {/* Unread badge */}
              {!isOpen && unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </>
          )}
        </button>
      </div>
    </>
  )
}
