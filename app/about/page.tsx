import Link from 'next/link'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-5 sm:px-6 lg:px-8 py-8 sm:py-12">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight mb-6 sm:mb-8">About YachtHop</h1>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 sm:p-8 mb-6 sm:mb-8">
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {[
            { stat: '50+', label: 'Yacht Ports', desc: 'Mediterranean, Atlantic, and Caribbean hubs' },
            { stat: '200+', label: 'Verified Carriers', desc: 'Professional, insured, and community-reviewed' },
            { stat: '98%', label: 'On-Time Delivery', desc: 'Industry-leading reliability' },
          ].map(item => (
            <div key={item.label} className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 sm:p-6 text-center">
              <div className="text-3xl font-extrabold text-navy-900">{item.stat}</div>
              <div className="text-sm font-semibold text-gold-600 mt-1">{item.label}</div>
              <p className="text-xs text-slate-500 mt-2">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 sm:p-8 mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-navy-900 mb-4">How It Works</h2>
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

        <div className="bg-navy-900 rounded-xl p-5 sm:p-8 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">Ready to get started?</h2>
          <p className="text-sm sm:text-base text-slate-300 mb-6">Join provisioners, vendors, and carriers across the yachting industry.</p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Link href="/register" className="btn-gold text-sm !py-3 !px-8">Create Account</Link>
            <Link href="/marketplace" className="inline-flex items-center justify-center px-8 py-3 rounded-lg text-sm font-semibold text-white border border-white/20 hover:bg-white/5 transition-all">Browse Marketplace</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
