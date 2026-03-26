'use client'

import { useState, useEffect } from 'react'

interface PushNotificationPromptProps {
  token: string
}

export default function PushNotificationPrompt({ token }: PushNotificationPromptProps) {
  const [show, setShow] = useState(false)
  const [status, setStatus] = useState<'idle' | 'subscribing' | 'subscribed' | 'denied'>('idle')

  useEffect(() => {
    // Only show if push is supported and not already decided
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return
    if (localStorage.getItem('od_push_decided')) return

    // Check current permission
    if (Notification.permission === 'granted') {
      registerServiceWorker()
      return
    }
    if (Notification.permission === 'denied') return

    // Show prompt after a delay (don't interrupt initial page load)
    const t = setTimeout(() => setShow(true), 10000)
    return () => clearTimeout(t)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const registerServiceWorker = async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js')
      await reg.update()

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      })

      // Send subscription to server
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ subscription: sub.toJSON() }),
      })

      setStatus('subscribed')
    } catch {
      setStatus('denied')
    }
  }

  const handleEnable = async () => {
    setStatus('subscribing')
    localStorage.setItem('od_push_decided', 'true')

    const permission = await Notification.requestPermission()
    if (permission === 'granted') {
      await registerServiceWorker()
    } else {
      setStatus('denied')
    }
    setTimeout(() => setShow(false), 2000)
  }

  const handleDismiss = () => {
    localStorage.setItem('od_push_decided', 'true')
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed bottom-24 md:bottom-6 left-4 right-4 md:left-auto md:right-6 z-50 md:w-80 animate-slideUp">
      <div className="bg-[#162E3D] rounded-xl shadow-2xl border border-[#e8e4de] p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-[#FF6A2A]/10 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-[#FF6A2A]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-[#1a1a1a]">Stay Updated</h4>
            <p className="text-xs text-[#6B7C86] mt-0.5">Get notified about delivery updates, new messages, and bids.</p>
          </div>
          <button onClick={handleDismiss} className="text-slate-400 hover:text-[#9AADB8] p-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="flex gap-2 mt-3">
          <button onClick={handleEnable} disabled={status === 'subscribing'} className="btn-primary flex-1 text-xs py-2">
            {status === 'subscribing' ? 'Enabling...' : status === 'subscribed' ? 'Enabled!' : 'Enable Notifications'}
          </button>
          <button onClick={handleDismiss} className="btn-secondary text-xs py-2 px-3">Not now</button>
        </div>
      </div>
    </div>
  )
}
