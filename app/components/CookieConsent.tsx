'use client'

import { useState, useEffect } from 'react'

type ConsentLevel = 'essential' | 'analytics' | 'marketing'

export default function CookieConsent() {
  const [show, setShow] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [consent, setConsent] = useState<Record<ConsentLevel, boolean>>({
    essential: true,
    analytics: false,
    marketing: false,
  })

  useEffect(() => {
    const stored = localStorage.getItem('od_cookie_consent')
    if (!stored) {
      // Delay showing banner slightly for better UX
      const t = setTimeout(() => setShow(true), 1500)
      return () => clearTimeout(t)
    }
  }, [])

  const saveConsent = (levels: Record<ConsentLevel, boolean>) => {
    localStorage.setItem('od_cookie_consent', JSON.stringify({ ...levels, timestamp: Date.now() }))
    setShow(false)
  }

  const acceptAll = () => saveConsent({ essential: true, analytics: true, marketing: true })
  const acceptSelected = () => saveConsent(consent)
  const rejectOptional = () => saveConsent({ essential: true, analytics: false, marketing: false })

  if (!show) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] animate-slideUp">
      <div className="max-w-lg mx-auto bg-[#162E3D] rounded-xl shadow-2xl border border-white/[0.08] overflow-hidden">
        <div className="p-5">
          <div className="flex items-start gap-3 mb-3">
            <span className="text-xl mt-0.5">🍪</span>
            <div>
              <h3 className="text-sm font-semibold text-[#F7F9FB]" style={{ fontFamily: 'var(--font-display)' }}>
                Cookie Preferences
              </h3>
              <p className="text-xs text-[#6B7C86] mt-1 leading-relaxed">
                We use cookies to improve your experience. Essential cookies are required for the site to function.
                You can choose which optional cookies to allow.
              </p>
            </div>
          </div>

          {showDetails && (
            <div className="mt-4 space-y-3 border-t border-white/[0.08] pt-4">
              <label className="flex items-center justify-between cursor-not-allowed">
                <div>
                  <span className="text-sm font-medium text-[#F7F9FB]">Essential</span>
                  <p className="text-xs text-[#6B7C86]">Authentication, security, preferences</p>
                </div>
                <div className="w-10 h-6 rounded-full bg-[#FF6A2A] relative">
                  <div className="absolute right-0.5 top-0.5 w-5 h-5 rounded-full bg-[#162E3D] shadow" />
                </div>
              </label>

              <label className="flex items-center justify-between cursor-pointer" onClick={() => setConsent(c => ({ ...c, analytics: !c.analytics }))}>
                <div>
                  <span className="text-sm font-medium text-[#F7F9FB]">Analytics</span>
                  <p className="text-xs text-[#6B7C86]">Usage data to improve the platform</p>
                </div>
                <div className={`w-10 h-6 rounded-full relative transition-colors ${consent.analytics ? 'bg-[#FF6A2A]' : 'bg-[#e8e4de]'}`}>
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-[#162E3D] shadow transition-all ${consent.analytics ? 'right-0.5' : 'left-0.5'}`} />
                </div>
              </label>

              <label className="flex items-center justify-between cursor-pointer" onClick={() => setConsent(c => ({ ...c, marketing: !c.marketing }))}>
                <div>
                  <span className="text-sm font-medium text-[#F7F9FB]">Marketing</span>
                  <p className="text-xs text-[#6B7C86]">Personalised offers and communications</p>
                </div>
                <div className={`w-10 h-6 rounded-full relative transition-colors ${consent.marketing ? 'bg-[#FF6A2A]' : 'bg-[#e8e4de]'}`}>
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-[#162E3D] shadow transition-all ${consent.marketing ? 'right-0.5' : 'left-0.5'}`} />
                </div>
              </label>
            </div>
          )}

          <div className="mt-4 flex flex-col gap-2">
            <button onClick={acceptAll} className="btn-primary w-full text-sm py-2.5">Accept All</button>
            <div className="flex gap-2">
              {showDetails ? (
                <button onClick={acceptSelected} className="btn-secondary flex-1 text-xs py-2">Save Preferences</button>
              ) : (
                <button onClick={() => setShowDetails(true)} className="btn-secondary flex-1 text-xs py-2">Customise</button>
              )}
              <button onClick={rejectOptional} className="btn-outline flex-1 text-xs py-2">Essential Only</button>
            </div>
          </div>

          <p className="text-[10px] text-[#6B7C86] mt-3 text-center">
            See our <a href="/privacy" className="underline hover:text-[#FF6A2A]">Privacy Policy</a> for details.
          </p>
        </div>
      </div>
    </div>
  )
}
