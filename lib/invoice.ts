// ─────────────────────────────────────────────────────────────────────────────
//  Invoicing — single source of truth
//
//  One place builds the invoice/remittance data model from a booking, and one
//  place renders it — either as an on-brand HTML view (for the browser) or a
//  real, downloadable PDF (via pdf-lib, no headless browser required, so it
//  works on the standalone Railway container).
//
//  The document is viewer-aware:
//    • Shipper / admin → INVOICE       (what the shipper paid, broken down)
//    • Carrier         → REMITTANCE    (payout statement: gross − commission)
// ─────────────────────────────────────────────────────────────────────────────
import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb, RGB } from 'pdf-lib'
import prisma from '@/lib/prisma'
import { currencySymbol } from '@/lib/stripe'
import { getTokenFromHeader, verifyToken, verifyInvoiceToken } from '@/lib/auth'
import { platformVatConfig, standardRate } from '@/lib/vat'

// ─── Brand palette (mirrors the --c-* tokens; literals because a PDF/print
//     document can't reference CSS custom properties) ──────────────────────────
export const BRAND = {
  teal:    rgb(0.047, 0.361, 0.329), // #0C5C54 Marine Teal
  tealDeep:rgb(0.035, 0.290, 0.267), // #094A44 Deep Verdigris
  brass:   rgb(0.659, 0.506, 0.235), // #A8813C
  ink:     rgb(0.071, 0.188, 0.173), // #12302C Deep Harbour
  text2:   rgb(0.255, 0.322, 0.306), // #41524E
  muted:   rgb(0.392, 0.463, 0.447), // #647672
  border:  rgb(0.827, 0.847, 0.820), // #D3D8D1
  canvas:  rgb(0.961, 0.949, 0.925), // #F5F2EC Sailcloth
  surface: rgb(0.988, 0.984, 0.973), // #FCFBF8 Sea Salt
  success: rgb(0.145, 0.420, 0.290), // #256B4A
  warn:    rgb(0.541, 0.353, 0.031), // #8A5A08
  error:   rgb(0.698, 0.227, 0.180), // #B23A2E
  white:   rgb(1, 1, 1),
}

type Party = {
  name: string
  company: string | null
  email: string | null
  phone?: string | null
  address: string | null
  city: string | null
  country: string | null
  vatNumber?: string | null
}

export type ChargeLine = { label: string; amount: number; negative?: boolean }

export type InvoiceModel = {
  kind: 'INVOICE' | 'REMITTANCE'
  docTitle: string           // "Invoice" | "Payout Statement"
  number: string
  issueDate: string
  currency: string
  sym: string
  // Header status badge
  statusLabel: string
  statusTone: 'paid' | 'pending' | 'refunded' | 'failed' | 'neutral'
  // Parties
  seller: Party              // always Onshore (platform) as issuer, or carrier for remittance
  billedToLabel: string
  billedTo: Party
  fromLabel: string
  from: Party
  // Shipment
  origin: string
  destination: string
  departure: string
  arrival: string
  vehicle: string
  trackingCode: string
  bookingId: string
  // Cargo
  cargoDescription: string
  cargoType: string
  weightKg: number
  volumeM3: number
  itemCount: number
  specialHandling: string | null
  // Charges
  lines: ChargeLine[]
  netTotal: number             // sum of the charge lines (VAT-exclusive)
  vatLabel: string | null
  vatRate: number
  vatAmount: number
  vatTreatmentNote: string | null   // legal statement (reverse charge / export / etc.)
  totalLabel: string
  total: number                // gross = net + VAT
  feePercent: number
  supplierVatNumber: string | null
  customerVatNumber: string | null
  // Payout (remittance only)
  payoutStatus?: string
  payoutReference?: string | null
  // POD
  delivered: boolean
  deliveredDate: string | null
  podNotes: string | null
  podRecipient: string | null
  podHasSignature: boolean
  podHasPhoto: boolean
}

// Build the seller ("From") party. Prefer the VAT identity SNAPSHOTTED on the
// booking at checkout (`vatSupplierNumber`) over the current env config, so the
// invoice always shows the jurisdiction the VAT was actually charged in — even
// if the admin later changes the platform establishment. Falls back to env for
// legacy bookings with no snapshot.
function onshoreParty(snapshotVatNumber?: string | null): Party {
  const cfg = platformVatConfig()
  const vatNumber = snapshotVatNumber || cfg.vatNumber
  // Derive the supplier country from the snapshotted VAT number prefix (e.g.
  // "FR123…" → FR, "EL…" → EL/Greece), falling back to the configured country.
  const prefix = vatNumber ? vatNumber.trim().slice(0, 2).toUpperCase() : ''
  const country = /^[A-Z]{2}$/.test(prefix) ? prefix : cfg.country
  return {
    name: 'Onshore',
    company: 'Onshore Logistics',
    email: 'billing@onshore.delivery',
    address: null,
    city: null,
    country,
    vatNumber,
  }
}

