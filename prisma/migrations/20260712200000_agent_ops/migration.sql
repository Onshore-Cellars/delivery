CREATE TABLE "AgentTask" (
  "id" TEXT NOT NULL,
  "team" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "reasoning" TEXT NOT NULL DEFAULT '',
  "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.6,
  "payload" TEXT NOT NULL DEFAULT '{}',
  "relatedType" TEXT,
  "relatedId" TEXT,
  "dedupeKey" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "decidedById" TEXT,
  "decidedAt" TIMESTAMP(3),
  "feedback" TEXT,
  "executedAt" TIMESTAMP(3),
  "executionResult" TEXT,
  "error" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AgentTask_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AgentTask_status_idx" ON "AgentTask"("status");
CREATE INDEX "AgentTask_team_status_idx" ON "AgentTask"("team", "status");
CREATE INDEX "AgentTask_kind_idx" ON "AgentTask"("kind");
CREATE INDEX "AgentTask_dedupeKey_idx" ON "AgentTask"("dedupeKey");

CREATE TABLE "AgentPolicy" (
  "key" TEXT NOT NULL,
  "team" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "autoApprove" BOOLEAN NOT NULL DEFAULT false,
  "minConfidence" DOUBLE PRECISION NOT NULL DEFAULT 0.85,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AgentPolicy_pkey" PRIMARY KEY ("key")
);
