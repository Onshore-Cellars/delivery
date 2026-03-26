import Link from 'next/link'

export default function AboutPage() {
  return (
    <div className="page-container narrow">
        <p className="text-[11px] font-semibold text-[#FF6A2A] uppercase tracking-[0.15em] mb-1.5">About Us</p>
        <h1 className="text-2xl sm:text-3xl font-semibold text-[#1a1a1a] tracking-[-0.02em] mb-8 sm:mb-10">About Onshore Deliver</h1>

        {/* The Problem */}
        <div className="bg-[#162E3D] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#e8e4de] p-6 sm:p-10 mb-8 sm:mb-10">
          <h2 className="text-lg sm:text-xl font-bold text-[#1a1a1a] mb-4">The Problem We Solve</h2>
          <p className="text-sm sm:text-base text-[#9AADB8] leading-relaxed mb-4">
            Right now, five different vendors send five separate vans to the same yacht at the same marina on the same morning. Five journeys, five sets of fuel, five parking headaches &mdash; and most of those vans drive back completely empty. It&rsquo;s wasteful, expensive, and clogs up port access for everyone.
          </p>
          <p className="text-sm sm:text-base text-[#9AADB8] leading-relaxed mb-4">
            Onshore Deliver exists to end that. We&rsquo;re a consolidated delivery marketplace built for the maritime industry &mdash; connecting <strong>crew, vendors, provisioners, fleet managers, and shipyard teams</strong> with carriers who already have van space on the routes they need.
          </p>
          <p className="text-sm sm:text-base text-[#9AADB8] leading-relaxed">
            Instead of every supplier running their own vehicle, multiple orders share a single van. One trip handles wine from the merchant, parts from the chandlery, provisions from the caterer, and last-minute crew gear &mdash; all delivered dockside in one go. The van fills up, costs drop, and the yacht gets everything faster.
          </p>
        </div>

        {/* Two-Way Routes */}
        <div className="bg-[#faf9f7] rounded-2xl border border-[#e8e4de] p-6 sm:p-10 mb-8 sm:mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-[#FF6A2A]/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-[#FF6A2A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[#1a1a1a]">Two-Way Routes &mdash; No Empty Returns</h2>
          </div>
          <p className="text-sm sm:text-base text-[#9AADB8] leading-relaxed mb-4">
            A delivery van drives to Monaco loaded with provisions. That same van drives back empty. Every single day, across every port in the Med. That&rsquo;s thousands of wasted kilometres and zero revenue on the return leg.
          </p>
          <p className="text-sm sm:text-base text-[#9AADB8] leading-relaxed mb-4">
            With Onshore Deliver, carriers list <strong>both directions</strong> of every route. Heading to the yacht? Carry supplies down. Heading back? Bring laundry, equipment for repair, warranty returns, or crew luggage back to shore. Vendors and crew can book space on either leg &mdash; or both.
          </p>
          <p className="text-sm sm:text-base text-[#9AADB8] leading-relaxed">
            For carriers, it doubles their earning potential on every run. For the industry, it halves the number of vans clogging marina car parks. Everyone wins.
          </p>
        </div>

        {/* Who We Serve */}
        <div className="bg-[#162E3D] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#e8e4de] p-6 sm:p-10 mb-8 sm:mb-10">
          <h2 className="text-lg sm:text-xl font-bold text-[#1a1a1a] mb-4">Built for the People Who Run Yachts</h2>
          <p className="text-sm sm:text-base text-[#9AADB8] leading-relaxed mb-6">
            We&rsquo;re not connecting yacht owners with luxury experiences. We&rsquo;re the logistics backbone for the people who actually operate them &mdash; the crew ordering parts at midnight, the fleet manager coordinating across three ports, the chandlery rushing an engine filter before departure.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { role: 'Yacht Crew', desc: 'Get last-minute orders delivered to your berth. Track MMSI so deliveries follow your vessel, not a fixed address.' },
              { role: 'Provisioners & Vendors', desc: 'Stop running your own van to every marina. Share space on carriers already heading there.' },
              { role: 'Fleet Management', desc: 'Coordinate deliveries across your entire fleet. One dashboard, every vessel, every port.' },
              { role: 'Shipyards & Refit', desc: 'Heavy parts, tools, warranty returns. Book the right vehicle with tail lift or flatbed capacity.' },
            ].map(item => (
              <div key={item.role} className="p-4 rounded-xl bg-[#faf9f7] border border-[#e8e4de]">
                <h3 className="font-semibold text-[#1a1a1a] text-sm mb-1">{item.role}</h3>
                <p className="text-xs text-[#6B7C86] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-10">
          {[
            { stat: '50+', label: 'Destinations', desc: 'Mediterranean, Atlantic, and Caribbean hubs' },
            { stat: '200+', label: 'Verified Carriers', desc: 'Professional, insured, and community-reviewed' },
            { stat: '98%', label: 'On-Time Delivery', desc: 'Industry-leading reliability' },
          ].map(item => (
            <div key={item.label} className="bg-[#162E3D] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#e8e4de] p-6 sm:p-8 text-center hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-shadow">
              <div className="text-3xl sm:text-4xl font-semibold text-[#1a1a1a] tracking-[-0.02em]">{item.stat}</div>
              <div className="text-sm font-semibold text-[#FF6A2A] mt-1">{item.label}</div>
              <p className="text-xs text-[#6B7C86] mt-2">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-[#162E3D] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#e8e4de] p-6 sm:p-10 mb-8 sm:mb-10">
          <h2 className="text-lg sm:text-xl font-bold text-[#1a1a1a] mb-6">How It Works</h2>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-[#f5f5f7] flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-[#1a1a1a]">1</span>
              </div>
              <div>
                <h3 className="font-semibold text-[#1a1a1a]">Carriers List Spare Space &mdash; Both Ways</h3>
                <p className="text-sm text-[#6B7C86] mt-1">Driving to a port or marina? List your spare capacity on the outbound run and on the return. Set pricing for each direction.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-[#f5f5f7] flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-[#1a1a1a]">2</span>
              </div>
              <div>
                <h3 className="font-semibold text-[#1a1a1a]">Crew, Vendors &amp; Managers Book Space</h3>
                <p className="text-sm text-[#6B7C86] mt-1">Browse available routes, book capacity for supplies going to the yacht or items coming back. Request a quote for custom loads.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-[#f5f5f7] flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-[#1a1a1a]">3</span>
              </div>
              <div>
                <h3 className="font-semibold text-[#1a1a1a]">Track Live, Delivered Dockside</h3>
                <p className="text-sm text-[#6B7C86] mt-1">Drivers start their route from the app. You see live position, ETA, and get SMS updates. Delivery confirmed with signature and photo at the berth.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Platform Features */}
        <div className="bg-[#162E3D] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#e8e4de] p-6 sm:p-10 mb-8 sm:mb-10">
          <h2 className="text-lg sm:text-xl font-bold text-[#1a1a1a] mb-6">Platform Features</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { feat: 'MMSI Vessel Tracking', desc: 'Link deliveries to your yacht\'s MMSI. We track where your vessel is so deliveries find you.' },
              { feat: 'Live Driver Tracking', desc: 'See your driver\'s real-time position, speed, and ETA on a live map. Share tracking links with crew.' },
              { feat: 'SMS & Push Notifications', desc: 'Free instant alerts when your delivery status changes. No app install needed for SMS.' },
              { feat: 'Two-Way Route Listings', desc: 'Carriers list outbound and return legs. Book space in either direction or both.' },
              { feat: 'All Vehicle Types', desc: 'Small vans to 7.5t trucks, refrigerated, tail lift, flatbed, curtain-side &mdash; whatever the job needs.' },
              { feat: 'Proof of Delivery', desc: 'Digital signature, photo, and notes at delivery. Full audit trail for every shipment.' },
              { feat: 'Bidding & Quotes', desc: 'Set your price or let carriers bid. Request custom quotes for unusual loads.' },
              { feat: 'Community & Reviews', desc: 'Verified carrier reviews, community board for route tips, and trusted ratings.' },
            ].map(item => (
              <div key={item.feat} className="flex items-start gap-3 p-3 rounded-lg">
                <svg className="w-5 h-5 text-[#FF6A2A] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <h3 className="text-sm font-semibold text-[#1a1a1a]">{item.feat}</h3>
                  <p className="text-xs text-[#6B7C86] mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#1d1d1f] rounded-2xl p-6 sm:p-10 text-center relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/3 right-1/4 w-[200px] h-[200px] bg-[#FF6A2A]/[0.05] rounded-full blur-[80px]" />
          </div>
          <div className="relative">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">Stop sending empty vans.</h2>
          <p className="text-sm sm:text-base text-slate-300 mb-6">Join crew, vendors, fleet managers, and carriers who are making maritime logistics smarter.</p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Link href="/register" className="btn-primary text-sm !py-3 !px-8">Create Free Account</Link>
            <Link href="/marketplace" className="inline-flex items-center justify-center px-8 py-3 rounded-xl text-sm font-semibold text-white border border-white/20 hover:bg-[#162E3D]/5 transition-all">Browse Marketplace</Link>
          </div>
          </div>
        </div>
      </div>
  )
}
