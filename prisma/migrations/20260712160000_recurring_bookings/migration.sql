CREATE TABLE "RecurringBooking" (
  "id" TEXT NOT NULL,
  "shipperId" TEXT NOT NULL,
  "listingId" TEXT NOT NULL,
  "cargoDescription" TEXT NOT NULL,
  "cargoType" TEXT,
  "weightKg" DOUBLE PRECISION NOT NULL,
  "volumeM3" DOUBLE PRECISION NOT NULL,
  "timeWindow" TEXT,
  "notes" TEXT,
  "frequency" TEXT NOT NULL,
  "dayOfWeek" INTEGER,
  "dayOfMonth" INTEGER,
  "nextRunAt" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3),
  "remainingCount" INTEGER,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "lastGeneratedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RecurringBooking_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "RecurringBooking_active_nextRunAt_idx" ON "RecurringBooking"("active", "nextRunAt");
CREATE INDEX "RecurringBooking_shipperId_idx" ON "RecurringBooking"("shipperId");
ALTER TABLE "RecurringBooking" ADD CONSTRAINT "RecurringBooking_shipperId_fkey" FOREIGN KEY ("shipperId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RecurringBooking" ADD CONSTRAINT "RecurringBooking_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
