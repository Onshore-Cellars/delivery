-- Per-user session version for revoking stateless JWTs. Bumped on password
-- reset/change; tokens carrying an older version are rejected on session
-- checks (/api/auth/me, /api/auth/refresh). Idempotent for baselined DBs.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "sessionVersion" INTEGER NOT NULL DEFAULT 0;
