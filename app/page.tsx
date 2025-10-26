import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <nav className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-900 to-blue-700 rounded flex items-center justify-center">
                  <span className="text-white font-bold text-lg">⚓</span>
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-900 to-blue-700 bg-clip-text text-transparent">
                  Onshore Logistics
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/marketplace" className="text-slate-700 hover:text-blue-900 font-medium transition-colors">
                Marketplace
              </Link>
              <Link href="/login" className="text-slate-700 hover:text-blue-900 font-medium transition-colors">
                Login
              </Link>
              <Link
                href="/register"
                className="px-5 py-2 bg-gradient-to-r from-blue-900 to-blue-700 text-white rounded-lg hover:from-blue-800 hover:to-blue-600 font-medium transition-all shadow-md hover:shadow-lg"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <div className="inline-flex items-center px-4 py-2 bg-blue-100 rounded-full text-blue-900 text-sm font-medium mb-6">
            <span className="mr-2">⚓</span>
            Premium Yachting Logistics
          </div>
          <h1 className="text-5xl tracking-tight font-extrabold text-slate-900 sm:text-6xl md:text-7xl">
            <span className="block">Optimize Van Space</span>
            <span className="block bg-gradient-to-r from-blue-900 via-blue-700 to-blue-600 bg-clip-text text-transparent">
              for Yacht Deliveries
            </span>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-slate-600 sm:text-xl md:mt-8">
            Connect carriers with available van space to suppliers who need it. Efficient, cost-effective delivery solutions for the yachting industry.
          </p>
          <div className="mt-8 max-w-md mx-auto sm:flex sm:justify-center md:mt-12 gap-4">
            <div className="rounded-lg shadow-lg">
              <Link
                href="/register"
                className="w-full flex items-center justify-center px-8 py-4 border border-transparent text-base font-semibold rounded-lg text-white bg-gradient-to-r from-blue-900 to-blue-700 hover:from-blue-800 hover:to-blue-600 md:text-lg md:px-10 transition-all"
              >
                Get Started
              </Link>
            </div>
            <div className="mt-3 rounded-lg shadow-lg sm:mt-0">
              <Link
                href="/marketplace"
                className="w-full flex items-center justify-center px-8 py-4 border-2 border-blue-900 text-base font-semibold rounded-lg text-blue-900 bg-white hover:bg-slate-50 md:text-lg md:px-10 transition-all"
              >
                Browse Marketplace
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-24">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-900 to-blue-700 text-white text-3xl rounded-lg mb-4">
                🚐
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">For Carriers</h3>
              <p className="text-slate-600 leading-relaxed">
                Monetize your available van space and earn extra revenue on routes you&apos;re already running to yacht destinations.
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-900 to-blue-700 text-white text-3xl rounded-lg mb-4">
                📦
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">For Shippers</h3>
              <p className="text-slate-600 leading-relaxed">
                Find cost-effective delivery solutions for your goods to yacht destinations across the Mediterranean.
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-900 to-blue-700 text-white text-3xl rounded-lg mb-4">
                ⛵
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">For Yacht Clients</h3>
              <p className="text-slate-600 leading-relaxed">
                Book deliveries directly for your yacht supplies with ease, transparency, and premium service quality.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-24 bg-gradient-to-r from-blue-900 to-blue-700 rounded-2xl p-12 text-center shadow-2xl">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to optimize your logistics?</h2>
          <p className="text-blue-100 mb-8 text-lg max-w-2xl mx-auto">
            Join the premier marketplace for yacht logistics and start saving on delivery costs today.
          </p>
          <Link
            href="/register"
            className="inline-block px-10 py-4 bg-white text-blue-900 font-bold rounded-lg hover:bg-slate-100 transition-all shadow-lg hover:shadow-xl"
          >
            Sign Up Now
          </Link>
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center">
            <p className="text-slate-600 text-sm">
              © 2025 Onshore Logistics. All rights reserved.
            </p>
            <div className="flex items-center space-x-2 text-slate-500 text-sm">
              <span>⚓</span>
              <span>Premium Yachting Logistics Platform</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
