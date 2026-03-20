import Link from 'next/link'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 sm:px-8 py-10 sm:py-14">
        <p className="text-[11px] font-semibold text-[#0071e3] uppercase tracking-[0.15em] mb-1.5">About Us</p>
        <h1 className="text-2xl sm:text-3xl font-semibold text-[#1d1d1f] tracking-[-0.02em] mb-8 sm:mb-10">About Onshore Deliver</h1>

        <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-slate-100/80 p-6 sm:p-10 mb-8 sm:mb-10">
          <h2 className="text-lg sm:text-xl font-bold text-[#1d1d1f] mb-4">The Delivery Logistics Marketplace</h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed mb-4">
            Onshore Deliver is the marketplace built exclusively for the delivery world &mdash; connecting provisioners, vendors, fleet management companies, and crew with carriers who have spare van capacity on routes between key destinations.
          </p>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed mb-4">
            Think &ldquo;AnyVan&rdquo; but strictly for the logistics ecosystem. Carriers already making runs to ports like Antibes, Monaco, Palma, or Sardinia can list their spare space. Vendors and provisioners can book that capacity for wine, provisions, equipment, parts &mdash; anything delivery-related.
          </p>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            We optimise existing trips, not create new ones. Every delivery shares space on a van already heading to a logistics hub, making logistics more efficient, sustainable, and affordable for the entire industry.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-10">
          {[
            { stat: '50+', label: 'Destinations', desc: 'Mediterranean, Atlantic, and Caribbean hubs' },
            { stat: '200+', label: 'Verified Carriers', desc: 'Professional, insured, and community-reviewed' },
            { stat: '98%', label: 'On-Time Delivery', desc: 'Industry-leading reliability' },
          ].map(item => (
            <div key={item.label} className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-slate-100/80 p-6 sm:p-8 text-center hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-shadow">
              <div className="text-3xl sm:text-4xl font-semibold text-[#1d1d1f] tracking-[-0.02em]">{item.stat}</div>
              <div className="text-sm font-semibold text-[#0071e3] mt-1">{item.label}</div>
              <p className="text-xs text-slate-500 mt-2">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-slate-100/80 p-6 sm:p-10 mb-8 sm:mb-10">
          <h2 className="text-lg sm:text-xl font-bold text-[#1d1d1f] mb-6">How It Works</h2>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-[#f5f5f7] flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-[#1d1d1f]">1</span>
              </div>
              <div>
                <h3 className="font-semibold text-[#1d1d1f]">Carriers List Spare Space</h3>
                <p className="text-sm text-slate-500 mt-1">Already driving to a port or marina? List your spare van space with route, dates, and pricing.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-[#f5f5f7] flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-[#1d1d1f]">2</span>
              </div>
              <div>
                <h3 className="font-semibold text-[#1d1d1f]">Vendors & Provisioners Book Space</h3>
                <p className="text-sm text-slate-500 mt-1">Browse available routes, book capacity for supplies, or request a custom quote for your delivery.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-[#f5f5f7] flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-[#1d1d1f]">3</span>
              </div>
              <div>
                <h3 className="font-semibold text-[#1d1d1f]">Track & Deliver</h3>
                <p className="text-sm text-slate-500 mt-1">Track your shipment in real-time from pickup to final delivery. Rate your experience and build trust.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#1d1d1f] rounded-2xl p-6 sm:p-10 text-center relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/3 right-1/4 w-[200px] h-[200px] bg-[#0071e3]/[0.05] rounded-full blur-[80px]" />
          </div>
          <div className="relative">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">Ready to get started?</h2>
          <p className="text-sm sm:text-base text-slate-300 mb-6">Join provisioners, vendors, and carriers across the delivery industry.</p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Link href="/register" className="btn-primary text-sm !py-3 !px-8">Create Account</Link>
            <Link href="/marketplace" className="inline-flex items-center justify-center px-8 py-3 rounded-xl text-sm font-semibold text-white border border-white/20 hover:bg-white/5 transition-all">Browse Marketplace</Link>
          </div>
          </div>
        </div>
      </div>
    </div>
  )
}
