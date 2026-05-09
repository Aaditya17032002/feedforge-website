'use client'

import ChatbotWidget from '@/components/chatbot/ChatbotWidget'

function isEnabled() {
  if (typeof process.env.NEXT_PUBLIC_CHATBOT_ENABLED !== 'string') return false
  const raw = process.env.NEXT_PUBLIC_CHATBOT_ENABLED.trim().toLowerCase()
  return raw === '1' || raw === 'true' || raw === 'yes' || raw === 'on'
}

export default function ChatbotMount() {
  if (!isEnabled()) return null
  return <ChatbotWidget />
}

