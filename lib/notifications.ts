import prisma from './prisma'
import { sendEmail, bookingConfirmationEmail, statusUpdateEmail, newMessageEmail, bidReceivedEmail } from './email'
import { NotificationType } from '@prisma/client'

interface CreateNotificationParams {
  userId: string
  type: NotificationType
  title: string
  message: string
  linkUrl?: string
  metadata?: Record<string, unknown>
  sendEmailNotification?: boolean
}

export async function createNotification(params: CreateNotificationParams) {
  const { userId, type, title, message, linkUrl, metadata, sendEmailNotification = true } = params

  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        linkUrl: linkUrl || null,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    })

    // Send email if user has email notifications enabled
    if (sendEmailNotification) {
      try {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { email: true, name: true, emailNotifications: true },
        })

        if (user?.emailNotifications) {
          await sendEmail({
            to: user.email,
            subject: title,
            html: `<p>Hi ${user.name},</p><p>${message}</p>`,
          })
          await prisma.notification.update({
            where: { id: notification.id },
            data: { emailSent: true },
          })
        }
      } catch (emailError) {
        console.error('Failed to send notification email:', emailError)
      }
    }

    return notification
  } catch (error) {
    console.error('Failed to create notification:', error)
    return null
  }
}

// ─── SPECIFIC NOTIFICATION HELPERS ────────────────────────────────────────────

export async function notifyBookingCreated(booking: {
  id: string
  trackingCode: string
  cargoDescription: string
  totalPrice: number
  currency: string
  shipperId: string
  listing: {
    title: string
    originPort: string
    destinationPort: string
    departureDate: Date
    carrierId: string
    carrier: { name: string; email: string; emailNotifications: boolean }
  }
  shipper: { name: string; email: string; emailNotifications: boolean }
}) {
  const symbols: Record<string, string> = { EUR: '\u20AC', GBP: '\u00A3', USD: '$' }
  const priceStr = `${symbols[booking.currency] || booking.currency}${booking.totalPrice.toFixed(2)}`

  // Notify shipper
  await createNotification({
    userId: booking.shipperId,
    type: 'BOOKING_CREATED',
    title: 'Booking Confirmed',
    message: `Your booking for ${booking.listing.title} has been created. Tracking: ${booking.trackingCode}`,
    linkUrl: `/tracking?code=${booking.trackingCode}`,
    sendEmailNotification: false, // We'll send a proper template
  })

  if (booking.shipper.emailNotifications) {
    const template = bookingConfirmationEmail({
      customerName: booking.shipper.name,
      trackingCode: booking.trackingCode,
      origin: booking.listing.originPort,
      destination: booking.listing.destinationPort,
      departureDate: booking.listing.departureDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
      cargoDescription: booking.cargoDescription,
      totalPrice: priceStr,
    })
    await sendEmail({ to: booking.shipper.email, ...template })
  }

  // Notify carrier
  await createNotification({
    userId: booking.listing.carrierId,
    type: 'BOOKING_CREATED',
    title: 'New Booking Received',
    message: `${booking.shipper.name} booked space on ${booking.listing.title} (${priceStr})`,
    linkUrl: '/dashboard',
  })
}

export async function notifyStatusUpdate(data: {
  bookingId: string
  status: string
  description: string
  location?: string
}) {
  const booking = await prisma.booking.findUnique({
    where: { id: data.bookingId },
    include: {
      shipper: { select: { id: true, name: true, email: true, emailNotifications: true } },
      listing: {
        select: { carrierId: true, carrier: { select: { id: true, name: true } } },
      },
    },
  })

  if (!booking) return

  // Notify shipper
  await createNotification({
    userId: booking.shipper.id,
    type: 'BOOKING_STATUS_UPDATE',
    title: `Shipment ${data.status.replace('_', ' ')}`,
    message: data.description,
    linkUrl: `/tracking?code=${booking.trackingCode}`,
    sendEmailNotification: false,
  })

  if (booking.shipper.emailNotifications && booking.trackingCode) {
    const template = statusUpdateEmail({
      customerName: booking.shipper.name,
      trackingCode: booking.trackingCode,
      status: data.status,
      description: data.description,
      location: data.location,
    })
    await sendEmail({ to: booking.shipper.email, ...template })
  }
}

export async function notifyNewMessage(data: {
  recipientId: string
  senderId: string
  preview: string
}) {
  const [recipient, sender] = await Promise.all([
    prisma.user.findUnique({ where: { id: data.recipientId }, select: { name: true, email: true, emailNotifications: true } }),
    prisma.user.findUnique({ where: { id: data.senderId }, select: { name: true } }),
  ])

  if (!recipient || !sender) return

  await createNotification({
    userId: data.recipientId,
    type: 'MESSAGE_RECEIVED',
    title: `Message from ${sender.name}`,
    message: data.preview.slice(0, 100),
    linkUrl: '/messages',
    sendEmailNotification: false,
  })

  if (recipient.emailNotifications) {
    const template = newMessageEmail({
      recipientName: recipient.name,
      senderName: sender.name,
      preview: data.preview.slice(0, 200),
    })
    await sendEmail({ to: recipient.email, ...template })
  }
}

export async function notifyBidReceived(data: {
  carrierId: string
  bidderName: string
  amount: number
  currency: string
  listingTitle: string
  weightKg: number
  volumeM3: number
}) {
  const carrier = await prisma.user.findUnique({
    where: { id: data.carrierId },
    select: { name: true, email: true, emailNotifications: true },
  })

  if (!carrier) return

  const symbols: Record<string, string> = { EUR: '\u20AC', GBP: '\u00A3', USD: '$' }
  const amountStr = `${symbols[data.currency] || data.currency}${data.amount.toFixed(2)}`

  await createNotification({
    userId: data.carrierId,
    type: 'BID_RECEIVED',
    title: 'New Bid Received',
    message: `${data.bidderName} bid ${amountStr} on ${data.listingTitle}`,
    linkUrl: '/dashboard',
    sendEmailNotification: false,
  })

  if (carrier.emailNotifications) {
    const template = bidReceivedEmail({
      carrierName: carrier.name,
      bidderName: data.bidderName,
      amount: amountStr,
      listingTitle: data.listingTitle,
      weightKg: data.weightKg,
      volumeM3: data.volumeM3,
    })
    await sendEmail({ to: carrier.email, ...template })
  }
}