const money = (n: number) => (Math.round(n * 100) / 100).toFixed(2)
const fmtDate = (d: Date | string | null | undefined) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

// The Prisma booking shape this module needs. Kept as a loose type so callers
// can pass the result of loadInvoiceBooking() directly.
type InvoiceBooking = Awaited<ReturnType<typeof loadInvoiceBooking>>

/** Standardised fetch so every invoice surface reads the same relations. */
export function loadInvoiceBooking(id: string) {
  return prisma.booking.findUnique({
    where: { id },
    include: {
      listing: {
        include: {
          carrier: {
            select: { id: true, name: true, email: true, company: true, phone: true, address: true, city: true, country: true, vatNumber: true },
          },
        },
      },
      shipper: {
        select: { id: true, name: true, email: true, company: true, phone: true, address: true, city: true, country: true, vatNumber: true },
      },
    },
  })
}

/**
 * Assign a stable, unique invoice number the first time a booking is invoiced,
 * and record the issue date. Idempotent: once set it never changes, so the
 * number on the emailed receipt matches the number on the PDF forever.
 * Format: OD-{YYYY}-{8-char booking suffix}, e.g. OD-2026-4F9A2C71.
 */
export async function ensureInvoiceNumber(bookingId: string): Promise<{ invoiceNumber: string; invoiceIssuedAt: Date }> {
  const existing = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { invoiceNumber: true, invoiceIssuedAt: true, paidAt: true, createdAt: true },
  })
  if (existing?.invoiceNumber && existing.invoiceIssuedAt) {
    return { invoiceNumber: existing.invoiceNumber, invoiceIssuedAt: existing.invoiceIssuedAt }
  }
  const issued = existing?.paidAt ?? existing?.createdAt ?? new Date()
  const year = issued.getFullYear()
  const number = `OD-${year}-${bookingId.slice(-8).toUpperCase()}`
  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: { invoiceNumber: number, invoiceIssuedAt: issued },
    select: { invoiceNumber: true, invoiceIssuedAt: true },
  })
  return { invoiceNumber: updated.invoiceNumber!, invoiceIssuedAt: updated.invoiceIssuedAt! }
}

type ViewerRole = 'shipper' | 'carrier' | 'admin'

/**
 * Resolve who may view a booking's invoice and from which viewpoint, from either
 * a normal session token (header or ?token) or a scoped, read-only invoice token
 * (used by emailed links). Returns null if unauthorised.
 *
 * `docParam` lets an admin force a specific view (?doc=invoice|remittance).
 */
export function resolveInvoiceViewer(
  authHeader: string | null,
  urlToken: string | null,
  booking: NonNullable<InvoiceBooking>,
  docParam: string | null,
): ViewerRole | null {
  const raw = getTokenFromHeader(authHeader) || urlToken
  if (!raw) return null

  // 1) Scoped invoice token — read-only, must match this booking.
  const inv = verifyInvoiceToken(raw)
  if (inv && inv.bookingId === booking.id) return inv.as

  // 2) Normal session token — role-based access.
  const user = verifyToken(raw)
  if (!user) return null
  const isCarrier = booking.listing.carrier.id === user.userId
  const isShipper = booking.shipper.id === user.userId
  const isAdmin = user.role === 'ADMIN'
  if (!isCarrier && !isShipper && !isAdmin) return null

  // Carriers see their remittance; shippers see the invoice. Admins default to
  // the invoice but may force either with ?doc=.
  if (isAdmin && docParam === 'remittance') return 'carrier'
  if (isAdmin && docParam === 'invoice') return 'admin'
  if (isCarrier) return 'carrier'
  if (isShipper) return 'shipper'
  return 'admin'
}

