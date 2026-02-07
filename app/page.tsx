import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
            <span className="block">Yacht Supply Delivery</span>
            <span className="block text-blue-600">Made Simple</span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Book space in supplier vans heading to marinas and yachts. Chandleries and suppliers list spare van capacity, yacht crews book deliveries in minutes.
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
              <h3 className="text-lg font-semibold text-gray-900 mb-2">For Yacht Suppliers</h3>
              <p className="text-gray-600">
                Running vans to marinas anyway? List your spare capacity and earn extra on every trip to the docks.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-blue-600 text-3xl mb-4">&#x26F5;</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">For Yacht Crews</h3>
              <p className="text-gray-600">
                Need provisions, parts or supplies dockside? Browse upcoming van runs and book space at a fraction of courier costs.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-blue-600 text-3xl mb-4">&#x2693;</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Marina to Marina</h3>
              <p className="text-gray-600">
                Real routes to real marinas. See available weight and volume, book instantly, and track your delivery dockside.
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
              <p className="text-sm text-gray-500 mt-1">Register as a Supplier (carrier) or Yacht Crew (customer)</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600 font-bold text-lg">2</div>
              <h4 className="font-semibold text-gray-900">List or Browse</h4>
              <p className="text-sm text-gray-500 mt-1">Suppliers list van runs to marinas, crews browse upcoming trips</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600 font-bold text-lg">3</div>
              <h4 className="font-semibold text-gray-900">Book Space</h4>
              <p className="text-sm text-gray-500 mt-1">Reserve the weight and volume you need, see price instantly</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600 font-bold text-lg">4</div>
              <h4 className="font-semibold text-gray-900">Delivered Dockside</h4>
              <p className="text-sm text-gray-500 mt-1">Track your delivery from warehouse to marina berth</p>
            </div>
          </div>
        </div>

        <div className="mt-24 bg-blue-600 rounded-lg p-12 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Get supplies to the dock, the smart way</h2>
          <p className="text-blue-100 mb-8 text-lg">
            Join yacht suppliers and crews already saving on marina deliveries.
          </p>
          <Link
            href="/register"
            className="inline-block px-8 py-3 bg-white text-blue-600 font-semibold rounded-md hover:bg-gray-100"
          >
            Sign Up Free
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
