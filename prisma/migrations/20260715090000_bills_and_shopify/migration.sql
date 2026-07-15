-- Bill: AI-extracted supplier invoices, reviewed & confirmed by the user
CREATE TABLE "Bill" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "supplierName" TEXT NOT NULL,
    "invoiceNumber" TEXT,
    "invoiceDate" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "subtotal" DOUBLE PRECISION,
    "taxAmount" DOUBLE PRECISION,
    "total" DOUBLE PRECISION NOT NULL,
    "lineItems" TEXT,
    "category" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'confirmed',
    "fileUrl" TEXT,
    "fileKey" TEXT,
    "extractedRaw" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bill_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Bill_userId_idx" ON "Bill"("userId");
CREATE INDEX "Bill_status_idx" ON "Bill"("status");
CREATE INDEX "Bill_invoiceDate_idx" ON "Bill"("invoiceDate");

ALTER TABLE "Bill" ADD CONSTRAINT "Bill_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Shopify webhook orders arrive without an API key
ALTER TABLE "IntegrationOrder" ALTER COLUMN "apiKeyId" DROP NOT NULL;
