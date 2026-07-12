-- Stable, unique invoice number + issue date, assigned once at payment time.
ALTER TABLE "Booking" ADD COLUMN "invoiceNumber" TEXT;
ALTER TABLE "Booking" ADD COLUMN "invoiceIssuedAt" TIMESTAMP(3);
CREATE UNIQUE INDEX "Booking_invoiceNumber_key" ON "Booking"("invoiceNumber");
