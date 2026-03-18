export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-5 sm:px-6 lg:px-8 py-8 sm:py-12">
        <h1 className="text-3xl font-extrabold text-navy-900 tracking-tight mb-2">Privacy Policy</h1>
        <p className="text-sm text-slate-400 mb-8">Last updated: March 2026</p>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8 prose prose-slate max-w-none">
          <h2 className="text-lg font-bold text-navy-900 mt-0">1. Information We Collect</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            We collect information you provide when creating an account (name, email, phone, company), booking or
            listing transport services (addresses, cargo details), and communicating through the Platform (messages,
            reviews). We also collect usage data including IP addresses, browser information, and page views.
          </p>

          <h2 className="text-lg font-bold text-navy-900">2. How We Use Your Information</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            We use your information to: provide and improve our services, process bookings and payments, send
            notifications about your bookings, facilitate communication between carriers and shippers, verify
            accounts and prevent fraud, and comply with legal obligations.
          </p>

          <h2 className="text-lg font-bold text-navy-900">3. Information Sharing</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            We share your information with: other users as necessary to facilitate bookings (e.g., carrier sees
            shipper contact details for delivery), payment processors (Stripe) for payment processing, and
            law enforcement when required by law. We do not sell your personal information to third parties.
          </p>

          <h2 className="text-lg font-bold text-navy-900">4. Data Security</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            We implement industry-standard security measures including encryption of data in transit (HTTPS),
            hashed passwords (bcrypt), and secure payment processing through Stripe. However, no method of
            transmission over the internet is 100% secure.
          </p>

          <h2 className="text-lg font-bold text-navy-900">5. Your Rights</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Under GDPR and applicable privacy laws, you have the right to: access your personal data, correct
            inaccurate data, request deletion of your data, export your data in a portable format, and object
            to processing. Contact us at privacy@yachthop.com to exercise these rights.
          </p>

          <h2 className="text-lg font-bold text-navy-900">6. Cookies</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            We use essential cookies for authentication and session management. We use localStorage to store
            your authentication token. We do not use tracking cookies or third-party analytics cookies.
          </p>

          <h2 className="text-lg font-bold text-navy-900">7. Data Retention</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            We retain your account data for as long as your account is active. Booking and transaction records
            are retained for 7 years for legal and accounting purposes. You can request account deletion at
            any time.
          </p>

          <h2 className="text-lg font-bold text-navy-900">8. Contact</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            For privacy concerns, contact our Data Protection Officer at privacy@yachthop.com.
          </p>
        </div>
      </div>
    </div>
  )
}
