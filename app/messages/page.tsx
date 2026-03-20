'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../components/AuthProvider'

interface Conversation {
  id: string
  subject?: string
  bookingRef?: string
  lastMessageAt: string
  user1: { id: string; name: string; company?: string; role: string }
  user2: { id: string; name: string; company?: string; role: string }
  messages: { content: string; createdAt: string; senderId: string; read: boolean }[]
  unreadCount: number
}

interface Message {
  id: string
  content: string
  type: string
  senderId: string
  read: boolean
  createdAt: string
  sender: { id: string; name: string; avatarUrl?: string }
}

interface OtherUser {
  id: string
  name: string
  company?: string
  role: string
  phone?: string
  email?: string
}

export default function MessagesPage() {
  const { user, token, loading: authLoading } = useAuth()
  const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [activeConv, setActiveConv] = useState<string | null>(null)
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const fetchConversations = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch('/api/messages', { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) {
        const data = await res.json()
        setConversations(data.conversations || [])
      }
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }, [token])

  const fetchMessages = useCallback(async (convId: string) => {
    if (!token) return
    try {
      const res = await fetch(`/api/messages/${convId}`, { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages || [])
        setOtherUser(data.otherUser)
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
      }
    } catch (err) { console.error(err) }
  }, [token])

  useEffect(() => {
    if (!authLoading && !user) { router.push('/login'); return }
    fetchConversations()
  }, [authLoading, user, router, fetchConversations])

  useEffect(() => {
    if (activeConv) fetchMessages(activeConv)
  }, [activeConv, fetchMessages])

  // Poll for new messages
  useEffect(() => {
    if (!activeConv) return
    const interval = setInterval(() => fetchMessages(activeConv), 5000)
    return () => clearInterval(interval)
  }, [activeConv, fetchMessages])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !newMessage.trim() || !otherUser) return
    setSending(true)
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ recipientId: otherUser.id, content: newMessage }),
      })
      if (res.ok) {
        setNewMessage('')
        if (activeConv) fetchMessages(activeConv)
        fetchConversations()
      }
    } catch (err) { console.error(err) }
    finally { setSending(false) }
  }

  const getOther = (conv: Conversation) => conv.user1.id === user?.id ? conv.user2 : conv.user1
  const formatTime = (d: string) => {
    const date = new Date(d)
    const now = new Date()
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    }
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  }

  if (authLoading || !user) return <div className="min-h-screen flex items-center justify-center"><div className="loading-shimmer w-64 h-8 rounded-lg" /></div>

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 sm:px-8 py-8 sm:py-10">
        <div className="mb-6">
          <p className="text-[11px] font-semibold text-[#0071e3] uppercase tracking-[0.15em] mb-1">Communication</p>
          <h1 className="text-xl sm:text-2xl font-semibold text-[#1d1d1f] tracking-[-0.02em]">Messages</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-slate-100/80 overflow-hidden" style={{ height: 'calc(100vh - 220px)' }}>
          <div className="flex h-full">
            {/* Conversation list */}
            <div className={`${activeConv ? 'hidden md:block' : ''} w-full md:w-80 border-r border-slate-100 overflow-y-auto`}>
              {loading ? (
                <div className="p-4 space-y-3">{[1,2,3].map(i => <div key={i} className="loading-shimmer h-16 rounded-lg" />)}</div>
              ) : conversations.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">No conversations yet</div>
              ) : (
                conversations.map(conv => {
                  const other = getOther(conv)
                  const lastMsg = conv.messages[0]
                  return (
                    <button
                      key={conv.id}
                      onClick={() => setActiveConv(conv.id)}
                      className={`w-full text-left px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors ${activeConv === conv.id ? 'bg-[#f5f5f7]' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#f5f5f7] flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-semibold text-[#1d1d1f]">{other.name.split(' ').map(n => n[0]).join('')}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-[#1d1d1f] text-sm truncate">{other.name}</span>
                            {lastMsg && <span className="text-xs text-slate-400 flex-shrink-0">{formatTime(lastMsg.createdAt)}</span>}
                          </div>
                          <div className="flex items-center justify-between mt-0.5">
                            <span className="text-xs text-slate-500 truncate">{lastMsg?.content || conv.subject || 'New conversation'}</span>
                            {conv.unreadCount > 0 && (
                              <span className="ml-2 w-5 h-5 rounded-full bg-[#1d1d1f] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">{conv.unreadCount}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })
              )}
            </div>

            {/* Message area */}
            <div className={`${!activeConv ? 'hidden md:flex' : 'flex'} flex-1 flex-col`}>
              {activeConv && otherUser ? (
                <>
                  {/* Chat header */}
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button onClick={() => setActiveConv(null)} className="md:hidden p-1 hover:bg-slate-100 rounded">
                        <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                      </button>
                      <div className="w-8 h-8 rounded-full bg-[#f5f5f7] flex items-center justify-center">
                        <span className="text-xs font-semibold text-[#1d1d1f]">{otherUser.name.split(' ').map(n => n[0]).join('')}</span>
                      </div>
                      <div>
                        <div className="font-semibold text-[#1d1d1f] text-sm">{otherUser.name}</div>
                        <div className="text-xs text-slate-400">{otherUser.role.replace('_', ' ')}{otherUser.company && ` at ${otherUser.company}`}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {otherUser.phone && (
                        <a href={`tel:${otherUser.phone}`} className="p-2 hover:bg-slate-100 rounded-lg transition-colors" title="Call">
                          <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                        </a>
                      )}
                      {otherUser.email && (
                        <a href={`mailto:${otherUser.email}`} className="p-2 hover:bg-slate-100 rounded-lg transition-colors" title="Email">
                          <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                    {messages.map(msg => (
                      <div key={msg.id} className={`flex ${msg.senderId === user.id ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${
                          msg.senderId === user.id
                            ? 'bg-[#1d1d1f] text-white rounded-br-md'
                            : 'bg-slate-100 text-[#1d1d1f] rounded-bl-md'
                        }`}>
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                          <div className={`text-[10px] mt-1 ${msg.senderId === user.id ? 'text-white/50' : 'text-slate-400'}`}>
                            {formatTime(msg.createdAt)}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <form onSubmit={sendMessage} className="p-4 border-t border-slate-100">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-[#1d1d1f] focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/10 outline-none"
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                      />
                      <button type="submit" disabled={sending || !newMessage.trim()} className="btn-primary !py-2.5 !px-4 !rounded-xl disabled:opacity-50">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
                  Select a conversation to start messaging
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
