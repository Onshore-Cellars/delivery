export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100/50">
      <div className="max-w-3xl mx-auto px-5 sm:px-6 lg:px-8 py-10 sm:py-14">
        <p className="text-[11px] font-semibold text-gold-600 uppercase tracking-[0.15em] mb-1.5">Legal</p>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-[-0.02em] mb-2">Terms of Service</h1>
        <p className="text-sm text-slate-400 mb-8">Last updated: March 2026</p>

        <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-slate-100/80 p-6 sm:p-10 prose prose-slate max-w-none">
          <h2 className="text-lg font-bold text-navy-900 mt-0">1. Acceptance of Terms</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            By accessing or using YachtHop (&quot;the Platform&quot;), you agree to be bound by these Terms of Service.
            If you do not agree, do not use the Platform. YachtHop reserves the right to modify these terms at any time.
          </p>

          <h2 className="text-lg font-bold text-navy-900">2. User Accounts</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            You must create an account to use certain features. You are responsible for maintaining the confidentiality
            of your account credentials and for all activity under your account. You must provide accurate and complete
            information during registration.
          </p>

          <h2 className="text-lg font-bold text-navy-900">3. Marketplace Services</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            YachtHop is a marketplace that connects carriers with available transport capacity to shippers who require
            delivery services. YachtHop does not itself provide transport services. All transport agreements are between
            the carrier and shipper directly. YachtHop facilitates the connection and provides payment processing.
          </p>

          <h2 className="text-lg font-bold text-navy-900">4. Carrier Responsibilities</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Carriers must maintain appropriate insurance, licenses, and permits for their transport operations.
            Carriers are responsible for the safe transport and timely delivery of goods. Carriers must accurately
            represent available capacity, pricing, and vehicle capabilities.
          </p>

          <h2 className="text-lg font-bold text-navy-900">5. Shipper Responsibilities</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Shippers must accurately describe cargo including weight, volume, and any special handling requirements.
            Shippers must not ship prohibited, dangerous, or illegal items. Shippers must ensure cargo is properly
            packed and labelled.
          </p>

          <h2 className="text-lg font-bold text-navy-900">6. Payments & Fees</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            All payments are processed through Stripe. YachtHop charges a platform fee of 10% on each transaction.
            Carriers receive payment minus the platform fee. Refunds are subject to our cancellation policy.
          </p>

          <h2 className="text-lg font-bold text-navy-900">7. Cancellations & Refunds</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Cancellations made more than 48 hours before departure are eligible for a full refund. Cancellations
            within 48 hours may incur a cancellation fee. Carriers who cancel confirmed bookings may face account
            restrictions.
          </p>

          <h2 className="text-lg font-bold text-navy-900">8. Limitation of Liability</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            YachtHop is not liable for any damages, losses, or delays arising from transport services arranged through
            the Platform. Our liability is limited to the platform fees paid. Carriers maintain their own insurance
            for cargo in transit.
          </p>

          <h2 className="text-lg font-bold text-navy-900">9. Intellectual Property</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            All content, branding, and software on the Platform are owned by YachtHop or its licensors. Users may
            not copy, modify, or distribute Platform content without permission.
          </p>

          <h2 className="text-lg font-bold text-navy-900">10. Contact</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            For questions about these Terms, contact us at legal@yachthop.com.
          </p>
        </div>
      </div>
    </div>
  )
}
