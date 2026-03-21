import prisma from '@/lib/prisma'

export async function logAudit(params: {
  userId?: string
  targetId?: string
  action: string
  details?: Record<string, unknown>
  ipAddress?: string
}) {
  await prisma.auditLog.create({
    data: {
      userId: params.userId,
      targetId: params.targetId,
      action: params.action,
      details: params.details ? JSON.stringify(params.details) : undefined,
      ipAddress: params.ipAddress,
    },
  })
}
