// IMAP email sync — fetches emails from mailbox for CRM inbox

import { ImapFlow } from 'imapflow'
import { simpleParser, ParsedMail } from 'mailparser'
import prisma from './prisma'

const IMAP_CONFIG = {
  host: process.env.IMAP_HOST || 'onshoredelivery-com.freeolamail.net',
  port: parseInt(process.env.IMAP_PORT || '993', 10),
  secure: true,
  auth: {
    user: process.env.IMAP_USER || '',
    pass: process.env.IMAP_PASS || '',
  },
  logger: false as const,
}

function isImapConfigured(): boolean {
  return !!(process.env.IMAP_HOST && process.env.IMAP_USER && process.env.IMAP_PASS)
}

function extractSnippet(text: string | undefined, maxLen = 200): string {
  if (!text) return ''
  return text.replace(/\s+/g, ' ').trim().slice(0, maxLen)
}

function extractEmail(addr: string): string {
  const match = addr.match(/<([^>]+)>/)
  return match ? match[1] : addr
}

interface SyncResult {
  synced: number
  skipped: number
  errors: number
  folder: string
}

/**
 * Sync emails from an IMAP folder into the database.
 * Fetches the last `limit` messages by sequence number.
 */
export async function syncFolder(
  folder: string = 'INBOX',
  limit: number = 50
): Promise<SyncResult> {
  if (!isImapConfigured()) {
    throw new Error('IMAP not configured. Set IMAP_HOST, IMAP_USER, IMAP_PASS.')
  }

  const client = new ImapFlow(IMAP_CONFIG)
  const result: SyncResult = { synced: 0, skipped: 0, errors: 0, folder }

  try {
    await client.connect()
    const lock = await client.getMailboxLock(folder)

    try {
      const mailbox = client.mailbox
      if (!mailbox || !mailbox.exists) {
        return result
      }

      // Fetch last N messages
      const start = Math.max(1, mailbox.exists - limit + 1)
      const range = `${start}:*`

      for await (const message of client.fetch(range, {
        envelope: true,
        source: true,
        uid: true,
        flags: true,
        bodyStructure: true,
      })) {
        try {
          // Check if already synced by UID + folder
          const existingByUid = await prisma.crmEmail.findFirst({
            where: { uid: message.uid, folder },
          })
          if (existingByUid) {
            result.skipped++
            continue
          }

          // Parse the full email source buffer
          const parsed = (await simpleParser(message.source as Buffer)) as unknown as ParsedMail

          const messageId = parsed.messageId || `${folder}-${message.uid}-${Date.now()}`

          // Check by messageId too
          const existingById = await prisma.crmEmail.findUnique({
            where: { messageId },
          })
          if (existingById) {
            result.skipped++
            continue
          }

          const fromAddr = parsed.from?.value?.[0]
          const toAddrs = parsed.to
            ? (Array.isArray(parsed.to) ? parsed.to : [parsed.to])
                .flatMap(t => t.value)
                .map(a => a.address || '')
                .filter(Boolean)
                .join(', ')
            : ''
          const ccAddrs = parsed.cc
            ? (Array.isArray(parsed.cc) ? parsed.cc : [parsed.cc])
                .flatMap(t => t.value)
                .map(a => a.address || '')
                .filter(Boolean)
                .join(', ')
            : null

          const fromEmail = fromAddr?.address || ''
          const fromName = fromAddr?.name || null

          // Try to match with a CRM contact
          let contactId: string | null = null
          if (fromEmail) {
            const contact = await prisma.crmContact.findFirst({
              where: {
                OR: [
                  { email: { equals: fromEmail, mode: 'insensitive' } },
                  { email2: { equals: fromEmail, mode: 'insensitive' } },
                ],
              },
              select: { id: true },
            })
            if (contact) contactId = contact.id
          }

          // Check for attachments
          const attachments = parsed.attachments?.map(a => ({
            filename: a.filename || 'unnamed',
            contentType: a.contentType,
            size: a.size,
          })) || []

          const flags = Array.from(message.flags || []).join(',')
          const isRead = flags.includes('\\Seen')

          await prisma.crmEmail.create({
            data: {
              messageId,
              folder,
              from: fromEmail,
              fromName,
              to: toAddrs,
              cc: ccAddrs,
              replyTo: parsed.replyTo?.value?.[0]?.address || null,
              subject: parsed.subject || '(no subject)',
              textBody: parsed.text || null,
              htmlBody: typeof parsed.html === 'string' ? parsed.html : null,
              snippet: extractSnippet(parsed.text || parsed.subject || ''),
              date: parsed.date || new Date(),
              isRead,
              hasAttachments: attachments.length > 0,
              attachments: attachments.length > 0 ? JSON.stringify(attachments) : null,
              inReplyTo: parsed.inReplyTo || null,
              references: parsed.references
                ? (Array.isArray(parsed.references) ? parsed.references.join(', ') : String(parsed.references))
                : null,
              contactId,
              uid: message.uid,
              flags,
            },
          })

          result.synced++
        } catch (err) {
          console.error('Error processing message:', err)
          result.errors++
        }
      }
    } finally {
      lock.release()
    }

    await client.logout()
  } catch (err) {
    console.error('IMAP sync error:', err)
    throw err
  }

  return result
}

/**
 * Sync multiple standard folders.
 */
export async function syncAllFolders(limit = 50): Promise<SyncResult[]> {
  const folders = ['INBOX', 'Sent', 'INBOX.Sent']
  const results: SyncResult[] = []

  for (const folder of folders) {
    try {
      const r = await syncFolder(folder, limit)
      results.push(r)
    } catch {
      // Folder might not exist, skip
      results.push({ synced: 0, skipped: 0, errors: 0, folder })
    }
  }

  return results
}

/**
 * List available IMAP folders/mailboxes.
 */
export async function listFolders(): Promise<string[]> {
  if (!isImapConfigured()) return []

  const client = new ImapFlow(IMAP_CONFIG)
  const folders: string[] = []

  try {
    await client.connect()
    const list = await client.list()
    for (const item of list) {
      folders.push(item.path)
    }
    await client.logout()
  } catch (err) {
    console.error('IMAP list folders error:', err)
  }

  return folders
}
