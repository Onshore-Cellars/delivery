-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CARRIER', 'SUPPLIER', 'YACHT_OWNER', 'ADMIN');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('DRAFT', 'ACTIVE', 'FULL', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('QUOTE_REQUESTED', 'QUOTED', 'PENDING', 'CONFIRMED', 'PICKED_UP', 'IN_TRANSIT', 'CUSTOMS_HOLD', 'DELIVERED', 'CANCELLED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'PAID', 'REFUNDED', 'FAILED');

-- CreateEnum
CREATE TYPE "BidStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('BOOKING_CREATED', 'BOOKING_CONFIRMED', 'BOOKING_STATUS_UPDATE', 'BOOKING_CANCELLED', 'BID_RECEIVED', 'BID_ACCEPTED', 'BID_REJECTED', 'QUOTE_REQUESTED', 'QUOTE_RECEIVED', 'MESSAGE_RECEIVED', 'PAYMENT_RECEIVED', 'PAYMENT_FAILED', 'REVIEW_RECEIVED', 'LISTING_EXPIRING', 'SYSTEM');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'SYSTEM', 'QUOTE', 'FILE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "phone" TEXT,
    "company" TEXT,
    "bio" TEXT,
    "avatarUrl" TEXT,
    "website" TEXT,
    "address" TEXT,
    "city" TEXT,
    "country" TEXT,
    "stripeCustomerId" TEXT,
    "stripeAccountId" TEXT,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "smsNotifications" BOOLEAN NOT NULL DEFAULT false,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Listing" (
    "id" TEXT NOT NULL,
    "carrierId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "vehicleType" TEXT NOT NULL,
    "vehicleName" TEXT,
    "hasRefrigeration" BOOLEAN NOT NULL DEFAULT false,
    "hasTailLift" BOOLEAN NOT NULL DEFAULT false,
    "hasGPS" BOOLEAN NOT NULL DEFAULT true,
    "insuranceValue" DOUBLE PRECISION,
    "originPort" TEXT NOT NULL,
    "originRegion" TEXT,
    "originCountry" TEXT,
    "originLat" DOUBLE PRECISION,
    "originLng" DOUBLE PRECISION,
    "destinationPort" TEXT NOT NULL,
    "destinationRegion" TEXT,
    "destinationCountry" TEXT,
    "destinationLat" DOUBLE PRECISION,
    "destinationLng" DOUBLE PRECISION,
    "stops" TEXT,
    "estimatedDistance" DOUBLE PRECISION,
    "departureDate" TIMESTAMP(3) NOT NULL,
    "estimatedArrival" TIMESTAMP(3),
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurringSchedule" TEXT,
    "totalCapacityKg" DOUBLE PRECISION NOT NULL,
    "totalCapacityM3" DOUBLE PRECISION NOT NULL,
    "availableKg" DOUBLE PRECISION NOT NULL,
    "availableM3" DOUBLE PRECISION NOT NULL,
    "maxItemLength" DOUBLE PRECISION,
    "maxItemWidth" DOUBLE PRECISION,
    "maxItemHeight" DOUBLE PRECISION,
    "pricePerKg" DOUBLE PRECISION,
    "pricePerM3" DOUBLE PRECISION,
    "flatRate" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "minimumCharge" DOUBLE PRECISION,
    "biddingEnabled" BOOLEAN NOT NULL DEFAULT false,
    "minBidPrice" DOUBLE PRECISION,
    "acceptedCargo" TEXT,
    "restrictedItems" TEXT,
    "status" "ListingStatus" NOT NULL DEFAULT 'ACTIVE',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "shipperId" TEXT NOT NULL,
    "cargoDescription" TEXT NOT NULL,
    "cargoType" TEXT,
    "weightKg" DOUBLE PRECISION NOT NULL,
    "volumeM3" DOUBLE PRECISION NOT NULL,
    "itemCount" INTEGER NOT NULL DEFAULT 1,
    "specialHandling" TEXT,
    "temperatureReq" TEXT,
    "isFragile" BOOLEAN NOT NULL DEFAULT false,
    "isDangerous" BOOLEAN NOT NULL DEFAULT false,
    "customsRequired" BOOLEAN NOT NULL DEFAULT false,
    "declaredValue" DOUBLE PRECISION,
    "pickupAddress" TEXT,
    "pickupCity" TEXT,
    "pickupCountry" TEXT,
    "pickupContact" TEXT,
    "pickupPhone" TEXT,
    "pickupEmail" TEXT,
    "pickupDate" TIMESTAMP(3),
    "pickupNotes" TEXT,
    "deliveryAddress" TEXT,
    "deliveryCity" TEXT,
    "deliveryCountry" TEXT,
    "deliveryContact" TEXT,
    "deliveryPhone" TEXT,
    "deliveryEmail" TEXT,
    "deliveryNotes" TEXT,
    "yachtName" TEXT,
    "berthNumber" TEXT,
    "marinaName" TEXT,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "platformFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "carrierPayout" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "stripePaymentId" TEXT,
    "stripePaymentIntentId" TEXT,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "trackingCode" TEXT,
    "estimatedDelivery" TIMESTAMP(3),
    "actualDelivery" TIMESTAMP(3),
    "podSignature" TEXT,
    "podPhotoUrl" TEXT,
    "podNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bid" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "bidderId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "weightKg" DOUBLE PRECISION NOT NULL,
    "volumeM3" DOUBLE PRECISION NOT NULL,
    "message" TEXT,
    "cargoType" TEXT,
    "status" "BidStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3),
    "counterOffer" DOUBLE PRECISION,
    "counterMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bid_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL,
    "listingId" TEXT,
    "requesterId" TEXT NOT NULL,
    "providerId" TEXT,
    "originPort" TEXT NOT NULL,
    "destinationPort" TEXT NOT NULL,
    "cargoDescription" TEXT NOT NULL,
    "cargoType" TEXT,
    "weightKg" DOUBLE PRECISION NOT NULL,
    "volumeM3" DOUBLE PRECISION NOT NULL,
    "preferredDate" TIMESTAMP(3),
    "specialRequirements" TEXT,
    "quotedPrice" DOUBLE PRECISION,
    "quotedCurrency" TEXT NOT NULL DEFAULT 'EUR',
    "validUntil" TIMESTAMP(3),
    "responseMessage" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackingEvent" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "location" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "description" TEXT NOT NULL,
    "photoUrl" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrackingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "communicationRating" INTEGER,
    "timelinessRating" INTEGER,
    "conditionRating" INTEGER,
    "response" TEXT,
    "responseAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "linkUrl" TEXT,
    "metadata" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "user1Id" TEXT NOT NULL,
    "user2Id" TEXT NOT NULL,
    "subject" TEXT,
    "bookingRef" TEXT,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" "MessageType" NOT NULL DEFAULT 'TEXT',
    "attachmentUrl" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "Listing_carrierId_idx" ON "Listing"("carrierId");