/** Build the render-ready model from a booking + who is viewing it. */
export function buildInvoiceModel(booking: NonNullable<InvoiceBooking>, viewer: ViewerRole): InvoiceModel {
  const carrier = booking.listing.carrier
  const shipper = booking.shipper
  const currency = booking.currency || 'EUR'
  const sym = currencySymbol(currency)

  const total = booking.totalPrice
  const fee = booking.platformFee
  const payout = booking.carrierPayout
  const feePercent = total > 0 ? Math.round((fee / total) * 100) : 0

  // A stable number is set at payment; fall back to a derived one for unpaid
  // previews so the document always shows *something* sensible.
  const number = booking.invoiceNumber
    || `OD-${new Date(booking.createdAt).getFullYear()}-${booking.id.slice(-8).toUpperCase()}`
  const issueDate = fmtDate(booking.invoiceIssuedAt || booking.paidAt || booking.createdAt)

  const carrierParty: Party = {
    name: carrier.company || carrier.name, company: carrier.company, email: carrier.email,
    phone: carrier.phone, address: carrier.address, city: carrier.city, country: carrier.country, vatNumber: carrier.vatNumber,
  }
  const shipperParty: Party = {
    name: shipper.company || shipper.name, company: shipper.company, email: shipper.email,
    phone: shipper.phone, address: shipper.address, city: shipper.city, country: shipper.country, vatNumber: shipper.vatNumber,
  }
  const platform = onshoreParty(booking.vatSupplierNumber)

  // VAT snapshot captured at checkout (0 for reverse-charge / export / unpaid).
  const vatAmount = booking.vatAmount || 0
  const vatRate = booking.vatRate || 0
  const grossTotal = Math.round((total + vatAmount) * 100) / 100

  const payTone = (): InvoiceModel['statusTone'] =>
    booking.paymentStatus === 'PAID' ? 'paid'
      : booking.paymentStatus === 'REFUNDED' ? 'refunded'
      : booking.paymentStatus === 'FAILED' ? 'failed' : 'pending'

  const shipment = {
    origin: booking.listing.originPort,
    destination: booking.listing.destinationPort,
    departure: fmtDate(booking.listing.departureDate),
    arrival: fmtDate(booking.listing.estimatedArrival),
    vehicle: booking.listing.vehicleType + (booking.listing.vehicleName ? ` — ${booking.listing.vehicleName}` : ''),
    trackingCode: booking.trackingCode || 'N/A',
    bookingId: booking.id,
    cargoDescription: booking.cargoDescription,
    cargoType: booking.cargoType || 'General cargo',
    weightKg: booking.weightKg,
    volumeM3: booking.volumeM3,
    itemCount: booking.itemCount,
    specialHandling: booking.specialHandling,
    delivered: booking.status === 'DELIVERED',
    deliveredDate: booking.actualDelivery ? fmtDate(booking.actualDelivery) : null,
    podNotes: booking.podNotes,
    podRecipient: booking.podRecipientName,
    podHasSignature: !!booking.podSignature,
    podHasPhoto: !!booking.podPhotoUrl,
  }

  if (viewer === 'carrier') {
    // Payout statement — the carrier's remittance advice.
    const transferred = !!booking.payoutTransferredAt
    return {
      kind: 'REMITTANCE',
      docTitle: 'Payout Statement',
      number: number.replace('OD-', 'OD-PS-'),
      issueDate,
      currency, sym,
      statusLabel: transferred ? 'Paid out' : booking.status === 'DELIVERED' ? 'Releasing' : 'Scheduled',
      statusTone: transferred ? 'paid' : 'pending',
      seller: platform,
      fromLabel: 'Issued by',
      from: platform,
      billedToLabel: 'Payable to',
      billedTo: carrierParty,
      ...shipment,
      lines: [
        { label: 'Gross booking value', amount: total },
        { label: `Onshore commission (${feePercent}%)`, amount: fee, negative: true },
      ],
      netTotal: payout,
      vatLabel: null,
      vatRate: 0,
      vatAmount: 0,
      // The carrier's own VAT on their supply to Onshore is a matter between the
      // carrier and Onshore; the payout figure itself is VAT-exclusive here.
      vatTreatmentNote: carrierParty.vatNumber
        ? 'Your VAT on this supply, if any, should be invoiced to Onshore separately.'
        : null,
      totalLabel: 'Net payout',
      total: payout,
      feePercent,
      supplierVatNumber: platform.vatNumber ?? null,
      customerVatNumber: carrierParty.vatNumber ?? null,
      payoutStatus: transferred
        ? `Transferred ${fmtDate(booking.payoutTransferredAt)}`
        : booking.status === 'DELIVERED' ? 'Releasing to your Stripe account' : 'Held in escrow until delivery is confirmed',
      payoutReference: booking.stripeTransferId,
    }
  }

  // Shipper / admin → tax-style invoice of what was paid.
  return {
    kind: 'INVOICE',
    docTitle: 'Invoice',
    number,
    issueDate,
    currency, sym,
    statusLabel: booking.paymentStatus === 'PAID' ? 'Paid'
      : booking.paymentStatus === 'REFUNDED' ? 'Refunded'
      : booking.paymentStatus === 'FAILED' ? 'Failed' : 'Payment pending',
    statusTone: payTone(),
    seller: platform,
    fromLabel: 'From',
    from: platform,
    billedToLabel: 'Billed to',
    billedTo: shipperParty,
    ...shipment,
    lines: [
      { label: `Transport & logistics service — ${carrierParty.name}`, amount: payout },
      { label: `Onshore platform fee (${feePercent}%)`, amount: fee },
    ],
    netTotal: total,
    vatLabel: vatRate > 0 ? `VAT (${vatRate}%)` : 'VAT',
    vatRate,
    vatAmount,
    // Legal statement from the captured snapshot (reverse charge / export / etc.).
    // Fall back to a sensible default for legacy bookings without a snapshot.
    vatTreatmentNote: booking.vatNote
      || (vatAmount > 0 ? null : 'VAT not charged at source — cross-border reverse charge may apply.'),
    totalLabel: 'Total paid',
    total: grossTotal,
    feePercent,
    supplierVatNumber: platform.vatNumber ?? null,
    customerVatNumber: shipperParty.vatNumber ?? null,
  }
}

