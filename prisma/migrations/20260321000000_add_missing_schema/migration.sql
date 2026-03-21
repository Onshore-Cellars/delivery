-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('DRIVERS_LICENSE', 'PASSPORT', 'NATIONAL_ID', 'VEHICLE_REGISTRATION', 'VEHICLE_INSURANCE', 'GOODS_IN_TRANSIT_INSURANCE', 'PORT_ACCESS_PERMIT', 'DANGEROUS_GOODS_CERT', 'OTHER');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "RouteDirection" AS ENUM ('OUTBOUND', 'RETURN', 'BOTH');

-- AlterEnum: Recreate UserRole with CREW value
CREATE TYPE "UserRole_new" AS ENUM ('CARRIER', 'SUPPLIER', 'YACHT_OWNER', 'CREW', 'ADMIN');
ALTER TABLE "User" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
DROP TYPE "UserRole";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";

-- AlterEnum: Recreate MessageType with LOCATION value
CREATE TYPE "MessageType_new" AS ENUM ('TEXT', 'SYSTEM', 'QUOTE', 'FILE', 'LOCATION');
ALTER TABLE "Message" ALTER COLUMN "type" TYPE "MessageType_new" USING ("type"::text::"MessageType_new");
DROP TYPE "MessageType";
ALTER TYPE "MessageType_new" RENAME TO "MessageType";

-- AlterEnum: Recreate NotificationType with all new values
CREATE TYPE "NotificationType_new" AS ENUM ('BOOKING_CREATED', 'BOOKING_CONFIRMED', 'BOOKING_STATUS_UPDATE', 'BOOKING_CANCELLED', 'BID_RECEIVED', 'BID_ACCEPTED', 'BID_REJECTED', 'QUOTE_REQUESTED', 'QUOTE_RECEIVED', 'MESSAGE_RECEIVED', 'PAYMENT_RECEIVED', 'PAYMENT_FAILED', 'REVIEW_RECEIVED', 'LISTING_EXPIRING', 'DOCUMENT_VERIFIED', 'DOCUMENT_REJECTED', 'ROUTE_STARTED', 'ROUTE_ETA_UPDATE', 'DRIVER_ARRIVED', 'RETURN_ROUTE_AVAILABLE', 'SYSTEM');
ALTER TABLE "Notification" ALTER COLUMN "type" TYPE "NotificationType_new" USING ("type"::text::"NotificationType_new");
DROP TYPE "NotificationType";
ALTER TYPE "NotificationType_new" RENAME TO "NotificationType";

-- ─── User: add missing columns ─────────────────────────────────────────────

ALTER TABLE "User" ALTER COLUMN "password" DROP NOT NULL;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "googleId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "canCarry" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "canShip" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "yachtName" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "yachtMMSI" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "yachtIMO" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "yachtFlag" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "yachtLength" DOUBLE PRECISION;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "yachtType" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "homePort" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "homePortId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "specializations" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "marineCertified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "backgroundChecked" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "yearsExperience" INTEGER;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "operatingRegions" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "languagesSpoken" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "suspended" BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS "User_googleId_key" ON "User"("googleId");
CREATE INDEX IF NOT EXISTS "User_yachtMMSI_idx" ON "User"("yachtMMSI");
CREATE INDEX IF NOT EXISTS "User_marineCertified_idx" ON "User"("marineCertified");

-- ─── Listing: add missing columns ──────────────────────────────────────────

ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "vehicleId" TEXT;
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "vehicleReg" TEXT;
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "routeDirection" "RouteDirection" NOT NULL DEFAULT 'OUTBOUND';
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "returnDepartureDate" TIMESTAMP(3);
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "returnEstimatedArrival" TIMESTAMP(3);
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "returnAvailableKg" DOUBLE PRECISION;
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "returnAvailableM3" DOUBLE PRECISION;
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "returnTotalKg" DOUBLE PRECISION;
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "returnTotalM3" DOUBLE PRECISION;
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "returnPricePerKg" DOUBLE PRECISION;
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "returnPricePerM3" DOUBLE PRECISION;
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "returnFlatRate" DOUBLE PRECISION;
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "returnNotes" TEXT;

CREATE INDEX IF NOT EXISTS "Listing_vehicleId_idx" ON "Listing"("vehicleId");
CREATE INDEX IF NOT EXISTS "Listing_routeDirection_idx" ON "Listing"("routeDirection");

-- ─── Booking: add missing columns ──────────────────────────────────────────

ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "cargoLengthCm" DOUBLE PRECISION;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "cargoWidthCm" DOUBLE PRECISION;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "cargoHeightCm" DOUBLE PRECISION;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "cargoImages" TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "yachtMMSI" TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "routeDirection" TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "deliveryTimeWindow" TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "insuranceTier" TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "insurancePremium" DOUBLE PRECISION;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "insuredValue" DOUBLE PRECISION;

-- ─── Quote: add missing column ─────────────────────────────────────────────

ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "packages" TEXT;

-- ─── Notification: add missing column ──────────────────────────────────────

ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "smsSent" BOOLEAN NOT NULL DEFAULT false;