-- CreateIndex
CREATE INDEX "Listing_status_idx" ON "Listing"("status");

-- CreateIndex
CREATE INDEX "Listing_departureDate_idx" ON "Listing"("departureDate");

-- CreateIndex
CREATE INDEX "Listing_originPort_idx" ON "Listing"("originPort");

-- CreateIndex
CREATE INDEX "Listing_destinationPort_idx" ON "Listing"("destinationPort");

-- CreateIndex
CREATE INDEX "Listing_featured_idx" ON "Listing"("featured");

-- CreateIndex
CREATE INDEX "Listing_status_departureDate_idx" ON "Listing"("status", "departureDate");

-- CreateIndex
CREATE INDEX "Listing_originPort_destinationPort_idx" ON "Listing"("originPort", "destinationPort");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_trackingCode_key" ON "Booking"("trackingCode");

-- CreateIndex
CREATE INDEX "Booking_listingId_idx" ON "Booking"("listingId");

-- CreateIndex
CREATE INDEX "Booking_shipperId_idx" ON "Booking"("shipperId");

-- CreateIndex
CREATE INDEX "Booking_status_idx" ON "Booking"("status");

-- CreateIndex
CREATE INDEX "Booking_trackingCode_idx" ON "Booking"("trackingCode");

-- CreateIndex
CREATE INDEX "Booking_paymentStatus_idx" ON "Booking"("paymentStatus");

-- CreateIndex
CREATE INDEX "Booking_listingId_status_idx" ON "Booking"("listingId", "status");

-- CreateIndex
CREATE INDEX "Booking_shipperId_status_idx" ON "Booking"("shipperId", "status");

-- CreateIndex
CREATE INDEX "Bid_listingId_idx" ON "Bid"("listingId");

-- CreateIndex
CREATE INDEX "Bid_bidderId_idx" ON "Bid"("bidderId");

-- CreateIndex
CREATE INDEX "Bid_status_idx" ON "Bid"("status");

-- CreateIndex
CREATE INDEX "Quote_requesterId_idx" ON "Quote"("requesterId");

-- CreateIndex
CREATE INDEX "Quote_providerId_idx" ON "Quote"("providerId");

-- CreateIndex
CREATE INDEX "Quote_status_idx" ON "Quote"("status");

-- CreateIndex
CREATE INDEX "TrackingEvent_bookingId_idx" ON "TrackingEvent"("bookingId");

-- CreateIndex
CREATE INDEX "TrackingEvent_timestamp_idx" ON "TrackingEvent"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "Review_bookingId_key" ON "Review"("bookingId");

-- CreateIndex
CREATE INDEX "Review_targetId_idx" ON "Review"("targetId");

-- CreateIndex
CREATE INDEX "Review_authorId_idx" ON "Review"("authorId");

-- CreateIndex
CREATE INDEX "Review_rating_idx" ON "Review"("rating");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_read_idx" ON "Notification"("read");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_read_createdAt_idx" ON "Notification"("userId", "read", "createdAt");

-- CreateIndex
CREATE INDEX "Conversation_user1Id_idx" ON "Conversation"("user1Id");

-- CreateIndex
CREATE INDEX "Conversation_user2Id_idx" ON "Conversation"("user2Id");

-- CreateIndex
CREATE INDEX "Conversation_lastMessageAt_idx" ON "Conversation"("lastMessageAt");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_user1Id_user2Id_key" ON "Conversation"("user1Id", "user2Id");

-- CreateIndex
CREATE INDEX "Message_conversationId_idx" ON "Message"("conversationId");

-- CreateIndex
CREATE INDEX "Message_senderId_idx" ON "Message"("senderId");

-- CreateIndex
CREATE INDEX "Message_createdAt_idx" ON "Message"("createdAt");

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_carrierId_fkey" FOREIGN KEY ("carrierId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_shipperId_fkey" FOREIGN KEY ("shipperId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_bidderId_fkey" FOREIGN KEY ("bidderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackingEvent" ADD CONSTRAINT "TrackingEvent_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_user1Id_fkey" FOREIGN KEY ("user1Id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_user2Id_fkey" FOREIGN KEY ("user2Id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
