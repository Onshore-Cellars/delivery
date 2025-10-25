import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Yachting Logistics</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/marketplace" className="text-gray-700 hover:text-gray-900">
                Marketplace
              </Link>
              <Link href="/login" className="text-gray-700 hover:text-gray-900">
                Login
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
            <span className="block">Optimize Van Space</span>
            <span className="block text-blue-600">in the Yachting Industry</span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Connect suppliers with spare van space to those who need it. Efficient, cost-effective delivery solutions for yacht destinations.
          </p>
          <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
            <div className="rounded-md shadow">
              <Link
                href="/register"
                className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10"
              >
                Get Started
              </Link>
            </div>
            <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
              <Link
                href="/marketplace"
                className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
              >
                Browse Marketplace
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-24">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-blue-600 text-3xl mb-4">🚐</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">For Carriers</h3>
              <p className="text-gray-600">
                List your available van space and earn extra revenue on routes you&apos;re already running.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-blue-600 text-3xl mb-4">📦</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">For Shippers</h3>
              <p className="text-gray-600">
                Find cost-effective delivery solutions for your goods to yacht destinations.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-blue-600 text-3xl mb-4">⚓</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">For Yacht Clients</h3>
              <p className="text-gray-600">
                Book deliveries directly for your yacht supplies with ease and transparency.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-24 bg-blue-600 rounded-lg p-12 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to optimize your logistics?</h2>
          <p className="text-blue-100 mb-8 text-lg">
            Join the marketplace and start saving on delivery costs today.
          </p>
          <Link
            href="/register"
            className="inline-block px-8 py-3 bg-white text-blue-600 font-semibold rounded-md hover:bg-gray-100"
          >
            Sign Up Now
          </Link>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-gray-500 text-sm">
            © 2025 Yachting Logistics. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