// ─── HTML view ────────────────────────────────────────────────────────────────

function esc(s: unknown): string {
  return String(s ?? '').replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string
  ))
}

const toneCss: Record<InvoiceModel['statusTone'], string> = {
  paid:     'background:#DCF0E4;color:#256B4A;',
  pending:  'background:#F5EAD2;color:#8A5A08;',
  refunded: 'background:#F3E0DC;color:#B23A2E;',
  failed:   'background:#F3E0DC;color:#B23A2E;',
  neutral:  'background:#E7E9E3;color:#41524E;',
}

function partyBlock(label: string, p: Party): string {
  return `
    <div class="party">
      <div class="party-label">${esc(label)}</div>
      <div class="party-name">${esc(p.name)}</div>
      ${p.company && p.company !== p.name ? `<p>${esc(p.company)}</p>` : ''}
      ${p.address ? `<p>${esc(p.address)}</p>` : ''}
      ${p.city || p.country ? `<p>${esc([p.city, p.country].filter(Boolean).join(', '))}</p>` : ''}
      ${p.email ? `<p>${esc(p.email)}</p>` : ''}
      ${p.phone ? `<p>${esc(p.phone)}</p>` : ''}
      ${p.vatNumber ? `<p style="margin-top:3px;">VAT: ${esc(p.vatNumber)}</p>` : ''}
    </div>`
}

