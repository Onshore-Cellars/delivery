import Link from 'next/link'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100/50">
      <div className="max-w-4xl mx-auto px-5 sm:px-6 lg:px-8 py-10 sm:py-14">
        <p className="text-[11px] font-semibold text-gold-600 uppercase tracking-[0.15em] mb-1.5">About Us</p>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-[-0.02em] mb-8 sm:mb-10">About YachtHop</h1>

        <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-slate-100/80 p-6 sm:p-10 mb-8 sm:mb-10">
          <h2 className="text-lg sm:text-xl font-bold text-navy-900 mb-4">The Yachting Industry&apos;s Logistics Marketplace</h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed mb-4">
            YachtHop is the marketplace built exclusively for the yachting world &mdash; connecting provisioners, vendors, yacht management companies, and crew with carriers who have spare van capacity on routes between key yachting destinations.
          </p>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed mb-4">
            Think &ldquo;AnyVan&rdquo; but strictly for the yacht ecosystem. Carriers already making runs to ports like Antibes, Monaco, Palma, or Sardinia can list their spare space. Yacht vendors and provisioners can book that capacity for wine, provisions, equipment, parts &mdash; anything yacht-related.
          </p>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            We optimise existing trips, not create new ones. Every delivery shares space on a van already heading to a yachting hub, making logistics more efficient, sustainable, and affordable for the entire industry.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-10">
          {[
            { stat: '50+', label: 'Yacht Ports', desc: 'Mediterranean, Atlantic, and Caribbean hubs' },
            { stat: '200+', label: 'Verified Carriers', desc: 'Professional, insured, and community-reviewed' },
            { stat: '98%', label: 'On-Time Delivery', desc: 'Industry-leading reliability' },
          ].map(item => (
            <div key={item.label} className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-slate-100/80 p-6 sm:p-8 text-center hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-shadow">
              <div className="text-3xl sm:text-4xl font-extrabold text-navy-900 tracking-[-0.02em]">{item.stat}</div>
              <div className="text-sm font-semibold text-gold-600 mt-1">{item.label}</div>
              <p className="text-xs text-slate-500 mt-2">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-slate-100/80 p-6 sm:p-10 mb-8 sm:mb-10">
          <h2 className="text-lg sm:text-xl font-bold text-navy-900 mb-6">How It Works</h2>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-navy-100 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-navy-700">1</span>
              </div>
              <div>
                <h3 className="font-semibold text-navy-900">Carriers List Spare Space</h3>
                <p className="text-sm text-slate-500 mt-1">Already driving to a port or marina? List your spare van space with route, dates, and pricing.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-navy-100 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-navy-700">2</span>
              </div>
              <div>
                <h3 className="font-semibold text-navy-900">Vendors & Provisioners Book Space</h3>
                <p className="text-sm text-slate-500 mt-1">Browse available routes, book capacity for yacht supplies, or request a custom quote for your delivery.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-navy-100 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-navy-700">3</span>
              </div>
              <div>
                <h3 className="font-semibold text-navy-900">Track & Deliver</h3>
                <p className="text-sm text-slate-500 mt-1">Track your shipment in real-time from pickup to dockside delivery. Rate your experience and build trust.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-navy-900 rounded-2xl p-6 sm:p-10 text-center relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/3 right-1/4 w-[200px] h-[200px] bg-gold-500/[0.05] rounded-full blur-[80px]" />
          </div>
          <div className="relative">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">Ready to get started?</h2>
          <p className="text-sm sm:text-base text-slate-300 mb-6">Join provisioners, vendors, and carriers across the yachting industry.</p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Link href="/register" className="btn-gold text-sm !py-3 !px-8">Create Account</Link>
            <Link href="/marketplace" className="inline-flex items-center justify-center px-8 py-3 rounded-xl text-sm font-semibold text-white border border-white/20 hover:bg-white/5 transition-all">Browse Marketplace</Link>
          </div>
          </div>
        </div>
      </div>
    </div>
  )
}
