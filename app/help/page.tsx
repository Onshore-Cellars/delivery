'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../components/AuthProvider'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

const faqs = [
  {
    q: 'How do I book space on a van?',
    a: 'Browse the marketplace to find available routes, select a listing that matches your needs, and click "Book Space". Enter your cargo details, choose your preferred dates, and confirm payment. You\'ll receive a booking confirmation with a tracking code immediately.',
  },
  {
    q: 'How does insurance work?',
    a: 'Each carrier maintains their own insurance policy, which is displayed on their listing. Before booking, review the insurance coverage to ensure it meets your needs. For high-value items, you may want to arrange additional coverage. Contact the carrier directly if you have questions about their policy.',
  },
  {
    q: 'How do return leg bookings work?',
    a: 'Return leg bookings let you take advantage of carriers heading back after a delivery. These are often available at reduced rates. Look for listings marked "Return Leg" on the marketplace, or ask a carrier if they have availability on their return journey.',
  },
  {
    q: 'How do I track my delivery?',
    a: 'Every booking receives a unique tracking code (OD-XXXXXXXX). Visit the Track page and enter your code to see real-time status updates — from pickup through to final delivery at your marina or port.',
  },
  {
    q: 'How does pricing work?',
    a: 'Carriers set their own prices based on route, distance, and cargo type. Pricing is shown per booking or per unit of space. A 10% platform fee is included in the displayed price. Some carriers also accept bids, allowing you to propose your own price.',
  },
]

export default function HelpPage() {
  const { user, token, loading: authLoading } = useAuth()
  const router = useRouter()
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Hi! I\'m the Onshore Deliver assistant. How can I help you today?' },
  ])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [authLoading, user, router])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index)
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !input.trim() || sending) return

    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setSending(true)

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }))
      const res = await fetch('/api/ai/help', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: userMessage, history }),
      })

      if (res.ok) {
        const data = await res.json()
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply || data.message || 'Sorry, I couldn\'t process that. Please try again.' }])
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }])
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I couldn\'t connect. Please check your connection and try again.' }])
    } finally {
      setSending(false)
    }
  }

  if (authLoading || !user) {
    return <div className="flex items-center justify-center py-20"><div className="loading-shimmer w-64 h-8 rounded-lg" /></div>
  }

  return (
    <div className="page-container narrow">
      <div className="mb-8">
        <p className="text-[11px] font-semibold text-[#FF6A2A] uppercase tracking-[0.15em] mb-1">Support</p>
        <h1 className="text-xl sm:text-2xl font-semibold text-[#F7F9FB] tracking-[-0.02em]">Help & Support</h1>
        <p className="mt-1.5 text-sm text-[#6B7C86]">Find answers to common questions or chat with our AI assistant</p>
      </div>

      {/* FAQ Section */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-[#F7F9FB] uppercase tracking-wider mb-3">Frequently Asked Questions</h2>
        <div className="bg-[#162E3D] rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.3)] border border-white/10 divide-y divide-white/10">
          {faqs.map((faq, i) => (
            <div key={i}>
              <button
                onClick={() => toggleFaq(i)}
                className="w-full flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 text-left hover:bg-[#162E3D] active:bg-[#102535] transition-colors"
              >
                <span className="text-sm font-medium text-[#F7F9FB] pr-4">{faq.q}</span>
                <svg
                  className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openFaq === i && (
                <div className="px-4 sm:px-6 pb-4">
                  <p className="text-sm text-[#9AADB8] leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* AI Chat Section */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-[#F7F9FB] uppercase tracking-wider mb-3">AI Support Assistant</h2>
        <div className="bg-[#162E3D] rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.3)] border border-white/10 overflow-hidden flex flex-col" style={{ height: '480px' }}>
          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${
                  msg.role === 'user'
                    ? 'bg-[#FF6A2A] text-white rounded-br-md'
                    : 'bg-[#162E3D] text-[#F7F9FB] rounded-bl-md'
                }`}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-[#162E3D] text-[#F7F9FB] px-4 py-2.5 rounded-2xl rounded-bl-md">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat input */}
          <form onSubmit={sendMessage} className="p-4 border-t border-slate-100">
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-sm text-[#F7F9FB] focus:border-[#FF6A2A] focus:ring-2 focus:ring-[#FF6A2A]/10 outline-none"
                placeholder="Ask a question..."
                value={input}
                onChange={e => setInput(e.target.value)}
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                className="btn-primary !py-2.5 !px-4 !rounded-xl disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
