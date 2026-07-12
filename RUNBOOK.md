# Onshore — Operations Runbook

Everything needed to configure, deploy, operate and verify the Onshore yacht-logistics
marketplace. Pair this with `.env.example` (the canonical list of variables).

- **Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Prisma 6 · PostgreSQL · Stripe (Connect) · Tailwind v4
- **Deploy:** Railway (Dockerfile → `prisma migrate`/`db push` on start → `node server.js`)
- **Tests:** `npx vitest run` · **Build:** `npx next build` · **CI:** `.github/workflows/ci.yml`

---

## 1. Environment variables

### Required (app will not function correctly without these)
| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (pooled). |
| `DIRECT_URL` | Direct Postgres URL for Prisma migrations. |
| `NEXTAUTH_SECRET` | Signs JWT auth tokens. **Must be set in production** (a random per-process secret is used otherwise, invalidating sessions on restart). Generate: `openssl rand -base64 32`. |
| `NEXTAUTH_URL` | Public app origin, e.g. `https://onshore.up.railway.app`. Used in emails and Stripe redirect URLs. |
| `STRIPE_SECRET_KEY` | Stripe API key (`sk_live_…`). |
| `STRIPE_WEBHOOK_SECRET` | Verifies Stripe webhooks (`whsec_…`). Set to the signing secret of the `/api/webhooks/stripe` endpoint. |

### VAT / tax (see §3.2)
| Variable | Default | Purpose |
|---|---|---|
| `PLATFORM_VAT_COUNTRY` | `GB` | VAT country where Onshore is established (EU code or `GB`). Sets domestic-rate country and cross-border resolution. |
| `PLATFORM_VAT_NUMBER` | — | Onshore's VAT number, printed on invoices. Required for a valid VAT invoice once charging VAT. |
| `PLATFORM_VAT_REGISTERED` | `true` | Set `false` if not yet VAT-registered (no VAT charged). |

### Email (set ONE path — see §3.5)
| Variable | Purpose |
|---|---|
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | SMTP delivery (port 465 ⇒ SSL). |
| `RESEND_API_KEY` | Alternative: Resend HTTPS API (no SMTP ports; preferred if the host blocks SMTP). |
| `EMAIL_FROM` | From address; **must match the SMTP account / a verified Resend domain** so SPF passes. Defaults to `info@onshoredelivery.com`. |

### Scheduler (see §3.6)
| Variable | Purpose |
|---|---|
| `CRON_SECRET` | Shared secret for the cron endpoints. Set the SAME value in Railway and in the GitHub Actions secret. |

### Optional / feature-specific
| Variable | Purpose |
|---|---|
| `ANTHROPIC_API_KEY` | AI features (CRM enrichment/discovery, campaign copy, consolidation insights). |
| `STORAGE_ENDPOINT` / `_REGION` / `_BUCKET` / `_ACCESS_KEY` / `_SECRET_KEY` / `_PUBLIC_URL` | S3-compatible object storage for uploads (POD photos, documents). |
| `GOOGLE_PLACES_API_KEY` | Port/address autocomplete. |
| `GOOGLE_CLIENT_ID` / `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth sign-in (optional). |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_EMAIL` / `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Web-push notifications. |
| `REDIS_URL` | Distributed rate-limiting (falls back to in-memory if unset). |
| `ADMIN_EMAILS` | Comma-separated addresses that receive admin alerts. |
| `IMAP_*`, `AISSTREAM_API_KEY`, `DVLA_API_KEY`, `EU_VEHICLE_API_KEY` | Supplementary integrations (inbound email parsing, vessel AIS, vehicle lookups). |
| `TRUSTED_PROXY_COUNT` | Number of trusted proxies for client-IP resolution. |

---

## 2. Deploy (Railway)

1. Connect the repo; Railway builds from `Dockerfile`.
2. Set all §1 variables in **Variables** (paste values raw — no quotes).
3. On deploy, the container applies the schema and starts `node server.js`.
4. Health check: `GET /api/health`.
5. **Stripe webhook:** in the Stripe dashboard add an endpoint → `https://<app>/api/webhooks/stripe`, subscribe to `checkout.session.completed`, `payment_intent.payment_failed`, `charge.refunded` (+ related), and copy the signing secret into `STRIPE_WEBHOOK_SECRET`.
6. **Stripe Connect:** enable Connect (Express) so carriers can onboard and receive payouts.

