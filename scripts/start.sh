#!/bin/sh
# Production startup: apply committed migrations, then start the server.
#
# Uses `prisma migrate deploy` — never `db push` — so the running schema can
# only change through reviewed, committed migration files and destructive
# drift can't be applied silently on boot.
#
# Databases that predate this script were synced with `db push`, so their
# schema is current but _prisma_migrations may be missing rows. In that case
# `migrate deploy` fails (P3005 / duplicate objects); we baseline the
# migrations that existed at cutover as already-applied, then deploy again.
# Migrations added AFTER this list are always applied for real.
set -u

SCHEMA="./prisma/schema.prisma"

BASELINE_MIGRATIONS="
20260315084934_init
20260321000000_add_missing_schema
20260712120000_add_payout_tracking
20260712130000_add_invoice_number
20260712140000_add_vat
20260712150000_notification_prefs
20260712160000_recurring_bookings
20260712170000_refund_integrity
20260712180000_transaction_ledger
20260712190000_platform_settings
20260712200000_agent_ops
20260712210000_booking_status_enum_values
"

echo "[start] Applying database migrations (prisma migrate deploy)…"
if ! prisma migrate deploy --schema "$SCHEMA"; then
  echo "[start] migrate deploy failed — baselining pre-cutover migrations and retrying…"
  for m in $BASELINE_MIGRATIONS; do
    prisma migrate resolve --applied "$m" --schema "$SCHEMA" 2>/dev/null || true
  done
  if ! prisma migrate deploy --schema "$SCHEMA"; then
    echo "[start] FATAL: migrations could not be applied. Refusing to start against an unknown schema." >&2
    echo "[start] Inspect with: prisma migrate status --schema $SCHEMA" >&2
    exit 1
  fi
fi

echo "[start] Migrations up to date. Starting server."
exec node server.js
