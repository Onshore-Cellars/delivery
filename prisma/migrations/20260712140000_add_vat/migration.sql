-- User VAT / tax status
ALTER TABLE "User" ADD COLUMN "vatNumber" TEXT;
ALTER TABLE "User" ADD COLUMN "vatNumberValid" BOOLEAN;
ALTER TABLE "User" ADD COLUMN "vatNumberCheckedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "vatBusinessName" TEXT;
ALTER TABLE "User" ADD COLUMN "isBusiness" BOOLEAN NOT NULL DEFAULT false;

-- Booking VAT snapshot
ALTER TABLE "Booking" ADD COLUMN "vatAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Booking" ADD COLUMN "vatRate" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Booking" ADD COLUMN "vatTreatment" TEXT;
ALTER TABLE "Booking" ADD COLUMN "vatNote" TEXT;
ALTER TABLE "Booking" ADD COLUMN "vatSupplierNumber" TEXT;
ALTER TABLE "Booking" ADD COLUMN "vatCustomerNumber" TEXT;
ALTER TABLE "Booking" ADD COLUMN "vatCustomerCountry" TEXT;