---

## 3. Subsystems

### 3.1 Payments & escrow
- Checkout charges the **platform** balance (separate charges & transfers), not a destination charge.
- The carrier's payout is **held** until the booking is `DELIVERED`, then transferred (`lib/payout.ts`).
- Platform fee: default 10% (`PLATFORM_FEE_PERCENT` env), **editable in Admin → Settings → Platform VAT & fee**; applied to new bookings. Existing bookings keep their captured fee/payout.

### 3.2 VAT (`lib/vat.ts`)
- 27 EU standard rates (2026) + GB. Determination follows place-of-supply: **domestic**, **reverse charge** (intra-EU B2B with a VIES-verified number), **B2C** (supplier-country or Art. 50 departure country for transport of goods), **export/out-of-scope**.
- VAT numbers are verified live against **EU VIES**; reverse charge requires a positively verified number.
- VAT is **added at checkout** on top of the net (listing) price; the snapshot is stored on the booking so invoices never drift.
- Configure via the `PLATFORM_VAT_*` vars. **Not a substitute for professional tax advice** — the engine covers standard cases and fails safe (over-collects when uncertain).

### 3.3 Refunds & ledger (`lib/refund.ts`, `lib/ledger.ts`)
- One shared `processRefund()` behind every entry point (shipper route, admin bookings UI, dispute resolution): **atomic** (conditional DB claim → 409 on races), **idempotent** (Stripe idempotency key), **partial-aware** (`refundedAmount` + `PARTIALLY_REFUNDED`; booking is `REFUNDED` only when refunds reach gross).
- VAT is refunded proportionally; only the carrier's proportional share is clawed back.
- Every movement (CHARGE/PAYOUT/PAYOUT_REVERSAL/REFUND) is written to the `Transaction` ledger → **Admin → Transactions**.

### 3.4 Invoicing (`lib/invoice.ts`)
- Real server-side PDFs via `pdf-lib` (no headless browser). Viewer-aware: shippers get an **Invoice**, carriers a **Payout statement**.
- Stable invoice number assigned once at payment. Routes: `/api/bookings/[id]/invoice` (HTML) and `/invoice/pdf` (PDF). Emailed links use scoped, read-only tokens.

### 3.5 Email (`lib/email.ts`)
- Priority: SMTP → Resend → log-only (no provider ⇒ nothing is delivered, calls just log).
- Attachments supported (invoice/payout PDFs on receipts).
- **Test delivery:** Admin → Settings → **Send test emails** sends the full suite (with PDFs) to an address and reports whether a provider was reached.

### 3.6 Scheduler (`.github/workflows/cron.yml`)
Cron endpoints (all `POST`, guarded by `x-cron-secret`): `expire-checkouts`, `recurring`, `digest`, `expire-listings`, `check-documents`, `cleanup-stale`.
- Driven by a GitHub Actions schedule. **Set repo secrets** `APP_BASE_URL` and `CRON_SECRET` (Settings → Secrets and variables → Actions), and the same `CRON_SECRET` in Railway.
- Run any job on demand via the workflow's **Run workflow** button.

### 3.7 Operations agents (`lib/agents/`)
Agent "teams" run daily (`/api/cron/agents`) and propose actions into an
**approval queue** — Admin → **Operations**:
- **Ops** — release stuck carrier payouts, close sold-out listings.
- **Support** — escalate ageing disputes, nudge unpaid bookings, **AI dispute triage** (recommend priority + resolution as internal notes), **AI customer-service reply** (draft and, on approval, send the customer a message).
- **Marketing** — draft on-brand re-engagement campaigns.
- **Finance** — backfill missing CHARGE/PAYOUT ledger rows (reconciliation), flag over-refunds.
- **IT** — nudge carriers with no connected Stripe account to onboard so payouts unblock, flag paid bookings stuck in PENDING, fix oversold (negative-capacity) listings.

