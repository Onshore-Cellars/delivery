// Email queue with retry mechanism
// Uses database for persistence so queued emails survive server restarts

import { sendEmail } from './email'
import prisma from './prisma'

interface QueuedEmail {
  id: string
  to: string
  subject: string
  html: string
  text?: string
  attempts: number
  maxAttempts: number
  nextRetryAt: number
  createdAt: number
  lastError?: string
}

// In-memory queue as primary (fast), with DB fallback for persistence
const queue: Map<string, QueuedEmail> = new Map()
let processingInterval: ReturnType<typeof setInterval> | null = null

const MAX_ATTEMPTS = 4
const BASE_DELAY_MS = 2000 // 2s, 4s, 8s, 16s exponential backoff

function generateId(): string {
  return `eq_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

/**
 * Persist a failed email to DB so it survives server restarts
 */
async function persistToDb(item: QueuedEmail) {
  try {
    await prisma.auditLog.create({
      data: {
        action: 'EMAIL_QUEUE',
        targetId: item.id,
        details: JSON.stringify({
          to: item.to,
          subject: item.subject,
          html: item.html,
          text: item.text,
          attempts: item.attempts,
          maxAttempts: item.maxAttempts,
          nextRetryAt: item.nextRetryAt,
          lastError: item.lastError,
        }),
      },
    })
  } catch (e) {
    console.error('[EMAIL_QUEUE] Failed to persist to DB:', e)
  }
}

/**
 * Remove a persisted email from DB after successful send
 */
async function removeFromDb(id: string) {
  try {
    const log = await prisma.auditLog.findFirst({
      where: { action: 'EMAIL_QUEUE', targetId: id },
    })
    if (log) {
      await prisma.auditLog.delete({ where: { id: log.id } })
    }
  } catch {
    // Not critical — will be cleaned up eventually
  }
}

/**
 * On startup, recover any emails that were queued before a restart
 */
async function recoverFromDb() {
  try {
    const logs = await prisma.auditLog.findMany({
      where: { action: 'EMAIL_QUEUE' },
      orderBy: { createdAt: 'asc' },
      take: 50,
    })
    for (const log of logs) {
      if (!log.details || !log.targetId) continue
      try {
        const data = JSON.parse(log.details)
        if (queue.has(log.targetId)) continue // Already in memory
        queue.set(log.targetId, {
          id: log.targetId,
          to: data.to,
          subject: data.subject,
          html: data.html,
          text: data.text,
          attempts: data.attempts || 1,
          maxAttempts: data.maxAttempts || MAX_ATTEMPTS,
          nextRetryAt: Date.now(), // Retry immediately on recovery
          createdAt: log.createdAt.getTime(),
          lastError: data.lastError,
        })
      } catch { /* skip malformed */ }
    }
    if (queue.size > 0) {
      console.log(`[EMAIL_QUEUE] Recovered ${logs.length} emails from DB`)
      ensureProcessing()
    }
  } catch {
    // DB not ready yet — will retry on next queue operation
  }
}

// Recover on module load (non-blocking)
recoverFromDb()

/**
 * Queue an email for sending with automatic retry on failure
 */
export async function queueEmail(options: {
  to: string
  subject: string
  html: string
  text?: string
}): Promise<{ queued: boolean; id: string }> {
  const id = generateId()

  // Try sending immediately
  const sent = await sendEmail(options)

  if (sent) {
    return { queued: false, id } // Sent successfully, no need to queue
  }

  // Failed — add to retry queue
  const item: QueuedEmail = {
    id,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
    attempts: 1,
    maxAttempts: MAX_ATTEMPTS,
    nextRetryAt: Date.now() + BASE_DELAY_MS,
    createdAt: Date.now(),
    lastError: 'Initial send failed',
  }

  queue.set(id, item)
  await persistToDb(item)
  ensureProcessing()

  console.log(`[EMAIL_QUEUE] Queued email ${id} to ${options.to} — will retry in ${BASE_DELAY_MS}ms`)
  return { queued: true, id }
}

/**
 * Process the retry queue
 */
async function processQueue() {
  const now = Date.now()

  for (const [id, item] of queue.entries()) {
    if (item.nextRetryAt > now) continue

    console.log(`[EMAIL_QUEUE] Retrying email ${id} (attempt ${item.attempts + 1}/${item.maxAttempts})`)

    const sent = await sendEmail({
      to: item.to,
      subject: item.subject,
      html: item.html,
      text: item.text,
    })

    if (sent) {
      queue.delete(id)
      await removeFromDb(id)
      console.log(`[EMAIL_QUEUE] Email ${id} sent successfully on retry ${item.attempts + 1}`)
      continue
    }

    item.attempts++
    if (item.attempts >= item.maxAttempts) {
      queue.delete(id)
      // Keep in DB as dead letter record — update details
      try {
        const log = await prisma.auditLog.findFirst({
          where: { action: 'EMAIL_QUEUE', targetId: id },
        })
        if (log) {
          await prisma.auditLog.update({
            where: { id: log.id },
            data: {
              action: 'EMAIL_DEAD_LETTER',
              details: JSON.stringify({
                to: item.to,
                subject: item.subject,
                attempts: item.attempts,
                lastError: `Failed after ${item.maxAttempts} attempts`,
              }),
            },
          })
        }
      } catch { /* non-critical */ }
      console.error(`[EMAIL_QUEUE] Email ${id} to ${item.to} failed after ${item.maxAttempts} attempts — moved to dead letter`)
      continue
    }

    // Exponential backoff: 2s, 4s, 8s, 16s
    const delay = BASE_DELAY_MS * Math.pow(2, item.attempts - 1)
    item.nextRetryAt = now + delay
    item.lastError = `Retry ${item.attempts} failed`
    console.log(`[EMAIL_QUEUE] Email ${id} retry failed — next attempt in ${delay}ms`)
  }

  // Stop processing if queue is empty
  if (queue.size === 0 && processingInterval) {
    clearInterval(processingInterval)
    processingInterval = null
  }
}

function ensureProcessing() {
  if (!processingInterval) {
    processingInterval = setInterval(processQueue, 1000) // Check every second
  }
}

/**
 * Get queue status (for admin monitoring)
 */
export function getQueueStatus() {
  const items = Array.from(queue.values()).map(item => ({
    id: item.id,
    to: item.to,
    subject: item.subject,
    attempts: item.attempts,
    maxAttempts: item.maxAttempts,
    nextRetryAt: new Date(item.nextRetryAt).toISOString(),
    createdAt: new Date(item.createdAt).toISOString(),
    lastError: item.lastError,
  }))

  return {
    queueSize: queue.size,
    processing: processingInterval !== null,
    items,
  }
}

/**
 * Retry a specific failed email
 */
export function retryEmail(id: string): boolean {
  const item = queue.get(id)
  if (!item) return false
  item.nextRetryAt = Date.now() // Retry immediately
  item.attempts = Math.max(0, item.attempts - 1) // Give it another chance
  ensureProcessing()
  return true
}
