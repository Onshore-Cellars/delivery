'use client'

import { useState } from 'react'
import Link from 'next/link'

const faqs = [
  {
    category: 'Getting Started',
    items: [
      { q: 'How do I create an account?', a: 'Click "Get Started" and choose your role: Carrier/Driver (you have van space), Provisioner/Vendor (you supply goods), or Owner/Management (you manage operations and need deliveries). Fill in your details and you\'re ready to go.' },
      { q: 'Is Onshore Deliver free to use?', a: 'Creating an account and browsing listings is completely free. We charge a 10% platform fee on completed bookings, which is deducted from the carrier\'s payout automatically.' },
      { q: 'What areas do you cover?', a: 'We cover ports and marinas across the Mediterranean, including France, Italy, Spain, Greece, Croatia, and more. Our network is growing — check the marketplace for current routes.' },
    ],
  },
  {
    category: 'For Provisioners & Vendors',
    items: [
      { q: 'How do I book a delivery?', a: 'Browse the marketplace, find a route that matches your needs, and click "Book Space". Enter your cargo details, delivery address (including vessel or site name if applicable), and confirm your booking.' },
      { q: 'How do I track my shipment?', a: 'Every booking gets a unique tracking code (OD-XXXXXXXX). Visit the Track page, enter your code, and see real-time status updates from pickup to final delivery.' },
      { q: 'What if my delivery is damaged or lost?', a: 'Contact the carrier directly through our messaging system. If you cannot resolve the issue, our support team can help mediate. Carriers maintain their own insurance — check the listing for insurance details.' },
      { q: 'Can I request a custom quote?', a: 'Yes! Go to the Quotes page and submit a quote request with your route, cargo details, and preferred dates. Carriers in the area will respond with pricing.' },
    ],
  },
  {
    category: 'For Carriers',
    items: [
      { q: 'How do I list my spare space?', a: 'Click "List Space" in the navigation. Enter your route, vehicle details, available capacity, pricing, and departure date. Your listing goes live immediately.' },
      { q: 'How do I get paid?', a: 'Connect your Stripe account from your profile. When a booking is completed, the payment (minus 10% platform fee) is transferred to your Stripe account automatically.' },
      { q: 'Can I set up recurring routes?', a: 'Yes — when creating a listing, enable the "Recurring" option and set the schedule (weekly, biweekly, etc.). This helps regular shippers find you for ongoing deliveries.' },
      { q: 'How do bids work?', a: 'Enable bidding on your listing to let shippers propose their own prices. You can accept, reject, or counter-offer any bid. Accepted bids automatically create a booking.' },
    ],
  },
  {
    category: 'Payments & Security',
    items: [
      { q: 'How are payments processed?', a: 'All payments go through Stripe, a leading global payment processor. We support major credit/debit cards. Your payment details are never stored on our servers.' },
      { q: 'What is the cancellation policy?', a: 'Cancellations more than 48 hours before departure get a full refund. Within 48 hours, a cancellation fee may apply. Check the specific listing terms for details.' },
      { q: 'Is my data secure?', a: 'Yes. We use HTTPS encryption, bcrypt password hashing, and Stripe for secure payments. Read our Privacy Policy for full details on how we protect your data.' },
    ],
  },
]

export default function HelpPage() {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set())

  const toggle = (id: string) => {
    const next = new Set(openItems)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setOpenItems(next)
  }

  return (
    <div className="page-container narrow">
        <div className="text-center mb-10 sm:mb-14">
          <p className="text-[11px] font-semibold text-[#C6904D] uppercase tracking-[0.15em] mb-1.5">Support</p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#1d1d1f] tracking-[-0.02em]">Help Centre</h1>
          <p className="mt-2.5 sm:mt-3 text-base sm:text-lg text-slate-500">Everything you need to know about Onshore Deliver</p>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-8 sm:mb-12">
          {[
            { title: 'Browse Marketplace', desc: 'Find available routes', href: '/marketplace', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
            { title: 'Track Shipment', desc: 'Enter your tracking code', href: '/tracking', icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7' },
            { title: 'Create Account', desc: 'Get started for free', href: '/register', icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z' },
          ].map(link => (
            <Link key={link.href} href={link.href} className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#e8e4de] p-5 sm:p-7 card-hover text-center">
              <svg className="w-8 h-8 text-[#1d1d1f] mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={link.icon} />
              </svg>
              <h3 className="font-semibold text-[#1d1d1f] text-sm">{link.title}</h3>
              <p className="text-xs text-slate-400 mt-1">{link.desc}</p>
            </Link>
          ))}
        </div>

        {/* FAQ Sections */}
        <div className="space-y-6 sm:space-y-8">
          {faqs.map(section => (
            <div key={section.category}>
              <h2 className="text-lg sm:text-xl font-bold text-[#1d1d1f] mb-3 sm:mb-4">{section.category}</h2>
              <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#e8e4de] divide-y divide-slate-100">
                {section.items.map((item, i) => {
                  const id = `${section.category}-${i}`
                  const isOpen = openItems.has(id)
                  return (
                    <div key={id}>
                      <button
                        onClick={() => toggle(id)}
                        className="w-full flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 text-left hover:bg-slate-50 active:bg-slate-100 transition-colors"
                      >
                        <span className="text-sm font-medium text-[#1d1d1f] pr-4">{item.q}</span>
                        <svg className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {isOpen && (
                        <div className="px-4 sm:px-6 pb-4">
                          <p className="text-sm text-slate-600 leading-relaxed">{item.a}</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Contact */}
        <div className="mt-10 sm:mt-14 bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#e8e4de] p-6 sm:p-10 text-center">
          <h2 className="text-xl font-bold text-[#1d1d1f] mb-2">Still need help?</h2>
          <p className="text-slate-500 text-sm mb-6">Our support team is here for you</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="mailto:support@onshore.delivery" className="btn-primary text-sm !py-2.5 !px-6 inline-flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              Email Support
            </a>
            <Link href="/messages" className="px-6 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors inline-flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              In-App Message
            </Link>
          </div>
        </div>
      </div>
  )
}