-- ─── CreateTable: Vehicle ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "Vehicle" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "registrationPlate" TEXT,
    "registrationCountry" TEXT,
    "vinNumber" TEXT,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER,
    "vehicleType" TEXT NOT NULL,
    "colour" TEXT,
    "maxPayloadKg" DOUBLE PRECISION,
    "cargoVolumeM3" DOUBLE PRECISION,
    "cargoLengthCm" DOUBLE PRECISION,
    "cargoWidthCm" DOUBLE PRECISION,
    "cargoHeightCm" DOUBLE PRECISION,
    "hasRefrigeration" BOOLEAN NOT NULL DEFAULT false,
    "hasTailLift" BOOLEAN NOT NULL DEFAULT false,
    "hasGPS" BOOLEAN NOT NULL DEFAULT true,
    "hasRacking" BOOLEAN NOT NULL DEFAULT false,
    "insuranceProvider" TEXT,
    "insuranceExpiry" TIMESTAMP(3),
    "goodsInTransitInsurance" BOOLEAN NOT NULL DEFAULT false,
    "goodsInTransitMax" DOUBLE PRECISION,
    "motExpiry" TIMESTAMP(3),
    "roadTaxExpiry" TIMESTAMP(3),
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Vehicle_ownerId_idx" ON "Vehicle"("ownerId");
CREATE INDEX IF NOT EXISTS "Vehicle_registrationPlate_idx" ON "Vehicle"("registrationPlate");

-- ─── CreateTable: Document ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "Document" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "name" TEXT NOT NULL,
    "fileUrl" TEXT,
    "fileKey" TEXT,
    "documentNumber" TEXT,
    "issuingCountry" TEXT,
    "issueDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "status" "DocumentStatus" NOT NULL DEFAULT 'PENDING',
    "reviewNotes" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Document_userId_idx" ON "Document"("userId");
CREATE INDEX IF NOT EXISTS "Document_type_idx" ON "Document"("type");
CREATE INDEX IF NOT EXISTS "Document_status_idx" ON "Document"("status");
CREATE INDEX IF NOT EXISTS "Document_userId_type_idx" ON "Document"("userId", "type");

-- ─── CreateTable: Port ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "Port" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "type" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "countryCode" TEXT,
    "region" TEXT,
    "city" TEXT,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "maxDraft" DOUBLE PRECISION,
    "maxLOA" DOUBLE PRECISION,
    "hasCustoms" BOOLEAN NOT NULL DEFAULT false,
    "hasFuel" BOOLEAN NOT NULL DEFAULT false,
    "hasProvisions" BOOLEAN NOT NULL DEFAULT false,
    "hasCrane" BOOLEAN NOT NULL DEFAULT false,
    "hasStorage" BOOLEAN NOT NULL DEFAULT false,
    "vhfChannel" TEXT,
    "requiresPortPass" BOOLEAN NOT NULL DEFAULT false,
    "requiresDriverID" BOOLEAN NOT NULL DEFAULT false,
    "accessNotes" TEXT,
    "website" TEXT,
    "phone" TEXT,
    "timezone" TEXT,
    "popular" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Port_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Port_code_key" ON "Port"("code");
CREATE INDEX IF NOT EXISTS "Port_country_idx" ON "Port"("country");
CREATE INDEX IF NOT EXISTS "Port_type_idx" ON "Port"("type");
CREATE INDEX IF NOT EXISTS "Port_popular_idx" ON "Port"("popular");
CREATE INDEX IF NOT EXISTS "Port_lat_lng_idx" ON "Port"("lat", "lng");
CREATE INDEX IF NOT EXISTS "Port_name_idx" ON "Port"("name");

-- ─── CreateTable: LiveTracking ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "LiveTracking" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "shareToken" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "heading" DOUBLE PRECISION,
    "speed" DOUBLE PRECISION,
    "lastUpdated" TIMESTAMP(3),
    "stopsTotal" INTEGER NOT NULL DEFAULT 0,
    "stopsCompleted" INTEGER NOT NULL DEFAULT 0,
    "etaMinutes" INTEGER,
    "routePolyline" TEXT,

    CONSTRAINT "LiveTracking_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "LiveTracking_shareToken_key" ON "LiveTracking"("shareToken");
CREATE INDEX IF NOT EXISTS "LiveTracking_bookingId_idx" ON "LiveTracking"("bookingId");
CREATE INDEX IF NOT EXISTS "LiveTracking_shareToken_idx" ON "LiveTracking"("shareToken");
CREATE INDEX IF NOT EXISTS "LiveTracking_isActive_idx" ON "LiveTracking"("isActive");

-- ─── CreateTable: BookingDocument ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "BookingDocument" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fileUrl" TEXT,
    "fileKey" TEXT,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "notes" TEXT,
    "visibleToDriver" BOOLEAN NOT NULL DEFAULT true,
    "visibleToShipper" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingDocument_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "BookingDocument_bookingId_idx" ON "BookingDocument"("bookingId");
CREATE INDEX IF NOT EXISTS "BookingDocument_type_idx" ON "BookingDocument"("type");

