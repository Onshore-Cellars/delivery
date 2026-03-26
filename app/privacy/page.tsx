import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy — Onshore Deliver',
}

export default function PrivacyPage() {
  return (
    <div className="page-container page-container-narrow py-10">
      <p className="text-[11px] font-semibold text-[#FF6A2A] uppercase tracking-[0.15em] mb-1.5">Legal</p>
      <h1 className="text-2xl sm:text-3xl font-semibold text-[#1a1a1a] tracking-[-0.02em] mb-2" style={{ fontFamily: 'var(--font-display)' }}>Privacy Policy</h1>
      <p className="text-xs text-slate-400 mb-8">Last updated: 20 March 2026</p>

      <div className="bg-[#162E3D] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#e8e4de] p-6 sm:p-10 space-y-6 text-sm text-[#4a4a4a] leading-relaxed">
        <section>
          <h2 className="text-base font-semibold text-[#1a1a1a] mb-2 mt-0">1. Who We Are</h2>
          <p>Onshore Deliver is a delivery logistics marketplace operated from France. We are the data controller for personal data collected through this platform. For GDPR purposes, our contact address is <a href="mailto:privacy@onshore.delivery" className="text-[#FF6A2A] hover:underline">privacy@onshore.delivery</a>.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[#1a1a1a] mb-2">2. Data We Collect</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Account data:</strong> Name, email, phone, company name, address.</li>
            <li><strong>Identity documents:</strong> Driving licence, passport, vehicle registration (for carrier verification).</li>
            <li><strong>Booking data:</strong> Cargo details, pickup/delivery addresses, contact information, pricing.</li>
            <li><strong>Location data:</strong> GPS coordinates during live tracking sessions (carriers only, when actively sharing).</li>
            <li><strong>Payment data:</strong> Processed by Stripe — we do not store card numbers.</li>
            <li><strong>Communications:</strong> Messages exchanged through the platform, community posts.</li>
            <li><strong>Usage data:</strong> Pages visited, features used, device information (with consent).</li>
            <li><strong>Vessel data:</strong> MMSI, IMO numbers, yacht details (for yacht owners/crew).</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[#1a1a1a] mb-2">3. Legal Basis for Processing (GDPR)</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Contract performance:</strong> Account management, booking processing, payment handling, delivery tracking.</li>
            <li><strong>Legitimate interest:</strong> Platform security, fraud prevention, service improvement, customer support.</li>
            <li><strong>Legal obligation:</strong> Tax records, regulatory compliance, law enforcement requests.</li>
            <li><strong>Consent:</strong> Marketing emails, analytics cookies, push notifications.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[#1a1a1a] mb-2">4. How We Use Your Data</h2>
          <p>We use your data to: operate the marketplace, process bookings and payments, verify carrier identities, enable real-time delivery tracking, send transactional notifications (email, push), provide customer support, prevent fraud, and improve our services. We do not sell personal data to third parties.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[#1a1a1a] mb-2">5. Data Sharing</h2>
          <p>We share data with:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>Other users:</strong> Carriers see shipper contact details for their bookings and vice versa.</li>
            <li><strong>Stripe:</strong> Payment processing (subject to Stripe&apos;s privacy policy).</li>
            <li><strong>Cloud providers:</strong> Data hosting and storage (EU-based servers where possible).</li>
            <li><strong>Email providers:</strong> Transactional email delivery (e.g., Resend).</li>
            <li><strong>Law enforcement:</strong> When required by law or court order.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[#1a1a1a] mb-2">6. Data Retention</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Account data: Retained while your account is active, deleted within 30 days of account closure.</li>
            <li>Booking records: 7 years (for tax and legal compliance).</li>
            <li>Messages: 2 years after the last message in a conversation.</li>
            <li>Location data: Deleted when a live tracking session ends.</li>
            <li>Identity documents: Retained while the account is active and for 1 year after closure.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[#1a1a1a] mb-2">7. Your Rights (GDPR)</h2>
          <p>Under the GDPR, you have the right to:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>Access:</strong> Request a copy of your personal data.</li>
            <li><strong>Rectification:</strong> Correct inaccurate data via your profile settings.</li>
            <li><strong>Erasure:</strong> Request deletion of your data (&ldquo;right to be forgotten&rdquo;).</li>
            <li><strong>Portability:</strong> Receive your data in a machine-readable format.</li>
            <li><strong>Restriction:</strong> Limit how we process your data.</li>
            <li><strong>Objection:</strong> Object to processing based on legitimate interest.</li>
            <li><strong>Withdraw consent:</strong> For analytics and marketing cookies at any time.</li>
          </ul>
          <p className="mt-2">To exercise these rights, email <a href="mailto:privacy@onshore.delivery" className="text-[#FF6A2A] hover:underline">privacy@onshore.delivery</a>. We will respond within 30 days.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[#1a1a1a] mb-2">8. Cookies</h2>
          <p>We use essential cookies for authentication and security. With your consent, we also use analytics and marketing cookies. You can manage your preferences at any time through the cookie settings link in the footer.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[#1a1a1a] mb-2">9. Security</h2>
          <p>We implement appropriate technical and organisational measures to protect your data, including encryption in transit (TLS), secure password hashing (bcrypt), and role-based access controls. Identity documents are stored securely and access is limited to authorised personnel.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[#1a1a1a] mb-2">10. International Transfers</h2>
          <p>Where data is transferred outside the EEA, we ensure appropriate safeguards are in place (Standard Contractual Clauses or adequacy decisions).</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[#1a1a1a] mb-2">11. Children</h2>
          <p>Our services are not intended for individuals under 18. We do not knowingly collect data from minors.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[#1a1a1a] mb-2">12. Changes to This Policy</h2>
          <p>We may update this policy from time to time. We will notify registered users by email of significant changes. The &ldquo;last updated&rdquo; date at the top reflects the most recent revision.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[#1a1a1a] mb-2">13. Supervisory Authority</h2>
          <p>If you are unsatisfied with our handling of your data, you have the right to lodge a complaint with the CNIL (Commission Nationale de l&apos;Informatique et des Libert&eacute;s), the French data protection authority.</p>
        </section>
      </div>
    </div>
  )
}
