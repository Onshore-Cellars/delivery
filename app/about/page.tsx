import Link from 'next/link'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-extrabold text-navy-900 tracking-tight mb-8">About YachtHop</h1>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8 mb-8">
          <h2 className="text-xl font-bold text-navy-900 mb-4">The Premium Yacht Logistics Marketplace</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            YachtHop is the leading marketplace connecting carriers with spare van capacity to yacht owners, suppliers,
            and marine businesses who need reliable delivery to ports and marinas across the Mediterranean and beyond.
          </p>
          <p className="text-slate-600 leading-relaxed mb-4">
            Founded on the principle that yacht logistics should be simple, transparent, and premium, YachtHop enables
            carriers to monetise spare space on routes they already travel, while giving shippers access to affordable,
            tracked delivery services to even the most exclusive destinations.
          </p>
          <p className="text-slate-600 leading-relaxed">
            From provisions and equipment to luxury goods and spare parts, YachtHop handles it all with full tracking,
            secure payments, and a network of verified carriers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { stat: '50+', label: 'Ports Covered', desc: 'Across the Mediterranean, Atlantic, and Caribbean' },
            { stat: '200+', label: 'Verified Carriers', desc: 'Professional, insured, and reviewed by the community' },
            { stat: '98%', label: 'On-Time Delivery', desc: 'Industry-leading reliability for your shipments' },
          ].map(item => (
            <div key={item.label} className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 text-center">
              <div className="text-3xl font-extrabold text-navy-900">{item.stat}</div>
              <div className="text-sm font-semibold text-gold-600 mt-1">{item.label}</div>
              <p className="text-xs text-slate-500 mt-2">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8 mb-8">
          <h2 className="text-xl font-bold text-navy-900 mb-4">How It Works</h2>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-navy-100 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-navy-700">1</span>
              </div>
              <div>
                <h3 className="font-semibold text-navy-900">Carriers List Spare Space</h3>
                <p className="text-sm text-slate-500 mt-1">If you&apos;re already driving to a port or marina, list your available van space with your route, dates, and pricing.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-navy-100 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-navy-700">2</span>
              </div>
              <div>
                <h3 className="font-semibold text-navy-900">Shippers Book Space</h3>
                <p className="text-sm text-slate-500 mt-1">Browse available routes, book the capacity you need, and pay securely online. Or request a custom quote.</p>
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

        <div className="bg-navy-900 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">Ready to get started?</h2>
          <p className="text-slate-300 mb-6">Join the marketplace trusted by yacht owners and carriers across the Med.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="btn-gold text-sm !py-3 !px-8">Create Account</Link>
            <Link href="/marketplace" className="inline-flex items-center justify-center px-8 py-3 rounded-lg text-sm font-semibold text-white border border-white/20 hover:bg-white/5 transition-all">Browse Marketplace</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
