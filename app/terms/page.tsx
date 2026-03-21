import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service — Onshore Deliver',
}

export default function TermsPage() {
  return (
    <div className="page-container page-container-narrow py-10">
      <p className="text-[11px] font-semibold text-[#C6904D] uppercase tracking-[0.15em] mb-1.5">Legal</p>
      <h1 className="text-2xl sm:text-3xl font-semibold text-[#1a1a1a] tracking-[-0.02em] mb-2" style={{ fontFamily: 'var(--font-display)' }}>Terms of Service</h1>
      <p className="text-xs text-slate-400 mb-8">Last updated: 20 March 2026</p>

      <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#e8e4de] p-6 sm:p-10 space-y-6 text-sm text-[#4a4a4a] leading-relaxed">
        <section>
          <h2 className="text-base font-semibold text-[#1a1a1a] mb-2 mt-0">1. About Onshore Deliver</h2>
          <p>Onshore Deliver (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;the Platform&rdquo;) is a marketplace connecting carriers with available transport capacity to shippers who need to send goods to ports, marinas, and yachts. We act as an intermediary — we do not own vehicles, employ drivers, or take physical possession of any cargo.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[#1a1a1a] mb-2">2. User Accounts</h2>
          <p>You must be at least 18 years old to create an account. You are responsible for maintaining the confidentiality of your login credentials and for all activity under your account. Users may register as carriers, shippers, or both. Carriers must provide valid identification and vehicle documentation before accepting bookings.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[#1a1a1a] mb-2">3. Carrier Obligations</h2>
          <p>Carriers must hold valid vehicle insurance, goods-in-transit insurance where applicable, and any required licences for the goods being transported. Carriers are responsible for the safe handling and timely delivery of cargo. All vehicles must be roadworthy and appropriately maintained. Carriers warrant that all information provided (capacity, availability, certifications) is accurate.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[#1a1a1a] mb-2">4. Shipper Obligations</h2>
          <p>Shippers must accurately describe their cargo, including weight, dimensions, and any special handling requirements. Dangerous goods must be declared and accompanied by appropriate documentation. Shippers are responsible for ensuring goods are properly packaged for transport and for providing accurate delivery details including marina access information.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[#1a1a1a] mb-2">5. Bookings & Payments</h2>
          <p>All payments are processed securely through Stripe. Prices are listed in EUR unless otherwise stated. A platform fee is charged on each transaction. Carriers receive payouts after delivery confirmation, subject to a holding period. Refunds are available for cancellations made within the terms of our cancellation policy.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[#1a1a1a] mb-2">6. Cancellation Policy</h2>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>More than 48 hours before departure:</strong> Full refund minus a 5% administrative fee.</li>
            <li><strong>24–48 hours before departure:</strong> 50% refund.</li>
            <li><strong>Less than 24 hours:</strong> No refund, unless the carrier cancels, in which case a full refund is issued.</li>
            <li><strong>Carrier cancellation:</strong> Full refund to shipper. Repeated cancellations may result in account suspension.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[#1a1a1a] mb-2">7. Platform Right to Cancel</h2>
          <p>Onshore Deliver reserves the right, at its sole discretion, to cancel any booking, suspend any listing, or remove any user from the Platform at any time and for any reason, including but not limited to:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Suspected fraudulent, abusive, or unsafe behaviour.</li>
            <li>Breach of these Terms of Service or any applicable law.</li>
            <li>Activity that is harmful to other users, the Platform, or the maritime community we serve.</li>
            <li>Failure to provide accurate information or valid documentation when requested.</li>
            <li>Any conduct that, in our judgement, is detrimental to the integrity or reputation of the Platform.</li>
          </ul>
          <p className="mt-2">Where a booking is cancelled by Onshore Deliver, the shipper will receive a full refund. We are not liable for any consequential losses arising from such cancellation. We will endeavour to provide a reason for cancellation where possible, but are under no obligation to do so.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[#1a1a1a] mb-2">8. Communication &amp; Contact Details</h2>
          <p>All communication between carriers and shippers must be conducted through the Platform&rsquo;s messaging system or via the contact details provided within the booking interface. Users agree that:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Contact details (phone numbers, email addresses) shared through the Platform are for delivery coordination purposes only.</li>
            <li>Users must not use contact details obtained through the Platform to arrange deliveries outside the Platform or to circumvent the Platform&rsquo;s payment system.</li>
            <li>Contact details of counterparties are only shared after a booking is confirmed and payment is processed.</li>
            <li>Attempts to solicit direct business or bypass Platform fees will result in immediate account suspension.</li>
            <li><strong>Platform Fee Liability:</strong> If any user arranges a delivery with a counterparty initially introduced through the Platform without processing the transaction through the Platform (&ldquo;Circumvention&rdquo;), the circumventing user(s) shall remain jointly and severally liable to Onshore Delivery for the full platform fee that would have been payable, plus an administrative charge of 50% of that fee. This applies to any transaction completed within 24 months of the initial introduction through the Platform.</li>
            <li><strong>Monitoring:</strong> We use automated monitoring, including AI-powered content analysis, to detect circumvention attempts in messages, listings, and user activity. Flagged activity is reviewed by our team and may result in account suspension, fee recovery, or legal action.</li>
            <li><strong>Reporting:</strong> Users who become aware of circumvention attempts by other users are encouraged to report them. Confirmed reports may result in a referral credit.</li>
          </ul>
          <p className="mt-2">We anonymise and protect contact details until bookings are confirmed to protect all parties and ensure the marketplace operates fairly for everyone. These measures exist to maintain a fair marketplace for all users.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[#1a1a1a] mb-2">9. Liability</h2>
          <p>Onshore Deliver is a marketplace platform and does not assume liability for loss, damage, or delay of cargo during transit. Carriers are independently responsible for their insurance coverage. We strongly recommend that shippers declare the value of their goods and ensure adequate coverage. Our liability is limited to the platform fees paid for the relevant booking.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[#1a1a1a] mb-2">10. Prohibited Items</h2>
          <p>The following may not be shipped through the Platform: illegal substances, weapons, explosives, live animals, human remains, and any goods prohibited by the laws of the origin or destination country. Dangerous goods (ADR) may only be shipped by carriers with appropriate certifications.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[#1a1a1a] mb-2">11. Proof of Delivery</h2>
          <p>Carriers are required to obtain proof of delivery, which may include a digital signature, photograph, and recipient name. Proof of delivery serves as confirmation that the goods were received and releases the carrier payout. Disputes must be raised within 48 hours of delivery.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[#1a1a1a] mb-2">12. Reviews & Ratings</h2>
          <p>Users may leave honest reviews after completed deliveries. Reviews must be factual and not defamatory. We reserve the right to remove reviews that violate these guidelines. Carriers may respond to reviews publicly.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[#1a1a1a] mb-2">13. Intellectual Property</h2>
          <p>All content, branding, and software on the Platform is owned by Onshore Deliver. Users retain ownership of content they upload but grant us a licence to display it on the Platform.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[#1a1a1a] mb-2">14. Termination</h2>
          <p>We may suspend or terminate accounts that violate these terms, engage in fraudulent activity, or receive persistent poor reviews. Users may delete their accounts at any time; outstanding payments will be settled before account closure.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[#1a1a1a] mb-2">15. Governing Law</h2>
          <p>These terms are governed by the laws of France. Any disputes shall be subject to the exclusive jurisdiction of the courts of Antibes, France.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[#1a1a1a] mb-2">16. Contact</h2>
          <p>For questions about these terms, contact us at <a href="mailto:legal@onshore.delivery" className="text-[#C6904D] hover:underline">legal@onshore.delivery</a>.</p>
        </section>
      </div>
    </div>
  )
}