/** On-brand, print-friendly HTML view with a link to the real PDF. */
export function renderInvoiceHtml(m: InvoiceModel): string {
  const lineRows = m.lines.map(l => `
    <div class="charge-row">
      <span>${esc(l.label)}</span>
      <span>${l.negative ? '−' : ''}${esc(m.sym)}${money(l.amount)}</span>
    </div>`).join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(m.docTitle)} ${esc(m.number)} · Onshore</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; color:#12302C; background:#F5F2EC; line-height:1.55; padding:24px; }
    .doc { max-width:820px; margin:0 auto; background:#FCFBF8; border:1px solid #D3D8D1; border-radius:14px; overflow:hidden; }
    .head { background:#0C5C54; color:#FCFBF8; padding:36px 40px; display:flex; justify-content:space-between; align-items:flex-start; gap:24px; }
    .brand { display:flex; align-items:center; gap:10px; }
    .brand .dot { width:11px; height:11px; border-radius:50%; background:#A8813C; }
    .brand .name { font-size:22px; font-weight:700; letter-spacing:.3px; }
    .brand .tag { font-size:11px; color:#CFE0DC; letter-spacing:.14em; text-transform:uppercase; margin-top:2px; }
    .doc-meta { text-align:right; }
    .doc-meta h1 { font-size:26px; font-weight:300; letter-spacing:.12em; text-transform:uppercase; color:#FCFBF8; }
    .doc-meta p { font-size:12px; color:#CFE0DC; margin-top:3px; }
    .badge { display:inline-block; padding:4px 12px; border-radius:999px; font-size:11px; font-weight:700; margin-top:8px; }
    .body { padding:32px 40px; }
    .parties { display:flex; gap:36px; margin-bottom:28px; }
    .party { flex:1; }
    .party-label { font-size:10px; text-transform:uppercase; letter-spacing:.14em; color:#A8813C; font-weight:700; margin-bottom:6px; }
    .party-name { font-size:15px; font-weight:600; color:#12302C; }
    .party p { font-size:12.5px; color:#647672; }
    .section-title { font-size:10px; text-transform:uppercase; letter-spacing:.14em; color:#0C5C54; font-weight:700; border-bottom:2px solid #D3D8D1; padding-bottom:6px; margin:26px 0 14px; }
    .route { display:flex; align-items:center; justify-content:space-between; background:#F5F2EC; border:1px solid #D3D8D1; border-radius:10px; padding:18px 22px; }
    .route .port { text-align:center; flex:1; }
    .route .port .lbl { font-size:10px; text-transform:uppercase; letter-spacing:.1em; color:#647672; }
    .route .port .val { font-size:15px; font-weight:700; color:#12302C; margin-top:2px; }
    .route .port .dt { font-size:12px; color:#647672; }
    .route .arrow { color:#A8813C; font-size:22px; padding:0 16px; }
    .grid { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; }
    .cell { background:#F5F2EC; border-radius:8px; padding:12px 14px; }
    .cell .lbl { font-size:10px; text-transform:uppercase; letter-spacing:.1em; color:#647672; }
    .cell .val { font-size:13.5px; font-weight:600; color:#12302C; margin-top:3px; }
    .charges { margin-left:auto; width:340px; margin-top:8px; }
    .charge-row { display:flex; justify-content:space-between; padding:9px 0; font-size:13.5px; color:#41524E; border-bottom:1px solid #EBE9E2; }
    .charge-row.total { border-top:2px solid #0C5C54; border-bottom:none; margin-top:6px; padding-top:13px; font-size:18px; font-weight:700; color:#0C5C54; }
    .note { font-size:11.5px; color:#647672; margin-top:10px; }
    .pod { background:#F5F2EC; border:1px solid #D3D8D1; border-radius:10px; padding:16px 18px; margin-top:8px; }
    .pod .k { color:#256B4A; font-weight:600; }
    .foot { border-top:1px solid #D3D8D1; padding:22px 40px; text-align:center; color:#647672; font-size:11.5px; }
    .foot b { color:#0C5C54; }
    .toolbar { max-width:820px; margin:0 auto 14px; display:flex; justify-content:flex-end; gap:10px; }
    .btn { padding:10px 22px; border-radius:9px; font-weight:600; font-size:13px; text-decoration:none; border:none; cursor:pointer; }
    .btn-primary { background:#0C5C54; color:#FCFBF8; }
    .btn-ghost { background:#FCFBF8; color:#0C5C54; border:1px solid #D3D8D1; }
    @media print { body { background:#fff; padding:0; } .doc { border:none; border-radius:0; } .toolbar { display:none; }
      .head, .route, .cell, .pod { -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
  </style>
</head>
<body>
  <div class="toolbar">
    <a class="btn btn-ghost" href="./pdf" >Download PDF</a>
    <button class="btn btn-primary" onclick="window.print()">Print</button>
  </div>
  <div class="doc">
    <div class="head">
      <div class="brand-wrap">
        <div class="brand"><span class="dot"></span><span class="name">Onshore</span></div>
        <div class="tag">Yacht Logistics</div>
      </div>
      <div class="doc-meta">
        <h1>${esc(m.docTitle)}</h1>
        <p><strong>${esc(m.number)}</strong></p>
        <p>Issued ${esc(m.issueDate)}</p>
        <span class="badge" style="${toneCss[m.statusTone]}">${esc(m.statusLabel)}</span>
      </div>
    </div>
    <div class="body">
      <div class="parties">
        ${partyBlock(m.fromLabel, m.from)}
        ${partyBlock(m.billedToLabel, m.billedTo)}
      </div>

      <div class="section-title">Route</div>
      <div class="route">
        <div class="port"><div class="lbl">Origin</div><div class="val">${esc(m.origin)}</div><div class="dt">${esc(m.departure)}</div></div>
        <div class="arrow">&#10132;</div>
        <div class="port"><div class="lbl">Destination</div><div class="val">${esc(m.destination)}</div><div class="dt">${esc(m.arrival)}</div></div>
      </div>

      <div class="section-title">Shipment</div>
      <div class="grid">
        <div class="cell"><div class="lbl">Cargo</div><div class="val">${esc(m.cargoDescription)}</div></div>
        <div class="cell"><div class="lbl">Type</div><div class="val">${esc(m.cargoType)}</div></div>
        <div class="cell"><div class="lbl">Weight</div><div class="val">${esc(m.weightKg)} kg</div></div>
        <div class="cell"><div class="lbl">Volume</div><div class="val">${esc(m.volumeM3)} m³</div></div>
        <div class="cell"><div class="lbl">Vehicle</div><div class="val">${esc(m.vehicle)}</div></div>
        <div class="cell"><div class="lbl">Items</div><div class="val">${esc(m.itemCount)}</div></div>
        <div class="cell"><div class="lbl">Tracking</div><div class="val">${esc(m.trackingCode)}</div></div>
        <div class="cell"><div class="lbl">Booking</div><div class="val">${esc(m.bookingId.slice(-8).toUpperCase())}</div></div>
      </div>
      ${m.specialHandling ? `<p class="note"><strong>Special handling:</strong> ${esc(m.specialHandling)}</p>` : ''}

      <div class="section-title">${m.kind === 'REMITTANCE' ? 'Payout breakdown' : 'Charge breakdown'}</div>
      <div class="charges">
        ${lineRows}
        ${m.kind === 'INVOICE' ? `
        <div class="charge-row"><span>Subtotal (net)</span><span>${esc(m.sym)}${money(m.netTotal)}</span></div>
        <div class="charge-row"><span>${esc(m.vatLabel)}</span><span>${m.vatAmount > 0 ? `${esc(m.sym)}${money(m.vatAmount)}` : `${esc(m.sym)}0.00`}</span></div>` : ''}
        <div class="charge-row total"><span>${esc(m.totalLabel)} (${esc(m.currency)})</span><span>${esc(m.sym)}${money(m.total)}</span></div>
      </div>
      ${m.vatTreatmentNote ? `<p class="note"><strong>VAT:</strong> ${esc(m.vatTreatmentNote)}</p>` : ''}
      ${m.kind === 'REMITTANCE' ? `<p class="note"><strong>Payout status:</strong> ${esc(m.payoutStatus)}${m.payoutReference ? ` · ref ${esc(m.payoutReference)}` : ''}</p>` : ''}

      ${m.delivered ? `
      <div class="section-title">Proof of Delivery</div>
      <div class="pod">
        <p>Delivered ${esc(m.deliveredDate || '—')}${m.podRecipient ? ` · received by ${esc(m.podRecipient)}` : ''}</p>
        ${m.podNotes ? `<p style="margin-top:4px;">${esc(m.podNotes)}</p>` : ''}
        ${m.podHasSignature ? `<p style="margin-top:4px;" class="k">✓ Signature captured</p>` : ''}
        ${m.podHasPhoto ? `<p style="margin-top:4px;" class="k">✓ Photo on file</p>` : ''}
      </div>` : ''}
    </div>
    <div class="foot">
      <p><b>Onshore</b> — Yacht Logistics Marketplace</p>
      <p style="margin-top:5px;">Automatically generated ${m.kind === 'REMITTANCE' ? 'payout statement' : 'invoice'}. Queries: billing@onshore.delivery</p>
    </div>
  </div>
</body>
</html>`
}

// ─── PDF rendering (pdf-lib, browserless) ─────────────────────────────────────

const A4 = { w: 595.28, h: 841.89 }
const MARGIN = 44

type Ctx = { page: PDFPage; reg: PDFFont; bold: PDFFont; y: number }

function text(ctx: Ctx, s: string, x: number, size: number, color: RGB, bold = false) {
  ctx.page.drawText(sanitizePdf(s), { x, y: ctx.y, size, font: bold ? ctx.bold : ctx.reg, color })
}
function textAt(ctx: Ctx, s: string, x: number, y: number, size: number, color: RGB, bold = false) {
  ctx.page.drawText(sanitizePdf(s), { x, y, size, font: bold ? ctx.bold : ctx.reg, color })
}
function rightText(ctx: Ctx, s: string, rightX: number, y: number, size: number, color: RGB, bold = false) {
  const font = bold ? ctx.bold : ctx.reg
  const clean = sanitizePdf(s)
  const w = font.widthOfTextAtSize(clean, size)
  ctx.page.drawText(clean, { x: rightX - w, y, size, font, color })
}
// pdf-lib's StandardFonts (WinAnsi) can't encode some glyphs (→, −, m³, £, €…).
// Swap them for safe equivalents so a stray character never throws mid-render.
function sanitizePdf(s: string): string {
  return String(s ?? '')
    .replace(/→|➜|➔|&#10132;/g, '->')
    .replace(/−/g, '-')
    .replace(/³/g, '3')
    .replace(/·/g, '-')
    .replace(/€/g, 'EUR ')
    .replace(/£/g, 'GBP ')
    .replace(/[^\x20-\x7E]/g, '') // drop anything else non-latin1-printable
}

/** Render the model to a real PDF and return the bytes. */
export async function renderInvoicePdf(m: InvoiceModel): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  doc.setTitle(`${m.docTitle} ${m.number}`)
  doc.setAuthor('Onshore')
  doc.setSubject(`${m.docTitle} for booking ${m.bookingId}`)
  const page = doc.addPage([A4.w, A4.h])
  const reg = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const ctx: Ctx = { page, reg, bold, y: A4.h }
  const right = A4.w - MARGIN
  const symTxt = (m.currency === 'EUR' ? 'EUR ' : m.currency === 'GBP' ? 'GBP ' : m.currency === 'USD' ? '$' : m.currency + ' ')
  const mny = (n: number) => `${symTxt}${money(n)}`

  // Header band
  const headH = 108
  page.drawRectangle({ x: 0, y: A4.h - headH, width: A4.w, height: headH, color: BRAND.teal })
  // Brand mark: brass dot + wordmark
  page.drawCircle({ x: MARGIN + 6, y: A4.h - 40, size: 5.5, color: BRAND.brass })
  textAt(ctx, 'Onshore', MARGIN + 18, A4.h - 45, 21, BRAND.white, true)
  textAt(ctx, 'YACHT LOGISTICS', MARGIN + 18, A4.h - 62, 8, rgb(0.81, 0.88, 0.86))
  // Doc meta (right)
  rightText(ctx, m.docTitle.toUpperCase(), right, A4.h - 42, 22, BRAND.white, true)
  rightText(ctx, m.number, right, A4.h - 60, 10, rgb(0.81, 0.88, 0.86), true)
  rightText(ctx, `Issued ${m.issueDate}`, right, A4.h - 74, 9, rgb(0.81, 0.88, 0.86))
  // Status pill
  const pillTxt = m.statusLabel
  const pillW = reg.widthOfTextAtSize(pillTxt, 9) + 18
  const pillColor = m.statusTone === 'paid' ? BRAND.success : m.statusTone === 'pending' ? BRAND.brass : BRAND.error
  page.drawRectangle({ x: right - pillW, y: A4.h - 96, width: pillW, height: 16, color: BRAND.white, opacity: 0.95 })
  rightText(ctx, pillTxt, right - 9, A4.h - 92, 9, pillColor, true)

  ctx.y = A4.h - headH - 34

  // Parties (two columns)
  const colGap = 30
  const colW = (A4.w - MARGIN * 2 - colGap) / 2
  const drawParty = (label: string, p: Party, x: number) => {
    let yy = ctx.y
    textAt(ctx, label.toUpperCase(), x, yy, 8.5, BRAND.brass, true); yy -= 15
    textAt(ctx, p.name, x, yy, 12.5, BRAND.ink, true); yy -= 14
    const lines = [
      p.company && p.company !== p.name ? p.company : null,
      p.address, [p.city, p.country].filter(Boolean).join(', ') || null, p.email, p.phone,
      p.vatNumber ? `VAT: ${p.vatNumber}` : null,
    ].filter(Boolean) as string[]
    for (const ln of lines) { textAt(ctx, ln, x, yy, 9.5, BRAND.muted); yy -= 12 }
    return yy
  }
  const leftEnd = drawParty(m.fromLabel, m.from, MARGIN)
  const rightEnd = drawParty(m.billedToLabel, m.billedTo, MARGIN + colW + colGap)
  ctx.y = Math.min(leftEnd, rightEnd) - 14

  const sectionTitle = (t: string) => {
    textAt(ctx, t.toUpperCase(), MARGIN, ctx.y, 8.5, BRAND.teal, true)
    ctx.y -= 6
    page.drawLine({ start: { x: MARGIN, y: ctx.y }, end: { x: right, y: ctx.y }, thickness: 1.4, color: BRAND.border })
    ctx.y -= 16
  }

  // Route
  sectionTitle('Route')
  const routeH = 52
  page.drawRectangle({ x: MARGIN, y: ctx.y - routeH + 14, width: A4.w - MARGIN * 2, height: routeH, color: BRAND.canvas, borderColor: BRAND.border, borderWidth: 1 })
  const midY = ctx.y - routeH + 14 + routeH / 2
  textAt(ctx, 'ORIGIN', MARGIN + 16, midY + 6, 8, BRAND.muted)
  textAt(ctx, m.origin, MARGIN + 16, midY - 8, 12, BRAND.ink, true)
  textAt(ctx, m.departure, MARGIN + 16, midY - 20, 8.5, BRAND.muted)
  textAt(ctx, '->', A4.w / 2 - 6, midY - 4, 16, BRAND.brass, true)
  rightText(ctx, 'DESTINATION', right - 16, midY + 6, 8, BRAND.muted)
  rightText(ctx, m.destination, right - 16, midY - 8, 12, BRAND.ink, true)
  rightText(ctx, m.arrival, right - 16, midY - 20, 8.5, BRAND.muted)
  ctx.y -= routeH + 20

  // Shipment grid (4 cols x 2 rows)
  sectionTitle('Shipment')
  const cells: [string, string][] = [
    ['Cargo', m.cargoDescription], ['Type', m.cargoType], ['Weight', `${m.weightKg} kg`], ['Volume', `${m.volumeM3} m3`],
    ['Vehicle', m.vehicle], ['Items', String(m.itemCount)], ['Tracking', m.trackingCode], ['Booking', m.bookingId.slice(-8).toUpperCase()],
  ]
  const gridCols = 4
  const cellW = (A4.w - MARGIN * 2 - (gridCols - 1) * 8) / gridCols
  const cellH = 36
  cells.forEach((c, i) => {
    const col = i % gridCols
    const row = Math.floor(i / gridCols)
    const cx = MARGIN + col * (cellW + 8)
    const cy = ctx.y - row * (cellH + 8)
    page.drawRectangle({ x: cx, y: cy - cellH + 12, width: cellW, height: cellH, color: BRAND.canvas })
    textAt(ctx, c[0].toUpperCase(), cx + 8, cy - 2, 7.5, BRAND.muted)
    // truncate long values to fit the cell
    let val = c[1]
    while (reg.widthOfTextAtSize(sanitizePdf(val), 9.5) > cellW - 16 && val.length > 4) val = val.slice(0, -2)
    if (val !== c[1]) val = val.trimEnd() + '…'.replace('…', '..')
    textAt(ctx, val, cx + 8, cy - 15, 9.5, BRAND.ink, true)
  })
  ctx.y -= cellH + 8 + cellH + 22

  if (m.specialHandling) {
    textAt(ctx, `Special handling: ${m.specialHandling}`, MARGIN, ctx.y, 9, BRAND.text2)
    ctx.y -= 18
  }

  // Charges
  sectionTitle(m.kind === 'REMITTANCE' ? 'Payout breakdown' : 'Charge breakdown')
  const chargeX = A4.w - MARGIN - 300
  for (const l of m.lines) {
    textAt(ctx, l.label, chargeX, ctx.y, 10.5, BRAND.text2)
    rightText(ctx, `${l.negative ? '-' : ''}${mny(l.amount)}`, right, ctx.y, 10.5, BRAND.text2)
    ctx.y -= 8
    page.drawLine({ start: { x: chargeX, y: ctx.y }, end: { x: right, y: ctx.y }, thickness: 0.6, color: rgb(0.92, 0.91, 0.88) })
    ctx.y -= 14
  }
  // Invoice: show subtotal (net) and the VAT line explicitly (even at 0%).
  if (m.kind === 'INVOICE') {
    textAt(ctx, 'Subtotal (net)', chargeX, ctx.y, 10.5, BRAND.text2)
    rightText(ctx, mny(m.netTotal), right, ctx.y, 10.5, BRAND.text2)
    ctx.y -= 8
    page.drawLine({ start: { x: chargeX, y: ctx.y }, end: { x: right, y: ctx.y }, thickness: 0.6, color: rgb(0.92, 0.91, 0.88) })
    ctx.y -= 14
    textAt(ctx, m.vatLabel || 'VAT', chargeX, ctx.y, 10.5, BRAND.text2)
    rightText(ctx, mny(m.vatAmount), right, ctx.y, 10.5, BRAND.text2)
    ctx.y -= 22
  }
  // Total rule + total
  page.drawLine({ start: { x: chargeX, y: ctx.y + 4 }, end: { x: right, y: ctx.y + 4 }, thickness: 1.6, color: BRAND.teal })
  ctx.y -= 8
  textAt(ctx, `${m.totalLabel} (${m.currency})`, chargeX, ctx.y, 14, BRAND.teal, true)
  rightText(ctx, mny(m.total), right, ctx.y, 14, BRAND.teal, true)
  ctx.y -= 22

  // VAT treatment / legal statement (reverse charge, export, etc.)
  if (m.vatTreatmentNote) {
    const words = `VAT: ${m.vatTreatmentNote}`.split(' ')
    let line = ''
    for (const w of words) {
      const test = line ? `${line} ${w}` : w
      if (reg.widthOfTextAtSize(sanitizePdf(test), 8.5) > A4.w - MARGIN * 2) {
        textAt(ctx, line, MARGIN, ctx.y, 8.5, BRAND.muted); ctx.y -= 12; line = w
      } else line = test
    }
    if (line) { textAt(ctx, line, MARGIN, ctx.y, 8.5, BRAND.muted); ctx.y -= 14 }
  }
  if (m.kind === 'REMITTANCE') {
    textAt(ctx, `Payout status: ${m.payoutStatus || ''}`, MARGIN, ctx.y, 9, BRAND.text2, true); ctx.y -= 13
    if (m.payoutReference) { textAt(ctx, `Transfer ref: ${m.payoutReference}`, MARGIN, ctx.y, 8.5, BRAND.muted); ctx.y -= 14 }
  }

  // POD
  if (m.delivered) {
    ctx.y -= 6
    sectionTitle('Proof of Delivery')
    const podLines = [
      `Delivered ${m.deliveredDate || '-'}${m.podRecipient ? ` - received by ${m.podRecipient}` : ''}`,
      m.podNotes || '',
      [m.podHasSignature ? 'Signature captured' : '', m.podHasPhoto ? 'Photo on file' : ''].filter(Boolean).join('  -  '),
    ].filter(Boolean)
    for (const ln of podLines) { textAt(ctx, ln, MARGIN, ctx.y, 9.5, BRAND.text2); ctx.y -= 13 }
  }

  // Footer
  page.drawLine({ start: { x: MARGIN, y: 58 }, end: { x: right, y: 58 }, thickness: 1, color: BRAND.border })
  textAt(ctx, 'Onshore — Yacht Logistics Marketplace', MARGIN, 44, 9, BRAND.teal, true)
  textAt(ctx, `Automatically generated ${m.kind === 'REMITTANCE' ? 'payout statement' : 'invoice'}. Queries: billing@onshore.delivery`, MARGIN, 32, 8, BRAND.muted)

  return doc.save()
}
