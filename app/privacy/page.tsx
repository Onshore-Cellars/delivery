import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/" className="text-blue-600 hover:text-blue-800 text-sm font-medium">← Back to Home</Link>
        <h1 className="text-3xl font-bold text-gray-900 mt-4 mb-8">Privacy Policy</h1>

        <div className="bg-white rounded-lg shadow p-8 prose prose-gray max-w-none">
          <h2 className="text-xl font-semibold mb-4">1. Information We Collect</h2>
          <p className="text-gray-600 mb-6">We collect information you provide when registering (name, email, phone, company) and information generated through your use of the platform (listings, bookings, reviews).</p>

          <h2 className="text-xl font-semibold mb-4">2. How We Use Your Information</h2>
          <p className="text-gray-600 mb-6">Your information is used to provide the marketplace service, facilitate connections between carriers and customers, process bookings, and improve our platform.</p>

          <h2 className="text-xl font-semibold mb-4">3. Information Sharing</h2>
          <p className="text-gray-600 mb-6">When a booking is made, relevant contact information is shared between the carrier and customer to facilitate the delivery. We do not sell your personal data to third parties.</p>

          <h2 className="text-xl font-semibold mb-4">4. Data Security</h2>
          <p className="text-gray-600 mb-6">We use industry-standard security measures including password hashing and JWT authentication to protect your account. However, no system is completely secure.</p>

          <h2 className="text-xl font-semibold mb-4">5. Your Rights</h2>
          <p className="text-gray-600 mb-6">You can view and update your profile information at any time. You can request account deletion by contacting us. You have the right to access, correct, or delete your personal data.</p>

          <h2 className="text-xl font-semibold mb-4">6. Cookies</h2>
          <p className="text-gray-600 mb-6">We use localStorage to maintain your authentication session. No third-party tracking cookies are used.</p>

          <p className="text-gray-400 text-sm mt-8">Last updated: February 2026</p>
        </div>
      </div>
    </div>
  )
}
