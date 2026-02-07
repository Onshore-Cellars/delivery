import Link from 'next/link'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/" className="text-blue-600 hover:text-blue-800 text-sm font-medium">← Back to Home</Link>
        <h1 className="text-3xl font-bold text-gray-900 mt-4 mb-8">Terms of Service</h1>

        <div className="bg-white rounded-lg shadow p-8 prose prose-gray max-w-none">
          <h2 className="text-xl font-semibold mb-4">1. Acceptance of Terms</h2>
          <p className="text-gray-600 mb-6">By accessing and using DockDrop, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the platform.</p>

          <h2 className="text-xl font-semibold mb-4">2. Platform Description</h2>
          <p className="text-gray-600 mb-6">DockDrop is a marketplace that connects van carriers with spare delivery capacity to customers who need affordable delivery services. We facilitate connections but are not a party to delivery agreements between carriers and customers.</p>

          <h2 className="text-xl font-semibold mb-4">3. User Accounts</h2>
          <p className="text-gray-600 mb-6">You must provide accurate information when creating an account. You are responsible for maintaining the security of your account credentials. Users can register as either Carriers (offering van space) or Customers (booking deliveries).</p>

          <h2 className="text-xl font-semibold mb-4">4. Carrier Responsibilities</h2>
          <p className="text-gray-600 mb-6">Carriers must provide accurate listing information including routes, dates, capacity, and pricing. Carriers are responsible for fulfilling confirmed bookings safely and on time.</p>

          <h2 className="text-xl font-semibold mb-4">5. Customer Responsibilities</h2>
          <p className="text-gray-600 mb-6">Customers must provide accurate shipment information including weight, volume, and item descriptions. Items that are illegal, hazardous, or prohibited are not permitted.</p>

          <h2 className="text-xl font-semibold mb-4">6. Cancellation Policy</h2>
          <p className="text-gray-600 mb-6">Bookings in PENDING status can be cancelled by either party. Once a booking is CONFIRMED, cancellation policies may apply. Capacity is automatically restored when a booking is cancelled.</p>

          <h2 className="text-xl font-semibold mb-4">7. Limitation of Liability</h2>
          <p className="text-gray-600 mb-6">DockDrop acts as a marketplace facilitator. We are not liable for damages, delays, or losses arising from deliveries arranged through the platform.</p>

          <p className="text-gray-400 text-sm mt-8">Last updated: February 2026</p>
        </div>
      </div>
    </div>
  )
}