-- ─── CreateTable: CommunityPost ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "CommunityPost" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "tags" TEXT,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "views" INTEGER NOT NULL DEFAULT 0,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityPost_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "CommunityPost_category_idx" ON "CommunityPost"("category");
CREATE INDEX IF NOT EXISTS "CommunityPost_authorId_idx" ON "CommunityPost"("authorId");
CREATE INDEX IF NOT EXISTS "CommunityPost_pinned_idx" ON "CommunityPost"("pinned");
CREATE INDEX IF NOT EXISTS "CommunityPost_createdAt_idx" ON "CommunityPost"("createdAt");

-- ─── CreateTable: CommunityReply ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "CommunityReply" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityReply_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "CommunityReply_postId_idx" ON "CommunityReply"("postId");
CREATE INDEX IF NOT EXISTS "CommunityReply_authorId_idx" ON "CommunityReply"("authorId");

-- ─── CreateTable: SavedAddress ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "SavedAddress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'other',
    "address" TEXT NOT NULL,
    "city" TEXT,
    "region" TEXT,
    "country" TEXT,
    "postcode" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "contactName" TEXT,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "notes" TEXT,
    "marinaName" TEXT,
    "berthNumber" TEXT,
    "yachtName" TEXT,
    "portAccessNotes" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedAddress_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "SavedAddress_userId_idx" ON "SavedAddress"("userId");
CREATE INDEX IF NOT EXISTS "SavedAddress_userId_type_idx" ON "SavedAddress"("userId", "type");

-- ─── CreateTable: PushSubscription ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "PushSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "userAgent" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PushSubscription_userId_endpoint_key" ON "PushSubscription"("userId", "endpoint");
CREATE INDEX IF NOT EXISTS "PushSubscription_userId_idx" ON "PushSubscription"("userId");
CREATE INDEX IF NOT EXISTS "PushSubscription_active_idx" ON "PushSubscription"("active");

-- ─── CreateTable: FavouriteCarrier ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "FavouriteCarrier" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "carrierId" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FavouriteCarrier_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "FavouriteCarrier_userId_carrierId_key" ON "FavouriteCarrier"("userId", "carrierId");
CREATE INDEX IF NOT EXISTS "FavouriteCarrier_userId_idx" ON "FavouriteCarrier"("userId");
CREATE INDEX IF NOT EXISTS "FavouriteCarrier_carrierId_idx" ON "FavouriteCarrier"("carrierId");

-- ─── CreateTable: Dispute ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "Dispute" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "raisedById" TEXT NOT NULL,
    "againstId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "description" TEXT NOT NULL,
    "evidence" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "claimAmount" DOUBLE PRECISION,
    "resolution" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dispute_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Dispute_bookingId_idx" ON "Dispute"("bookingId");
CREATE INDEX IF NOT EXISTS "Dispute_raisedById_idx" ON "Dispute"("raisedById");
CREATE INDEX IF NOT EXISTS "Dispute_status_idx" ON "Dispute"("status");

-- ─── CreateTable: RouteStop ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "RouteStop" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "stopOrder" INTEGER NOT NULL,
    "portName" TEXT NOT NULL,
    "region" TEXT,
    "country" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "address" TEXT,
    "estimatedArrival" TIMESTAMP(3),
    "estimatedDeparture" TIMESTAMP(3),
    "stopDurationMins" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RouteStop_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "RouteStop_listingId_idx" ON "RouteStop"("listingId");
CREATE INDEX IF NOT EXISTS "RouteStop_listingId_stopOrder_idx" ON "RouteStop"("listingId", "stopOrder");

-- ─── Foreign Keys ──────────────────────────────────────────────────────────

-- Listing -> Vehicle
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Vehicle -> User
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Document -> User
ALTER TABLE "Document" ADD CONSTRAINT "Document_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- LiveTracking -> Booking
ALTER TABLE "LiveTracking" ADD CONSTRAINT "LiveTracking_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- BookingDocument -> Booking
ALTER TABLE "BookingDocument" ADD CONSTRAINT "BookingDocument_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CommunityReply -> CommunityPost
ALTER TABLE "CommunityReply" ADD CONSTRAINT "CommunityReply_postId_fkey" FOREIGN KEY ("postId") REFERENCES "CommunityPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- SavedAddress -> User
ALTER TABLE "SavedAddress" ADD CONSTRAINT "SavedAddress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- PushSubscription -> User
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- FavouriteCarrier -> User (userId)
ALTER TABLE "FavouriteCarrier" ADD CONSTRAINT "FavouriteCarrier_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- FavouriteCarrier -> User (carrierId)
ALTER TABLE "FavouriteCarrier" ADD CONSTRAINT "FavouriteCarrier_carrierId_fkey" FOREIGN KEY ("carrierId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Dispute -> Booking
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Dispute -> User (raisedById)
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_raisedById_fkey" FOREIGN KEY ("raisedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Dispute -> User (againstId)
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_againstId_fkey" FOREIGN KEY ("againstId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RouteStop -> Listing
ALTER TABLE "RouteStop" ADD CONSTRAINT "RouteStop_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
