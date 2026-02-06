import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-blue-600">VanShare</Link>
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
            <span className="block">Share Van Space</span>
            <span className="block text-blue-600">Save on Delivery</span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            The marketplace connecting van carriers with spare capacity to customers who need affordable deliveries. List your space or book a delivery in minutes.
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
                Browse Deliveries
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-24">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-blue-600 text-3xl mb-4">&#x1F69A;</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">For Carriers</h3>
              <p className="text-gray-600">
                Got spare space in your van? List your routes and earn extra income on trips you are already making.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-blue-600 text-3xl mb-4">&#x1F4E6;</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">For Customers</h3>
              <p className="text-gray-600">
                Need something delivered? Browse available routes and book van space at a fraction of the usual cost.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-blue-600 text-3xl mb-4">&#x2705;</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Simple &amp; Transparent</h3>
              <p className="text-gray-600">
                Clear pricing, real-time capacity tracking, and booking management all in one place.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-24">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            <div className="text-center">
              <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600 font-bold text-lg">1</div>
              <h4 className="font-semibold text-gray-900">Sign Up</h4>
              <p className="text-sm text-gray-500 mt-1">Create a free account as a Carrier or Customer</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600 font-bold text-lg">2</div>
              <h4 className="font-semibold text-gray-900">List or Browse</h4>
              <p className="text-sm text-gray-500 mt-1">Carriers list van space, customers browse routes</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600 font-bold text-lg">3</div>
              <h4 className="font-semibold text-gray-900">Book</h4>
              <p className="text-sm text-gray-500 mt-1">Reserve space with weight and volume you need</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600 font-bold text-lg">4</div>
              <h4 className="font-semibold text-gray-900">Deliver</h4>
              <p className="text-sm text-gray-500 mt-1">Track your delivery from pickup to dropoff</p>
            </div>
          </div>
        </div>

        <div className="mt-24 bg-blue-600 rounded-lg p-12 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to start sharing van space?</h2>
          <p className="text-blue-100 mb-8 text-lg">
            Join the marketplace and start saving on delivery costs today.
          </p>
          <Link
            href="/register"
            className="inline-block px-8 py-3 bg-white text-blue-600 font-semibold rounded-md hover:bg-gray-100"
          >
            Sign Up Free
          </Link>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-gray-500 text-sm">
            VanShare - Share Van Space, Save on Delivery
          </p>
        </div>
      </footer>
    </div>
  );
}
