import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { sendEmail } from '@/lib/email'

function requireAdmin(request: NextRequest) {
  const token = getTokenFromHeader(request.headers.get('authorization'))
  if (!token) return null
  const decoded = verifyToken(token)
  if (!decoded || decoded.role !== 'ADMIN') return null
  return decoded
}

// GET /api/admin/crm/campaigns — list campaigns, or fetch single campaign with recipients
export async function GET(request: NextRequest) {
  try {
    const admin = requireAdmin(request)
    if (!admin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    // Single campaign with full recipient details
    if (id) {
      const campaign = await prisma.crmCampaign.findUnique({
        where: { id },
      })

      if (!campaign) {
        return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
      }

      const recipients = await prisma.crmCampaignRecipient.findMany({
        where: { campaignId: id },
        include: {
          contact: {
            select: { name: true, email: true, category: true, priority: true },
          },
        },
        orderBy: { sentAt: 'desc' },
      })

      return NextResponse.json({ campaign, recipients })
    }

    const campaigns = await prisma.crmCampaign.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { recipients: true } },
      },
    })

    return NextResponse.json({ campaigns })
  } catch (error) {
    console.error('Campaigns GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/crm/campaigns — create and optionally send a campaign
export async function POST(request: NextRequest) {
  try {
    const admin = requireAdmin(request)
    if (!admin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const body = await request.json()
    const { name, subject, htmlBody, textBody, filters, send, clone, resendFailed } = body

    // Clone an existing campaign as a new draft
    if (clone) {
      const original = await prisma.crmCampaign.findUnique({ where: { id: clone } })
      if (!original) {
        return NextResponse.json({ error: 'Campaign to clone not found' }, { status: 404 })
      }

      const cloned = await prisma.crmCampaign.create({
        data: {
          name: `${original.name} (Copy)`,
          subject: original.subject,
          htmlBody: original.htmlBody,
          textBody: original.textBody,
          filters: (original.filters as Record<string, unknown>) || {},
          status: 'draft',
        },
      })

      // Duplicate recipients as pending
      const originalRecipients = await prisma.crmCampaignRecipient.findMany({
        where: { campaignId: original.id },
        select: { contactId: true, email: true },
      })

      if (originalRecipients.length > 0) {
        await prisma.crmCampaignRecipient.createMany({
          data: originalRecipients.map(r => ({
            campaignId: cloned.id,
            contactId: r.contactId,
            email: r.email,
            status: 'pending',
          })),
        })
      }

      return NextResponse.json({
        campaign: cloned,
        recipientCount: originalRecipients.length,
      }, { status: 201 })
    }

    // Resend to failed/bounced recipients of an existing campaign
    if (resendFailed) {
      const campaign = await prisma.crmCampaign.findUnique({ where: { id: resendFailed } })
      if (!campaign) {
        return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
      }

      // Reset failed/bounced recipients to pending
      await prisma.crmCampaignRecipient.updateMany({
        where: {
          campaignId: campaign.id,
          status: { in: ['failed', 'bounced'] },
        },
        data: { status: 'pending', error: null, sentAt: null },
      })

      // Update campaign status
      await prisma.crmCampaign.update({
        where: { id: campaign.id },
        data: { status: 'sending' },
      })

      // Send in background
      sendCampaignEmails(campaign.id, campaign.subject, campaign.htmlBody, campaign.textBody || undefined)

      return NextResponse.json({ campaign, message: 'Resending to failed recipients' })
    }

    if (!name || !subject || !htmlBody) {
      return NextResponse.json({ error: 'Name, subject, and htmlBody are required' }, { status: 400 })
    }

    // Build contact filter from campaign filters
    const where: Record<string, unknown> = {
      email: { not: null },
      opted_out: false,
    }
    if (filters?.category) where.category = filters.category
    if (filters?.country) where.country = { contains: filters.country, mode: 'insensitive' }
    if (filters?.priority) where.priority = filters.priority
    if (filters?.tags) where.tags = { contains: filters.tags, mode: 'insensitive' }

    // Find matching contacts
    const contacts = await prisma.crmContact.findMany({
      where: where as never,
      select: { id: true, email: true, name: true },
    })

    if (contacts.length === 0) {
      return NextResponse.json({ error: 'No contacts match the filters' }, { status: 400 })
    }

    // Create campaign
    const campaign = await prisma.crmCampaign.create({
      data: {
        name: String(name).trim(),
        subject: String(subject).trim(),
        htmlBody,
        textBody: textBody || null,
        filters: filters || {},
        status: send ? 'sending' : 'draft',
      },
    })

    // Create recipients
    await prisma.crmCampaignRecipient.createMany({
      data: contacts.map(c => ({
        campaignId: campaign.id,
        contactId: c.id,
        email: c.email!,
        status: 'pending',
      })),
    })

    // If send is true, start sending immediately
    if (send) {
      // Send in background — don't await all
      sendCampaignEmails(campaign.id, subject, htmlBody, textBody)
    }

    return NextResponse.json({
      campaign,
      recipientCount: contacts.length,
    }, { status: 201 })
  } catch (error) {
    console.error('Campaigns POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function sendCampaignEmails(campaignId: string, subject: string, htmlBody: string, textBody?: string) {
  try {
    const recipients = await prisma.crmCampaignRecipient.findMany({
      where: { campaignId, status: 'pending' },
      include: { contact: true },
    })

    let sentCount = 0
    let failedCount = 0

    for (const recipient of recipients) {
      try {
        // Personalize email — replace {{name}} placeholder
        const personalizedHtml = htmlBody.replace(/\{\{name\}\}/g, recipient.contact?.name || 'there')
        const personalizedText = textBody?.replace(/\{\{name\}\}/g, recipient.contact?.name || 'there')

        const success = await sendEmail({
          to: recipient.email,
          subject,
          html: personalizedHtml,
          text: personalizedText,
        })

        await prisma.crmCampaignRecipient.update({
          where: { id: recipient.id },
          data: {
            status: success ? 'sent' : 'failed',
            sentAt: success ? new Date() : null,
            error: success ? null : 'Send failed',
          },
        })

        if (success) {
          sentCount++
          // Update contact lastEmailed
          await prisma.crmContact.update({
            where: { id: recipient.contactId },
            data: { lastEmailed: new Date() },
          })
        } else {
          failedCount++
        }

        // Rate limiting — 100ms delay between emails
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (err) {
        failedCount++
        await prisma.crmCampaignRecipient.update({
          where: { id: recipient.id },
          data: { status: 'failed', error: String(err) },
        })
      }
    }

    // Update campaign status
    await prisma.crmCampaign.update({
      where: { id: campaignId },
      data: {
        status: failedCount === recipients.length ? 'failed' : 'sent',
        sentCount,
        failedCount,
        sentAt: new Date(),
      },
    })
  } catch (error) {
    console.error('Campaign send error:', error)
    await prisma.crmCampaign.update({
      where: { id: campaignId },
      data: { status: 'failed' },
    })
  }
}

// DELETE /api/admin/crm/campaigns — delete campaigns
export async function DELETE(request: NextRequest) {
  try {
    const admin = requireAdmin(request)
    if (!admin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const body = await request.json()
    const { ids } = body

    if (!ids?.length) {
      return NextResponse.json({ error: 'ids array required' }, { status: 400 })
    }

    // Delete recipients first (foreign key constraint)
    await prisma.crmCampaignRecipient.deleteMany({
      where: { campaignId: { in: ids } },
    })

    await prisma.crmCampaign.deleteMany({
      where: { id: { in: ids } },
    })

    return NextResponse.json({ deleted: ids.length })
  } catch (error) {
    console.error('Campaigns DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
