-- Add BookingStatus enum values that exist in schema.prisma but were never
-- added by a migration (the running DB has them only because deploys ran
-- `prisma db push`). Idempotent so it is safe on databases that already have them.
ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'ACCEPTED';
ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'REJECTED';