AI-backed agents (triage, customer reply, campaign copy) need `ANTHROPIC_API_KEY`; without it they stay dormant and the rule-based agents still run. Nothing
with side-effects runs until you Approve (which executes it) or a per-category
**Automation** policy auto-approves proposals above a confidence threshold.
Approve/reject decisions + feedback are stored and fed back to the agents as
examples. Add a new action by dropping an `Agent` into `lib/agents/*` and the
registry — it appears in the queue and Automation list automatically. Auto-
approval executes real actions (payouts, notifications, listing changes), so
enable it only per-category once you've watched it behave.

### 3.8 Storage, CRM/AI, notifications
- Uploads go to S3-compatible storage (`STORAGE_*`); without it, upload features degrade.
- CRM supplier discovery/enrichment and campaign copy use `ANTHROPIC_API_KEY`; AI-guessed contacts are tagged `unverified` and excluded from campaign sends until a human verifies.
- Notifications honour per-category user preferences (Profile → Notification preferences); the weekly digest respects its own toggle.

---

## 4. Go-live checklist
- [ ] All §1 **Required** vars set in Railway (live Stripe keys, real `NEXTAUTH_SECRET`, correct `NEXTAUTH_URL`).
- [ ] `PLATFORM_VAT_COUNTRY` / `_NUMBER` / `_REGISTERED` confirmed with your accountant.
- [ ] Email provider set (`SMTP_*` or `RESEND_API_KEY`) + `EMAIL_FROM` on a domain that passes SPF/DKIM.
- [ ] Stripe webhook endpoint added and `STRIPE_WEBHOOK_SECRET` set; Connect enabled.
- [ ] GitHub secrets `APP_BASE_URL` + `CRON_SECRET` set; `CRON_SECRET` matches Railway.
- [ ] Object storage configured if you accept uploads.
- [ ] `ANTHROPIC_API_KEY` set if using CRM/AI features.

## 5. Verify in production
1. **Email:** Admin → Settings → Send test emails → confirm the banner says delivered and the mail arrives (with PDFs).
2. **Payment → invoice:** make a test booking and pay (Stripe test mode) → booking becomes `CONFIRMED`, receipt email arrives, invoice PDF downloads, a `CHARGE` row appears in Admin → Transactions.
3. **VAT:** set a shipper country/VAT number and confirm the checkout total and invoice show the expected treatment (domestic rate vs reverse charge).
4. **Refund:** Admin → Bookings → Refund (try a partial) → status becomes `PARTIALLY_REFUNDED`, a `REFUND` (and `PAYOUT_REVERSAL` if released) row appears; Finance report reflects the reversed VAT.
5. **Scheduler:** trigger the workflow manually (Run workflow → `expire-checkouts`) → expect HTTP 200.
6. **Reports:** Admin → Finance (per-currency VAT) and Transactions (CSV export) return data.

## 6. Common operations
- **Issue a refund:** Admin → Bookings → **Refund** (full or partial). Never set payment status by hand — it won't move money.
- **File VAT:** Admin → Finance → pick period → per-currency **Net VAT due** → Download CSV.
- **Reconcile money:** Admin → Transactions → filter/search → CSV.
- **Resend a carrier's statement / an invoice:** the links live on the dashboard and in the payout/receipt emails (`/api/bookings/[id]/invoice/pdf`).
- **Send a one-off digest to yourself:** `POST /api/cron/digest` with `x-cron-secret` and body `{ "onlyUserId": "<id>" }`.
- **Rotate a secret:** update in Railway (and GitHub for `CRON_SECRET`); redeploy.

---
_Generated as part of the platform build. Keep VAT rates (`lib/vat.ts`, `RATES_EFFECTIVE`) reviewed periodically — rates change._
