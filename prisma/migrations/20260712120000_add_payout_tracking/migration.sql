-- Escrow payout tracking (separate charges & transfers).
-- Funds are charged to the platform balance at checkout and transferred to the
-- carrier's connected account on delivery; these columns record that transfer.
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "stripeTransferId" TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "payoutTransferredAt" TIMESTAMP(3);
